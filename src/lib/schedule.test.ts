import assert from "node:assert/strict";
import { test } from "node:test";
import { roundRobin } from "./schedule.ts";

const pairKey = (a: string, b: string) => [a, b].sort().join("-");

test("every pair meets exactly once in a single round robin", () => {
  for (const n of [2, 3, 4, 5, 6, 9, 10]) {
    const teams = Array.from({ length: n }, (_, i) => `t${i}`);
    const fixtures = roundRobin(teams);
    assert.equal(fixtures.length, (n * (n - 1)) / 2);
    const pairs = new Set(fixtures.map((f) => pairKey(f.home, f.away)));
    assert.equal(pairs.size, fixtures.length, `duplicate pairing for ${n} teams`);
  }
});

test("no team plays twice in the same round", () => {
  const fixtures = roundRobin(["a", "b", "c", "d", "e", "f", "g"]);
  const byRound = new Map<number, string[]>();
  for (const f of fixtures) byRound.set(f.round, [...(byRound.get(f.round) ?? []), f.home, f.away]);
  for (const [round, teams] of byRound) assert.equal(new Set(teams).size, teams.length, `round ${round}`);
});

test("double round robin swaps home and away in the return leg", () => {
  const fixtures = roundRobin(["a", "b", "c", "d"], true);
  assert.equal(fixtures.length, 12);
  const legs = new Set(fixtures.map((f) => `${f.home}>${f.away}`));
  assert.equal(legs.size, 12);
  assert.equal(Math.max(...fixtures.map((f) => f.round)), 6);
});

test("home games are spread evenly", () => {
  for (const n of [3, 4, 5, 6, 7, 10]) {
    const teams = Array.from({ length: n }, (_, i) => `t${i}`);
    const home = new Map(teams.map((t) => [t, 0]));
    for (const f of roundRobin(teams)) home.set(f.home, home.get(f.home)! + 1);
    const counts = [...home.values()];
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `${n} teams: ${counts}`);
  }
});

test("rejects duplicate team ids", () => {
  assert.throws(() => roundRobin(["a", "a"]));
});
