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

/** Instruction and filler words (EN + RU) stripped from download file names. */
const PROMPT_STOP = new Set([
  ...STOP,
  "create",
  "apply",
  "give",
  "turn",
  "into",
  "my",
  "me",
  "this",
  "that",
  "add",
  "remove",
  "keep",
  "want",
  "need",
  "get",
  "photograph",
  "сделай",
  "сделать",
  "создай",
  "хочу",
  "нужно",
  "надо",
  "пожалуйста",
  "добавь",
  "убери",
  "фото",
  "фотографию",
  "изображение",
  "картинка",
  "картинку",
  "это",
  "этот",
  "эту",
  "этой",
  "как",
  "и",
  "в",
  "во",
  "на",
  "с",
  "со",
  "для",
  "мне",
  "чтобы",
  "более",
  "очень",
  "немного",
  "без",
  "из",
  "по",
  "у",
  "о",
  "об",
  "же",
  "бы",
]);

const FILE_FALLBACK = "ai-color-grading";
const MAX_SLUG = 40;

/**
 * Light normalization of common Russian accusative endings to the nominative
 * form, so file names read naturally ("холодную" → "холодная"). Heuristic by
 * design — no AI request involved.
 */
function normalizeRu(word: string): string {
  if (!/[а-яё]/i.test(word)) return word;
  return word
    .replace(/цию$/i, "ция")
    .replace(/сию$/i, "сия")
    .replace(/ую$/i, "ая")
    .replace(/юю$/i, "яя")
    .replace(/ей$/i, "ий");
}

/**
 * Short hyphenated slug from a generation prompt: 3 main words (up to 5 when
 * fewer significant words exist), lowercased, max 40 chars. Keeps the
 * prompt's language (Cyrillic included), drops emoji and filename-unsafe
 * characters. Local — no AI request.
 */
export function promptFileSlug(prompt: string): string {
  const words = prompt
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const significant = words
    .filter((w) => !PROMPT_STOP.has(w) && !/^\d+$/.test(w))
    .map(normalizeRu);
  const picked = (significant.length >= 3 ? significant.slice(0, 3) : words).slice(0, 5);
  let slug = "";
  let count = 0;
  for (const word of picked) {
    const next = slug ? `${slug}-${word}` : word;
    // The 3-word target wins over the length cap; later words never overflow.
    if (next.length > MAX_SLUG && count >= 3) break;
    slug = next;
    count += 1;
  }
  if (!slug && picked[0]) slug = picked[0].slice(0, MAX_SLUG);
  return slug || FILE_FALLBACK;
}

/** Extension matching the actual result bytes returned by the generator. */
export function extForBlob(blob: Blob): string {
  if (blob.type === "image/png") return "png";
  return "jpg";
}

/** Final download name for an AI result, based on its own prompt. */
export function promptFileName(prompt: string | undefined, blob: Blob): string {
  return `${promptFileSlug((prompt ?? "").trim())}.${extForBlob(blob)}`;
}
