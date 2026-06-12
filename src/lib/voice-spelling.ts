// Deterministic Italian spelling of alphanumeric codes for voice output.
// The TTS reads the result naturally; the model must never build its own spelling.

const LETTER_NAMES: Record<string, string> = {
  a: "a", b: "bi", c: "ci", d: "di", e: "e", f: "effe", g: "gi", h: "acca",
  i: "i", j: "i lunga", k: "kappa", l: "elle", m: "emme", n: "enne", o: "o",
  p: "pi", q: "cu", r: "erre", s: "esse", t: "ti", u: "u", v: "vu",
  w: "doppia vu", x: "ics", y: "ipsilon", z: "zeta",
};

const DIGIT_NAMES = ["zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove"];

/**
 * Spells a code character by character with Italian letter/digit names,
 * grouped for natural voice pacing, e.g.
 * "case_mq7r" -> "ci a esse e, trattino basso, emme cu sette erre"
 */
export function spellForVoice(code: string, groupSize = 4): string {
  const parts: string[] = [];
  let currentGroup: string[] = [];

  const flush = () => {
    if (currentGroup.length > 0) {
      parts.push(currentGroup.join(" "));
      currentGroup = [];
    }
  };

  for (const ch of code) {
    const lower = ch.toLowerCase();
    if (LETTER_NAMES[lower]) {
      currentGroup.push(LETTER_NAMES[lower]);
    } else if (/\d/.test(ch)) {
      currentGroup.push(DIGIT_NAMES[Number(ch)]);
    } else if (ch === "_" || ch === "-") {
      // Separators get their own group so the voice pauses around them
      flush();
      parts.push(ch === "_" ? "trattino basso" : "trattino");
      continue;
    } else {
      continue; // skip any other character (spaces, punctuation)
    }
    if (currentGroup.length === groupSize) flush();
  }
  flush();

  return parts.join(", ");
}
