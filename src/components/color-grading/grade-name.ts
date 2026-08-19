/** Local, zero-cost naming for generated results — no extra AI request. */
const STOP = new Set([
  "a",
  "an",
  "the",
  "with",
  "and",
  "of",
  "in",
  "on",
  "to",
  "for",
  "make",
  "makes",
  "look",
  "looks",
  "like",
  "please",
  "image",
  "photo",
  "picture",
  "style",
  "grade",
  "grading",
  "color",
  "colour",
  "very",
  "some",
  "more",
  "it",
  "its",
]);

const FALLBACK = "AI Color Grade";

function titleCase(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** First 2–5 meaningful prompt words, tidied and in Title Case. */
export function baseGradeName(prompt: string) {
  const words = prompt
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const significant = words.filter((w) => !STOP.has(w.toLowerCase()));
  const picked = (significant.length >= 2 ? significant : words).slice(0, 5);
  if (picked.length === 0) return FALLBACK;
  let name = picked.map(titleCase).join(" ");
  if (name.length > 34) name = `${name.slice(0, 34).trimEnd()}`;
  return name;
}

/** Unique display name — appends a version number when the base repeats. */
export function uniqueGradeName(prompt: string, taken: Iterable<string>) {
  const base = baseGradeName(prompt);
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

/** Safe file name for downloads. */
export function gradeFileName(name: string) {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "color-grade";
  return `${slug}.jpg`;
}
