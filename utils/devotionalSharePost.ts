export interface DevotionalShareContent {
  kind: 'devotional_share';
  devotionalId: string;
  devotionalTitle: string;
  verseText: string;
  verseReference: string;
  devotionalUrl: string;
  devotionalDate: string;
  message: string;
}

export const buildDevotionalShareContent = (content: DevotionalShareContent) =>
  JSON.stringify({
    kind: 'devotional_share',
    devotionalId: content.devotionalId,
    devotionalTitle: content.devotionalTitle,
    verseText: content.verseText,
    verseReference: content.verseReference,
    devotionalUrl: content.devotionalUrl,
    devotionalDate: content.devotionalDate,
    message: content.message.trim(),
  });

export const parseDevotionalShareContent = (value: unknown): DevotionalShareContent | null => {
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value);
    if (
      parsed?.kind !== 'devotional_share'
      || typeof parsed.devotionalId !== 'string'
      || typeof parsed.devotionalTitle !== 'string'
      || typeof parsed.verseText !== 'string'
      || typeof parsed.verseReference !== 'string'
      || typeof parsed.devotionalUrl !== 'string'
    ) {
      return null;
    }

    return {
      kind: 'devotional_share',
      devotionalId: parsed.devotionalId,
      devotionalTitle: parsed.devotionalTitle,
      verseText: parsed.verseText,
      verseReference: parsed.verseReference,
      devotionalUrl: parsed.devotionalUrl,
      devotionalDate: typeof parsed.devotionalDate === 'string' ? parsed.devotionalDate : '',
      message: typeof parsed.message === 'string' ? parsed.message : '',
    };
  } catch {
    return null;
  }
};
