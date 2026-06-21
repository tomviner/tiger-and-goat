import React from 'react';
import tournament from './data/tournament.json';
import './page.css';

interface Row {
  name: string;
  kind: string;
  depth: number | null;
  description: string;
  elo: number;
  wins: number;
  draws: number;
  losses: number;
  games: number;
}

interface GridCell {
  goatDepth: number;
  tigerDepth: number;
  goatWins: number;
  draws: number;
  tigerWins: number;
  goatWinRate: number;
}
interface DepthGrid {
  depths: number[];
  games: number;
  rows: GridCell[][];
}

function DepthHeatmap({ grid }: { grid: DepthGrid }): JSX.Element {
  const { depths, games, rows } = grid;
  return (
    <div className="heatmap">
      <div className="heatmapTopAxis">tiger search depth →</div>
      <table>
        <thead>
          <tr>
            <th className="corner" />
            {depths.map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={depths[i]}>
              <th className="rowHead">{depths[i]}</th>
              {row.map((c) => (
                <td
                  key={c.tigerDepth}
                  className={c.goatDepth === c.tigerDepth ? 'cell diag' : 'cell'}
                  style={{
                    background: `hsl(${Math.round(c.goatWinRate * 120)}, 62%, 55%)`,
                  }}
                  title={`goat d${c.goatDepth} vs tiger d${c.tigerDepth} — goat won ${c.goatWins}, drew ${c.draws}, lost ${c.tigerWins} of ${games}`}
                >
                  {Math.round(c.goatWinRate * 100)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="heatmapLegend">
        <span className="heatmapLeftAxis">goat depth ↓</span>
        <span>
          number = % of {games} games the <b>goat</b> wins · 🟩 goat-favoured · 🟥
          tiger-favoured · diagonal = equal skill
        </span>
      </div>
    </div>
  );
}

function Ladder({ title, rows }: { title: string; rows: Row[] }): JSX.Element {
  return (
    <section>
      <h2>{title}</h2>
      <table className="ladder">
        <thead>
          <tr>
            <th>#</th>
            <th>Competitor</th>
            <th>Elo</th>
            <th>W / D / L</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} className={r.kind === 'ai' ? 'aiRow' : ''}>
              <td>{i + 1}</td>
              <td>
                <code>{r.name}</code>
              </td>
              <td className="elo">{r.elo}</td>
              <td className="wdl">
                {r.wins} / {r.draws} / {r.losses}
              </td>
              <td className="desc">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Strategies(): JSX.Element {
  const { goat, tiger, games, depths, totalGames } = tournament;
  const grid = (tournament as { depthGrid?: DepthGrid }).depthGrid;

  return (
    <article className="page">
      <h1>Strategies &amp; tournament</h1>
      <p>
        Every playing style here is either a <b>human-replicable strategy</b> — a rule
        you could follow at the board, reasoning at most one move ahead — or the{' '}
        <b>search AI</b> (Negamax alpha-beta) at a fixed depth. They all played a
        round-robin: every goat competitor against every tiger competitor.
      </p>

      <h2>Is it easier to play tiger or goat?</h2>
      <p>
        The clearest test is the AI against itself at controlled depths. Each cell is
        the share of games the <b>goat</b> wins when a goat searching to one depth meets
        a tiger searching to another (randomised openings, so it&apos;s an average, not
        a single line).
      </p>
      {grid ? <DepthHeatmap grid={grid} /> : null}
      <p>
        Read it two ways. The <b>diagonal</b> (equal depth) is the fair fight: at
        shallow depth the tiger wins — tigers are the easier side for a beginner, since
        just grabbing captures works. As both sides look deeper the goats catch up and
        it tips green: with foresight the goats can wall the tigers in. Off the diagonal
        you can read the <b>handicap</b> — the lower-left is green (a goat that
        out-searches the tiger wins), the upper-right is red. So neither side is
        inherently &quot;easier&quot; with strong play; it&apos;s close, and the side
        that thinks further ahead wins. The advantage of depth is just much bigger for
        goats, who have nothing without it.
      </p>

      <p>
        Each side is also rated with <b>Elo</b> on a single shared scale. Goats only
        ever face tigers (and vice-versa), so the numbers show the ranking <i>within</i>{' '}
        a side and the goat/tiger imbalance <i>between</i> them. The{' '}
        <b>search AI climbs with depth</b>, and even a shallow search outranks the
        one-move heuristics — especially for goats, where looking ahead matters most.
      </p>

      {totalGames === 0 ? (
        <p>
          <em>Tournament results are being computed — check back shortly.</em>
        </p>
      ) : (
        <>
          <Ladder title="🐐 Goat ladder" rows={goat as Row[]} />
          <Ladder title="🐯 Tiger ladder" rows={tiger as Row[]} />
        </>
      )}

      <h2>Method</h2>
      <ul>
        <li>
          Depths tested: {depths.join(', ')}. Strategies break ties with a seeded RNG (
          {games} games per pairing); the AI is deterministic, so AI-vs-AI pairings play
          once and replicate. {totalGames.toLocaleString()} games in total.
        </li>
        <li>
          Elo: win = 1, draw = 0.5, loss = 0, iterated over the whole game set (start
          1500). It&apos;s a relative scale, so only the gaps matter.
        </li>
        <li>
          Reproduce: <code>uv run python -m server.elo_tournament</code>. The one-move
          strategies live in <code>server/strategies.py</code>; the same rules and
          search run in the browser too (this whole site is static).
        </li>
      </ul>
      <p>
        New here? The <a href="#/rules">Rules</a> page explains how tigers and goats
        move, then come back and try these ideas on the <a href="#/">board</a>.
      </p>
    </article>
  );
}

export default Strategies;
