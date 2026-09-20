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

const describeMove = (move: Move): string => {
  if (move.length === 1) {
    return `place at ${coordinate(move[0])}`;
  }
  if (move.length === 2) {
    return `${coordinate(move[0])} to ${coordinate(move[1])}`;
  }
  return `${coordinate(move[0])} captures ${coordinate(move[1])} and lands at ${coordinate(move[2])}`;
};

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
        position.every((pieces) => Array.isArray(pieces) && pieces.every(isPosition)),
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

export function buildJevInput(request: JevRequest): Record<string, unknown> {
  const latest = request.state.history[request.state.history.length - 1];
  const side = request.state.playerNum === 1 ? 'goat' : 'tiger';
  const criteria = Object.fromEntries(
    request.possibleMoves.map((move, index) => [`move_${index}`, describeMove(move)]),
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
    },
    questions: {
      move: {
        type: 'choice',
        instructions: `Choose the strongest legal move for the ${side} side. Prefer captures and immediate wins, avoid immediate losses, and improve the side-to-move position.`,
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
    const response = await context.env.AI.run('typesafe/jev', buildJevInput(body), {
      gateway: { id: 'tigergoat-jev' },
    });
    return json(moveFromJevResponse(response, body.possibleMoves));
  } catch (error) {
    console.error('Jev inference failed', error);
    return json({ error: 'Jev could not choose a move' }, 502);
  }
}
