import { renderBaseEmail } from '../layout';
import type { ReservationEmailData, RenderedEmail } from '../types';
import {
  escapeHtml,
  formatOptionalLine,
  formatPartySize,
} from '../utils';

export function renderReservationConfirmedEmail(
  data: ReservationEmailData,
): RenderedEmail {
  const subject = `Reservation confirmed — ${data.tenant.tenantName}`;
  const intro = `Hi ${data.guestName}, your reservation is confirmed.`;

  const bodyTextLines = [
    `Date: ${data.reservationDate}`,
    `Time: ${data.reservationTime}`,
    `Party size: ${formatPartySize(data.partySize)}`,
    formatOptionalLine('Notes', data.notes),
  ].filter(Boolean);

  const bodyHtmlLines = [
    `<p style="font-family:sans-serif;">Date: ${escapeHtml(data.reservationDate)}</p>`,
    `<p style="font-family:sans-serif;">Time: ${escapeHtml(data.reservationTime)}</p>`,
    `<p style="font-family:sans-serif;">Party size: ${escapeHtml(formatPartySize(data.partySize))}</p>`,
    data.notes
      ? `<p style="font-family:sans-serif;">Notes: ${escapeHtml(data.notes)}</p>`
      : '',
  ];

  return renderBaseEmail({
    tenantName: data.tenant.tenantName,
    subject,
    intro,
    bodyTextLines,
    bodyHtmlLines,
  });
}
