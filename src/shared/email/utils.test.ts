import { describe, it, expect } from 'vitest';
import {
  createHtmlBlock,
  createPlainTextBlock,
  escapeHtml,
  formatOptionalLine,
  formatPartySize,
} from './utils';

describe('escapeHtml', () => {
  it('escapes &', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes <, >', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hi"')).toBe('say &quot;hi&quot;');
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('escapes ampersand first to avoid double-escaping', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });
});

describe('formatPartySize', () => {
  it('returns "1 guest" for 1', () => {
    expect(formatPartySize(1)).toBe('1 guest');
  });

  it('returns "N guests" for N > 1', () => {
    expect(formatPartySize(2)).toBe('2 guests');
    expect(formatPartySize(10)).toBe('10 guests');
  });
});

describe('formatOptionalLine', () => {
  it('returns empty string for null', () => {
    expect(formatOptionalLine('Notes', null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatOptionalLine('Notes', undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatOptionalLine('Notes', '')).toBe('');
  });

  it('returns "Label: value" for present value', () => {
    expect(formatOptionalLine('Notes', 'window seat')).toBe(
      'Notes: window seat',
    );
  });
});

describe('createPlainTextBlock', () => {
  it('filters falsy and joins with newlines', () => {
    expect(
      createPlainTextBlock(['a', '', 'b', null, 'c', false, undefined]),
    ).toBe('a\nb\nc');
  });
});

describe('createHtmlBlock', () => {
  it('wraps each non-empty line in <p>', () => {
    expect(createHtmlBlock(['hello', '', 'world', null])).toBe(
      '<p>hello</p>\n<p>world</p>',
    );
  });
});
