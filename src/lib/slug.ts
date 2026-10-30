const letters: Record<string, string> = { č: "c", ć: "c", đ: "dj", š: "s", ž: "z", ß: "ss" };

/** URL-safe slug for a league name: "Liga Čaršija 2026" → "liga-carsija-2026". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[čćđšžß]/g, (ch) => letters[ch])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}
