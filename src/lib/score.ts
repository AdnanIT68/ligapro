/** Parses a score typed on a phone: whole number 0–99, or null when it isn't one. */
export function parseScore(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!/^\d{1,2}$/.test(text)) return null;
  return Number(text);
}

/** Shirt numbers stand in for names, because youth league players are minors. */
export function parseShirtNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim().replace(/^#/, "");
  if (!/^\d{1,2}$/.test(text)) return null;
  return Number(text);
}

export function playerLabel(shirtNumber: number): string {
  return `#${shirtNumber}`;
}
