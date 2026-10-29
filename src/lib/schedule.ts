export type Fixture = { round: number; home: string; away: string };

/**
 * Round-robin schedule using the circle method. With an odd number of teams one
 * team rests each round. `doubleRound` adds the return leg with home and away swapped.
 */
export function roundRobin(teamIds: string[], doubleRound = false): Fixture[] {
  if (new Set(teamIds).size !== teamIds.length) throw new Error("Team ids must be unique");
  if (teamIds.length < 2) return [];

  const slots: (string | null)[] = [...teamIds];
  // The bye takes the fixed slot, so every real team rotates and home games stay even.
  if (slots.length % 2 === 1) slots.unshift(null);

  const rounds = slots.length - 1;
  const half = slots.length / 2;
  const fixtures: Fixture[] = [];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = slots[i];
      const b = slots[slots.length - 1 - i];
      if (a === null || b === null) continue;
      // Alternate home advantage so no team plays every match at home.
      // The fixed slot flips every round; the rotating pairs keep a fixed side,
      // which balances out because every team moves through all positions.
      const swap = i === 0 ? r % 2 === 1 : i % 2 === 1;
      fixtures.push({ round: r + 1, home: swap ? b : a, away: swap ? a : b });
    }
    // Keep the first slot fixed and rotate the rest one step.
    slots.splice(1, 0, slots.pop()!);
  }

  if (!doubleRound) return fixtures;
  return [
    ...fixtures,
    ...fixtures.map((f) => ({ round: f.round + rounds, home: f.away, away: f.home })),
  ];
}
