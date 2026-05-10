import type { RenderedEmail } from './types';
import { createPlainTextBlock, escapeHtml } from './utils';

type RenderBaseEmailArgs = {
  tenantName: string;
  subject: string;
  intro?: string;
  bodyTextLines: string[];
  bodyHtmlLines: string[];
  footerTextLines?: string[];
  footerHtmlLines?: string[];
};

export function renderBaseEmail(args: RenderBaseEmailArgs): RenderedEmail {
  const text = createPlainTextBlock([
    args.tenantName,
    '',
    args.intro,
    args.intro ? '' : false,
    ...args.bodyTextLines,
    ...(args.footerTextLines && args.footerTextLines.length > 0
      ? ['', ...args.footerTextLines]
      : []),
  ]);

  const introHtml = args.intro
    ? `<p style="font-family:sans-serif;color:#27272a;">${escapeHtml(args.intro)}</p>`
    : '';

  const bodyHtml = args.bodyHtmlLines.filter(Boolean).join('\n');
  const footerHtml =
    args.footerHtmlLines && args.footerHtmlLines.length > 0
      ? `<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />\n${args.footerHtmlLines.filter(Boolean).join('\n')}`
      : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(args.subject)}</title>
</head>
<body style="font-family:sans-serif;color:#18181b;max-width:600px;margin:0 auto;padding:24px;background-color:#ffffff;">
<h2 style="margin:0 0 16px 0;font-family:sans-serif;color:#18181b;">${escapeHtml(args.tenantName)}</h2>
${introHtml}
${bodyHtml}
${footerHtml}
</body>
</html>`;

  return {
    subject: args.subject,
    text,
    html,
  };
}
