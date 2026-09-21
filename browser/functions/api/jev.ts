type Move = number[];

interface JevRequest {
  state: {
    playerNum: number;
    numGoatsToPlace: number;
    history: number[][][];
  };
  possibleMoves: Move[];
}

interface AiBinding {
  run(
    model: string,
    input: unknown,
    options?: { gateway: { id: string } },
  ): Promise<unknown>;
}

interface FunctionContext {
  request: Request;
  env: { AI: AiBinding };
}

const coordinate = (position: number): string =>
  `${'ABCDE'[position % 5]}${Math.floor(position / 5) + 1}`;

const describeMove = (move: Move): string => move.map(coordinate).join('-');

const isPosition = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) < 25;

const isMove = (value: unknown): value is Move =>
  Array.isArray(value) &&
  value.length >= 1 &&
  value.length <= 3 &&
  value.every(isPosition);

function isJevRequest(value: unknown): value is JevRequest {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<JevRequest>;
  const state = request.state;
  if (!state || typeof state !== 'object') return false;
  if (state.playerNum !== 1 && state.playerNum !== 2) return false;
  if (
    !Number.isInteger(state.numGoatsToPlace) ||
    state.numGoatsToPlace < 0 ||
    state.numGoatsToPlace > 20
  ) {
    return false;
  }
  if (
    !Array.isArray(state.history) ||
    state.history.length < 1 ||
    state.history.length > 20
  ) {
    return false;
  }
  if (
    !state.history.every(
      (position) =>
        Array.isArray(position) &&
        position.length === 2 &&
        position.every((pieces) => Array.isArray(pieces) && pieces.every(isPosition)) &&
        position[0].length === 4 &&
        position[1].length <= 20 &&
        new Set(position[0]).size === position[0].length &&
        new Set(position[1]).size === position[1].length &&
        position[0].every((tiger) => !position[1].includes(tiger)),
    )
  ) {
    return false;
  }
  return (
    Array.isArray(request.possibleMoves) &&
    request.possibleMoves.length >= 1 &&
    request.possibleMoves.length <= 64 &&
    request.possibleMoves.every(isMove)
  );
}

interface JevChoice {
  move: Move;
  description: string;
}

function jevChoices(request: JevRequest): JevChoice[] {
  return request.possibleMoves.map((move) => ({
    move,
    description: describeMove(move),
  }));
}

export function buildJevInput(
  request: JevRequest,
  choices = jevChoices(request),
): Record<string, unknown> {
  const latest = request.state.history[request.state.history.length - 1];
  const side = request.state.playerNum === 1 ? 'goat' : 'tiger';
  const criteria = Object.fromEntries(
    choices.map((choice, index) => [`move_${index}`, choice.description]),
  );

  return {
    state: {
      game: 'Bagh-Chal (Tigers and Goats)',
      objective:
        'Tigers win by capturing five goats. Goats win by trapping all four tigers.',
      side_to_move: side,
      goats_left_to_place: request.state.numGoatsToPlace,
      board: {
        tigers: latest[0].map(coordinate),
        goats: latest[1].map(coordinate),
      },
      rules: {
        board:
          'The board has 25 points joined by lines. A piece may move between two adjacent points only when a line directly connects them. Horizontal and vertical neighbours are always connected. Diagonally neighbouring points are connected only where a diagonal line is drawn on the board. Every supplied choice is legal.',
        turns:
          'Goats move first and turns alternate. While goats remain to place, a goat turn places one goat on any empty point. After all 20 are placed, a goat steps to one adjacent empty connected point.',
        goats:
          'Goats never capture. They win by trapping all four tigers so no tiger has a legal step or jump.',
        tigers:
          'A tiger may step to an adjacent empty connected point, or jump over exactly one adjacent goat along a straight board line into the empty point immediately beyond it.',
        capture:
          'A tiger captures the jumped goat in a straight connected tiger-goat-empty pattern. The tiger lands on the empty point and the middle goat is removed. Tigers win after capturing five goats.',
      },
      strategy: {
        goats:
          'First avoid moves that give tigers an immediate capture. Among equally safe moves, build a connected edge formation, then reduce tiger mobility and close escape routes. Do not isolate goats or open a landing point behind one.',
        tigers:
          'Take useful captures, create multiple jump threats that goats cannot all answer, and preserve mobility so the tigers are not trapped. Prefer central control when no capture is available.',
      },
    },
    questions: {
      move: {
        type: 'choice',
        instructions:
          side === 'goat'
            ? 'Choose the strongest legal move for the goat side. Follow the goat strategy. Minimize immediate tiger captures first; among equally safe choices prefer connected edge positions, restrict tiger mobility, and avoid opening jump lanes.'
            : 'Choose the strongest legal move for the tiger side. Follow the tiger strategy. Prefer a useful immediate capture; otherwise create multiple capture threats while preserving tiger mobility and avoiding traps.',
        criteria,
      },
    },
  };
}

export function moveFromJevResponse(
  value: unknown,
  possibleMoves: Move[],
): { move: Move; confidence: number | null; model: string | null } {
  type JevModelResponse = {
    model?: unknown;
    answers?: { move?: { choice?: unknown; confidence?: unknown } };
  };
  const envelope = value as { result?: unknown };
  const response = (
    envelope?.result && typeof envelope.result === 'object' ? envelope.result : value
  ) as JevModelResponse;
  const choice = response?.answers?.move?.choice;
  const match = typeof choice === 'string' ? /^move_(\d+)$/.exec(choice) : null;
  const index = match ? Number(match[1]) : -1;
  if (!Number.isInteger(index) || index < 0 || index >= possibleMoves.length) {
    throw new Error('Jev returned an invalid move choice');
  }
  return {
    move: possibleMoves[index],
    confidence:
      typeof response.answers?.move?.confidence === 'number'
        ? response.answers.move.confidence
        : null,
    model: typeof response.model === 'string' ? response.model : null,
  };
}

const json = (body: unknown, status = 200): Response =>
  Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });

export async function onRequestPost(context: FunctionContext): Promise<Response> {
  const requestUrl = new URL(context.request.url);
  const origin = context.request.headers.get('origin');
  if (origin && new URL(origin).host !== requestUrl.host) {
    return json({ error: 'Cross-origin requests are not allowed' }, 403);
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!isJevRequest(body)) {
    return json({ error: 'Invalid game state' }, 400);
  }

  try {
    const choices = jevChoices(body);
    const response = await context.env.AI.run(
      'typesafe/jev',
      buildJevInput(body, choices),
      {
        gateway: { id: 'tigergoat-jev' },
      },
    );
    return json(
      moveFromJevResponse(
        response,
        choices.map((choice) => choice.move),
      ),
    );
  } catch (error) {
    console.error('Jev inference failed', error);
    return json({ error: 'Jev could not choose a move' }, 502);
  }
}
