/**
 * Puts turned-over words back where they belong.
 *
 * The printed hymnal had narrow columns. When a line did not fit, the printer
 * tucked its last word or two at the end of a neighbouring line behind an
 * opening bracket:
 *
 *     Through many dangers, toils, and
 *     I have already come : [snares,
 *
 * and wrapped very long lines onto a second, lower-case line. The dataset kept
 * both habits. This module reverses them on the raw lines, before the brackets
 * are cleaned away and the signal is lost.
 */

const TURNOVER = /^(.*?)\s*\[([^[\]]*)$/;
const HARD_STOP = /[.;:!?]["'\s]*$/;
const LETTER_END = /[A-Za-z']["\s]*$/;
const WORDS = /[A-Za-z']+/g;

/** Words a finished line of verse does not end on. */
const DANGLING = new Set(
  ("the a an and of my your thy his our their in to for from with on by that is shall will may can be its her o'er or but as at who which " +
    "when where than till if so not no he i we they thou you she it was were are am has have had hath do does did would could should must since while though").split(" "),
);
const ADJECTIVE_END = /(ous|ful|less|ive)$/;

interface Slot {
  block: number;
  /** Position inside its block, for comparing with the same line of other stanzas. */
  index: number;
  text: string;
  turn: string | null;
  /** True when a wrapped continuation carrying the turnover was merged into this line. */
  wrapped: boolean;
  got: boolean;
}

function isStanzaNumber(line: string): boolean {
  return /^\s*\d{1,2}\s*$/.test(line);
}

function words(line: string): string[] {
  return (line.match(WORDS) ?? []).map((word) => word.toLowerCase().replace(/'/g, ""));
}

function endsSingleHyphen(line: string): boolean {
  return /[A-Za-z]-\s*$/.test(line);
}

/** No closing punctuation: the line is waiting for more words. */
function isOpen(line: string): boolean {
  return LETTER_END.test(line.trimEnd());
}

function isIncomplete(line: string): boolean {
  const last = words(line).at(-1) ?? "";
  return DANGLING.has(last) || ADJECTIVE_END.test(last);
}

/** A rough syllable count; only ever compared with counts made the same way. */
function syllables(line: string): number {
  let total = 0;
  for (const word of words(line)) {
    let count = (word.match(/[aeiouy]+/g) ?? []).length;
    if (count > 1 && word.endsWith("e") && !word.endsWith("le") && !word.endsWith("ee")) count -= 1;
    if (count > 1 && word.length > 3 && word.endsWith("ed") && !"td".includes(word.at(-3) ?? "")) count -= 1;
    total += Math.max(count, 1);
  }
  return total;
}

function append(slot: Slot, turn: string, replacePunctuation = false): void {
  const base = slot.text.trimEnd();
  if (endsSingleHyphen(base) && /^[a-z]/.test(turn)) {
    slot.text = base.slice(0, -1) + turn;
  } else {
    slot.text = `${replacePunctuation ? base.replace(/\s*[.,;:]+$/, "") : base} ${turn}`;
  }
  slot.got = true;
}

/**
 * Takes the blocks of a lyric (each a list of raw lines) and returns them with
 * wrapped lines joined and turned-over words moved to the line they finish.
 */
export function repairTurnovers(blocks: readonly (readonly string[])[]): string[][] {
  const slots: Slot[] = [];
  const blockSlots: Slot[][] = [];

  blocks.forEach((lines, block) => {
    const own: Slot[] = [];
    for (const [position, raw] of lines.entries()) {
      if (isStanzaNumber(raw)) continue;
      const match = TURNOVER.exec(raw.trimEnd());
      const text = match?.[1] ?? raw;
      const turn = match?.[2]?.trim() ?? null;
      const previous = own.at(-1);
      const trimmed = text.trim();
      const next = lines[position + 1];
      const lowerCaseWrap = /^[a-z]/.test(trimmed) && previous !== undefined && !HARD_STOP.test(previous.text) && !endsSingleHyphen(previous.text);
      // "and my / Tower — [my Power ;": a capitalised scrap that finishes the line above, its turnover meant for the line below.
      const scrapWrap = turn !== null && previous !== undefined && previous.turn === null && trimmed.split(/\s+/).length <= 3
        && isOpen(previous.text) && next !== undefined && isOpen(next.replace(TURNOVER, "$1"));
      if (previous !== undefined && (lowerCaseWrap || scrapWrap)) {
        previous.text = `${previous.text.trimEnd()} ${trimmed}`;
        if (turn !== null) {
          previous.turn = turn;
          previous.wrapped = true;
        }
        continue;
      }
      own.push({ block, index: own.length, text, turn, wrapped: false, got: false });
    }
    blockSlots.push(own);
    slots.push(...own);
  });

  const cleanBlocks = blockSlots.filter((own) => own.every((slot) => slot.turn === null));

  slots.forEach((slot, at) => {
    const turn = slot.turn;
    if (turn === null) return;
    slot.turn = null;
    const turnWords = words(turn);
    if (!turnWords.some((word) => word.length >= 2)) return; // OCR debris such as "[j n g ."

    const before = slots[at - 1];
    const after = slots[at + 1];
    const prev = before?.block === slot.block ? before : undefined;
    const next = after?.block === slot.block ? after : undefined;
    const own = blockSlots[slot.block] ?? [];

    if (turnWords.length === 1 && turnWords[0] === "amen") {
      const last = own.at(-1) ?? slot;
      last.text = `${last.text.trimEnd()} Amen.`;
      return;
    }
    if (endsSingleHyphen(slot.text)) return append(slot, turn);
    if (prev !== undefined && !prev.got && endsSingleHyphen(prev.text)) return append(prev, turn);
    if (next !== undefined && endsSingleHyphen(next.text)) return append(next, turn);

    const otherStanzaNext = after !== undefined && after.block !== slot.block && isOpen(after.text) ? after : undefined;
    const otherStanzaPrev = before !== undefined && before.block !== slot.block && !before.got && isOpen(before.text) ? before : undefined;
    // After a wrapped line the turnover always finishes the line below, even across a stanza break.
    if (slot.wrapped) return append(next ?? (after !== undefined && !isOpen(slot.text) ? after : undefined) ?? slot, turn);

    const prevOpen = prev !== undefined && !prev.got && isOpen(prev.text);
    const nextOpen = next !== undefined && isOpen(next.text);
    if (prevOpen && !nextOpen) return append(prev, turn);
    if (nextOpen && !prevOpen) return append(next, turn);

    if (prev !== undefined && next !== undefined && prevOpen && nextOpen) {
      const prevIncomplete = isIncomplete(prev.text);
      const nextIncomplete = isIncomplete(next.text);
      if (prevIncomplete !== nextIncomplete) return append(prevIncomplete ? prev : next, turn);
      // Still tied: see which choice keeps both lines nearest the length the other stanzas give them.
      const references = cleanBlocks.filter((other) => other.length === own.length);
      if (references.length > 0) {
        const average = (index: number): number => references.reduce((sum, other) => sum + syllables(other[index]?.text ?? ""), 0) / references.length;
        const extra = syllables(turn);
        const costPrev = Math.abs(syllables(prev.text) + extra - average(prev.index)) + Math.abs(syllables(next.text) - average(next.index));
        const costNext = Math.abs(syllables(prev.text) - average(prev.index)) + Math.abs(syllables(next.text) + extra - average(next.index));
        if (Math.abs(costPrev - costNext) >= 1) return append(costPrev < costNext ? prev : next, turn);
      }
      return append(prev, turn);
    }

    // Nothing in this stanza is waiting for a word.
    if (isOpen(slot.text)) return append(slot, turn);
    const alreadyThere = (other: Slot | undefined): boolean => other !== undefined && words(other.text).slice(-turnWords.length).join(" ") === turnWords.join(" ");
    if (alreadyThere(prev) || alreadyThere(next)) return; // the dataset repaired the line and left the bracket behind
    if (otherStanzaPrev !== undefined) return append(otherStanzaPrev, turn);
    if (otherStanzaNext !== undefined) return append(otherStanzaNext, turn);
    return append(prev ?? next ?? slot, turn, true);
  });

  return blocks.map((lines, block) => {
    const numbers = lines.filter(isStanzaNumber);
    return [...numbers, ...(blockSlots[block] ?? []).map((slot) => slot.text)];
  });
}
