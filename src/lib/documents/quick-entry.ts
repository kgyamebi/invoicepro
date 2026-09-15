export type ParsedLine = {
  quantity: string;
  name: string;
  unitPrice?: string;
  category?: string;
  uncertain: boolean;
};

export function parseQuickEntry(text: string): ParsedLine[] {
  return text
    .split(/\n|,|;/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+(\d+(?:\.\d+)?)$/);
      if (match) {
        return {
          quantity: match[1],
          name: match[2],
          unitPrice: match[3],
          uncertain: false,
        };
      }
      return { quantity: "1", name: part, uncertain: true };
    });
}
