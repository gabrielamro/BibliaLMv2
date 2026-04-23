export interface BibleBookAutocompleteBook {
  id: string;
  name: string;
}

const normalizeAutocompleteText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export interface BibleBookAutocompleteSuggestion {
  id: string;
  name: string;
  completion: string;
}

const splitBookPrefix = (input: string) => {
  const trimmed = input.trimStart();
  const match = trimmed.match(/^(.+?)(\s+\d.*)$/);
  if (!match) return { bookPrefix: trimmed, suffix: '' };
  return { bookPrefix: match[1].trimEnd(), suffix: match[2] };
};

export function getBibleBookAutocomplete(
  input: string,
  books: BibleBookAutocompleteBook[],
  limit = 5,
): BibleBookAutocompleteSuggestion[] {
  const { bookPrefix, suffix } = splitBookPrefix(input);
  const normalizedPrefix = normalizeAutocompleteText(bookPrefix);

  if (normalizedPrefix.length < 2) return [];

  return books
    .filter(book => {
      const normalizedName = normalizeAutocompleteText(book.name);
      const normalizedId = normalizeAutocompleteText(book.id);
      return (
        normalizedName !== normalizedPrefix &&
        (normalizedName.startsWith(normalizedPrefix) || normalizedId.startsWith(normalizedPrefix))
      );
    })
    .slice(0, limit)
    .map(book => ({
      id: book.id,
      name: book.name,
      completion: `${book.name}${suffix}`,
    }));
}
