import { describe, it, expect } from 'vitest';
import { renderReservationCancelledEmail } from './reservation-cancelled';
import type { ReservationEmailData } from '../types';

const baseData: ReservationEmailData = {
  tenant: { tenantName: 'June Six Bistro Bar' },
  guestName: 'Carol',
  reservationDate: '2026-05-17',
  reservationTime: '18:00',
  partySize: 1,
};

describe('renderReservationCancelledEmail', () => {
  it('returns subject, text, html', () => {
    const out = renderReservationCancelledEmail(baseData);
    expect(out.subject.length).toBeGreaterThan(0);
    expect(out.text.length).toBeGreaterThan(0);
    expect(out.html.length).toBeGreaterThan(0);
  });

  it('says "cancelled"', () => {
    const out = renderReservationCancelledEmail(baseData);
    expect(out.text.toLowerCase()).toContain('cancelled');
    expect(out.html.toLowerCase()).toContain('cancelled');
  });

  it('uses "1 guest" singular form for party of 1', () => {
    const out = renderReservationCancelledEmail(baseData);
    expect(out.text).toContain('1 guest');
    expect(out.text).not.toContain('1 guests');
  });

  it('includes tenant + guest + date + time', () => {
    const out = renderReservationCancelledEmail(baseData);
    expect(out.html).toContain('June Six Bistro Bar');
    expect(out.html).toContain('Carol');
    expect(out.text).toContain('2026-05-17');
    expect(out.text).toContain('18:00');
  });

  it('escapes guestName in html', () => {
    const out = renderReservationCancelledEmail({
      ...baseData,
      guestName: '"><svg/onload=1>',
    });
    expect(out.html).not.toContain('"><svg/onload=1>');
    expect(out.html).toContain('&quot;&gt;&lt;svg');
  });
});
