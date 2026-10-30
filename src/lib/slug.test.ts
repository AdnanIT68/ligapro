import assert from "node:assert/strict";
import { test } from "node:test";
import { slugify } from "./slug.ts";

test("turns Bosnian letters into plain ASCII", () => {
  assert.equal(slugify("Liga Čaršija 2026"), "liga-carsija-2026");
  assert.equal(slugify("Đurđevdanski turnir"), "djurdjevdanski-turnir");
  assert.equal(slugify("Žute ćevape šampionat"), "zute-cevape-sampionat");
});

test("collapses punctuation and trims dashes", () => {
  assert.equal(slugify("  Mali fudbal -- Ilidža!!  "), "mali-fudbal-ilidza");
  assert.equal(slugify("Café Liga"), "cafe-liga");
});

test("keeps slugs short enough for the database check", () => {
  const slug = slugify("a".repeat(30) + " " + "b".repeat(30));
  assert.ok(slug.length <= 50);
  assert.match(slug, /^[a-z0-9-]+$/);
  assert.ok(!slug.endsWith("-"));
});
