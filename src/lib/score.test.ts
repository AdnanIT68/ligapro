import assert from "node:assert/strict";
import { test } from "node:test";
import { parseScore, parseShirtNumber, playerLabel } from "./score.ts";

test("parseScore accepts 0–99 and rejects everything else", () => {
  assert.equal(parseScore("0"), 0);
  assert.equal(parseScore(" 12 "), 12);
  for (const bad of ["", "-1", "100", "2.5", "abc", null]) assert.equal(parseScore(bad), null, String(bad));
});

test("parseShirtNumber accepts an optional leading #", () => {
  assert.equal(parseShirtNumber("#7"), 7);
  assert.equal(parseShirtNumber("10"), 10);
  assert.equal(parseShirtNumber("Emir"), null);
});

test("player labels satisfy the two-character name check", () => {
  assert.equal(playerLabel(7), "#7");
  assert.ok(playerLabel(0).length >= 2);
});
