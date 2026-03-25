export interface VerseLead {
  prefix: string;
  initial: string;
  rest: string;
}

const LETTER_REGEX = /\p{L}/u;
const NON_WHITESPACE_REGEX = /\S/u;

export function extractVerseLead(text: string): VerseLead | null {
  if (!text.trim()) {
    return null;
  }

  const characters = Array.from(text);
  const initialIndex = characters.findIndex((character) => LETTER_REGEX.test(character));
  const fallbackIndex = characters.findIndex((character) => NON_WHITESPACE_REGEX.test(character));
  const leadIndex = initialIndex >= 0 ? initialIndex : fallbackIndex;

  if (leadIndex < 0) {
    return null;
  }

  return {
    prefix: characters.slice(0, leadIndex).join(''),
    initial: characters[leadIndex],
    rest: characters.slice(leadIndex + 1).join(''),
  };
}
