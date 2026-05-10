import { describe, it, expect } from 'vitest';
import { renderReservationConfirmedEmail } from './reservation-confirmed';
import type { ReservationEmailData } from '../types';

const baseData: ReservationEmailData = {
  tenant: { tenantName: 'June Six Bistro Bar' },
  guestName: 'Bob',
  reservationDate: '2026-05-16',
  reservationTime: '20:00',
  partySize: 4,
};

describe('renderReservationConfirmedEmail', () => {
  it('returns subject, text, html', () => {
    const out = renderReservationConfirmedEmail(baseData);
    expect(out.subject.length).toBeGreaterThan(0);
    expect(out.text.length).toBeGreaterThan(0);
    expect(out.html.length).toBeGreaterThan(0);
  });

  it('says "confirmed"', () => {
    const out = renderReservationConfirmedEmail(baseData);
    expect(out.text.toLowerCase()).toContain('confirmed');
    expect(out.html.toLowerCase()).toContain('confirmed');
  });

  it('includes tenant, guest, date, time, party size', () => {
    const out = renderReservationConfirmedEmail(baseData);
    expect(out.html).toContain('June Six Bistro Bar');
    expect(out.html).toContain('Bob');
    expect(out.text).toContain('2026-05-16');
    expect(out.text).toContain('20:00');
    expect(out.text).toContain('4 guests');
  });

  it('omits notes when absent, includes when present', () => {
    const without = renderReservationConfirmedEmail(baseData);
    expect(without.text).not.toContain('Notes:');
    const withNotes = renderReservationConfirmedEmail({
      ...baseData,
      notes: 'Allergies: peanuts',
    });
    expect(withNotes.text).toContain('Notes: Allergies: peanuts');
  });

  it('escapes guestName in html', () => {
    const out = renderReservationConfirmedEmail({
      ...baseData,
      guestName: '<img onerror=x>',
    });
    expect(out.html).not.toContain('<img onerror=x>');
    expect(out.html).toContain('&lt;img');
  });
});
