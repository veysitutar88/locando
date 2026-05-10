export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatPartySize(size: number): string {
  return size === 1 ? '1 guest' : `${size} guests`;
}

export function formatOptionalLine(
  label: string,
  value?: string | null,
): string {
  if (!value) return '';
  return `${label}: ${value}`;
}

export function createPlainTextBlock(
  lines: Array<string | false | null | undefined>,
): string {
  return lines.filter(Boolean).join('\n');
}

export function createHtmlBlock(
  lines: Array<string | false | null | undefined>,
): string {
  return lines
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('\n');
}
