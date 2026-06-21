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

  return (
    <article className="page">
      <h1>Strategies &amp; tournament</h1>
      <p>
        Every playing style here is either a <b>human-replicable strategy</b> — a rule
        you could follow at the board, reasoning at most one move ahead — or the{' '}
        <b>search AI</b> (Negamax alpha-beta) at a fixed depth. They all played a
        round-robin: every goat competitor against every tiger competitor.
      </p>
      <p>
        Each side is rated with <b>Elo</b> on a single shared scale. Goats only ever
        face tigers (and vice-versa), so the numbers show two things at once: the
        ranking <i>within</i> a side, and the overall goat/tiger imbalance{' '}
        <i>between</i> them — tigers sit far higher because, against simple play, the
        hunt is winnable. Notably, the <b>search AI climbs with depth</b>, and even a
        shallow search outranks the one-move heuristics — especially for goats, where
        looking ahead matters most.
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
