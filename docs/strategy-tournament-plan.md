# Strategy tournament harness

**Goal:** discover, rank, and describe in plain English the strongest strategies
for both sides of Bagh-Chal (Tigers and Goats), by having bot variants compete
and then mining what the winners actually do.

## 10-line plan

1. **Parametrise the bot into a "strategy genome":** evaluation weights (goats eaten, tiger mobility, goat connectivity, centre/edge control), search depth, and an opening-placement bias.
2. **Build an in-process match runner** (extend `server/game.py` self-play, no HTTP) that plays a goat-genome vs a tiger-genome to a result and returns the winner plus the full move log.
3. **Run a tournament** over a population of genomes — round-robin or Swiss, each pairing played from both sides, with fixed seeds for reproducibility.
4. **Rank with Elo**, kept separately for the goat role and the tiger role since the two sides are asymmetric.
5. **Record every game** (genomes, seed, moves, result) to structured JSONL for later analysis.
6. **Iterate the population:** keep the top genomes, mutate their weights, re-run, and repeat until the rankings stabilise.
7. **Mine the winners' games** for recurring patterns — opening squares, goat block/wall shapes, tiger jump set-ups and coordination.
8. **Translate each recurring pattern into an English strategy statement** backed by stats (win rate, how often it appears, which Elo tier uses it).
9. **Rank those English strategies** by the Elo / win-rate of the genomes that employ them, per side.
10. **Emit a ranked, human-readable strategy report**, and feed the strongest patterns back as the bot's opening book and evaluation priors.

## Notes

- Step 2 reuses the existing self-play loop; the timing benchmarks in
  `server/game.py` (`8: 172s`, `9: 99 moves/360s`, `10: 166 moves/1011s`) set the
  per-game cost budget — favour shallower depths and parallel games for volume.
- Determinism (fixed seeds, no wall-clock in the search) is required so a genome's
  Elo is reproducible and regressions are detectable.
- This is the harness that turns the abstract roadmap item "self-play tournaments"
  into ranked, explainable strategies rather than just a stronger black-box bot.
