/**
 * Normalizes text for matching: strips accents and punctuation, lowercases
 * and collapses whitespace. Applied identically to stored text and queries.
 */
export function normalizeText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[‘’‚‛']/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Splits normalized text into tokens. */
export function tokenize(input: string): readonly string[] {
  const normalized = normalizeText(input);
  return normalized === "" ? [] : normalized.split(" ");
}

/** Words that carry no signal for a fallback search. Everything else stays, so Yoruba and other languages work. */
const FALLBACK_STOPWORDS = new Set(["the", "and", "that", "with", "for", "his", "her", "him", "unto", "thou", "thy", "thee", "shall", "will", "are", "was", "were", "not", "but", "this", "they", "them", "have", "hath", "from", "you", "your", "all", "our", "into", "upon", "which", "who", "what", "when", "then", "there", "their", "been", "had", "has", "did", "doth", "how", "why"]);

/** Longest words first: a rough stand-in for rarity, which is what makes a fallback match useful. */
function fallbackWords(normalizedText: string, max: number): string[] {
  const seen = new Set<string>();
  const words = normalizedText.split(/\s+/).filter((word) => word.length >= 3 && !FALLBACK_STOPWORDS.has(word) && !seen.has(word) && seen.add(word));
  return words.sort((a, b) => b.length - a.length).slice(0, max);
}

/**
 * A `to_tsquery` expression that matches rows containing at least two of the
 * query's stronger words, e.g. "amazing & grace | amazing & sweet | grace & sweet".
 * Forgives one misheard word without matching every verse that contains "my".
 * Null when there are fewer than two usable words (the exact search already covered that).
 */
export function toAnyPairQuery(normalizedText: string): string | null {
  const words = fallbackWords(normalizedText, 5);
  if (words.length < 2) return null;
  const pairs: string[] = [];
  for (let i = 0; i < words.length; i += 1) {
    for (let j = i + 1; j < words.length; j += 1) pairs.push(`${words[i]} & ${words[j]}`);
  }
  return pairs.join(" | ");
}
