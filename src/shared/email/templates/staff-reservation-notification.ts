import { renderBaseEmail } from '../layout';
import type { ReservationEmailData, RenderedEmail } from '../types';
import {
  escapeHtml,
  formatOptionalLine,
  formatPartySize,
} from '../utils';

export function renderStaffReservationNotificationEmail(
  data: ReservationEmailData,
): RenderedEmail {
  const subject = `New reservation request — ${data.tenant.tenantName}`;
  const intro = `New reservation request received.`;

  const bodyTextLines = [
    `Guest: ${data.guestName}`,
    formatOptionalLine('Email', data.guestEmail),
    `Date: ${data.reservationDate}`,
    `Time: ${data.reservationTime}`,
    `Party size: ${formatPartySize(data.partySize)}`,
    formatOptionalLine('Notes', data.notes),
  ].filter(Boolean);

  const bodyHtmlLines = [
    `<p style="font-family:sans-serif;">Guest: ${escapeHtml(data.guestName)}</p>`,
    data.guestEmail
      ? `<p style="font-family:sans-serif;">Email: ${escapeHtml(data.guestEmail)}</p>`
      : '',
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
