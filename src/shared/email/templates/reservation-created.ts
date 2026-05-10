import { renderBaseEmail } from '../layout';
import type { ReservationEmailData, RenderedEmail } from '../types';
import {
  escapeHtml,
  formatOptionalLine,
  formatPartySize,
} from '../utils';

export function renderReservationCreatedEmail(
  data: ReservationEmailData,
): RenderedEmail {
  const subject = `Reservation request received — ${data.tenant.tenantName}`;
  const intro = `Hi ${data.guestName}, we received your reservation request. The restaurant will review it and confirm shortly.`;

  const partyLine = `Party size: ${formatPartySize(data.partySize)}`;
  const dateLine = `Date: ${data.reservationDate}`;
  const timeLine = `Time: ${data.reservationTime}`;
  const notesTextLine = formatOptionalLine('Notes', data.notes);

  const bodyTextLines = [dateLine, timeLine, partyLine, notesTextLine].filter(
    Boolean,
  );

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
