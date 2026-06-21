import React from 'react';
import './page.css';

function Rules(): JSX.Element {
  return (
    <article className="page">
      <h1>How to play</h1>
      <p>
        <b>Tigers and Goats</b> (Bagh-Chal) is an asymmetric hunt game on a 5×5 board of
        25 points joined by lines. Four <b>tigers</b> hunt twenty <b>goats</b>. The two
        sides want opposite things, and play very differently.
      </p>

      <h2>The board and pieces</h2>
      <ul>
        <li>
          25 points connected by lines — every point joins to its orthogonal neighbours,
          and diagonals run across alternating cells.
        </li>
        <li>
          <b>4 tigers</b> start on the four corner points.
        </li>
        <li>
          <b>20 goats</b> start off the board, waiting to be placed.
        </li>
      </ul>

      <h2>Goal</h2>
      <ul>
        <li>
          🐯 <b>Tigers win</b> by capturing <b>5 goats</b>.
        </li>
        <li>
          🐐 <b>Goats win</b> by <b>trapping every tiger</b> so that no tiger can move.
        </li>
        <li>
          If the goats have no legal move (and none left to place), it&apos;s a{' '}
          <b>draw</b>.
        </li>
      </ul>

      <h2>How a turn works</h2>
      <p>Goats move first, then the sides alternate. The goats play in two phases.</p>
      <ol>
        <li>
          <b>Placement.</b> On each goat turn you drop one goat onto any empty point.
          Goats cannot move during this phase — only place. This lasts until all 20
          goats are on the board. Tigers move (and may capture) throughout.
        </li>
        <li>
          <b>Movement.</b> Once all 20 goats are placed, a goat turn is a single step
          along a line to an adjacent empty point.
        </li>
      </ol>

      <h2>Tigers</h2>
      <p>On its turn a tiger does one of:</p>
      <ul>
        <li>
          <b>Step</b> one point along a line to an adjacent empty point, or
        </li>
        <li>
          <b>Jump</b> straight over an adjacent goat to the empty point directly beyond
          it — this <b>captures</b> (eats) that goat.
        </li>
      </ul>
      <p>
        Tigers never &quot;pass&quot;: if a tiger can jump it isn&apos;t forced to, but
        a tiger with no step and no jump is stuck — and if every tiger is stuck, the
        goats win.
      </p>

      <h2>Goats</h2>
      <p>
        Goats never capture. Their only power is numbers: by placing and moving
        carefully they hem the tigers in. A goat is safe as long as a tiger cannot jump
        it — so never leave a goat with a tiger on one side and an empty point on the
        other.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>
          <b>Goats:</b> don&apos;t hand over free jumps, and build your wall from the
          edges in — points on the rim give tigers fewer places to land.
        </li>
        <li>
          <b>Tigers:</b> always take a capture, and otherwise stay central and mobile so
          you never trap your own tigers.
        </li>
      </ul>
      <p>
        See the <a href="#/strategies">Strategies</a> page for how these ideas rank
        against each other — and against the search AI.
      </p>
    </article>
  );
}

export default Rules;
