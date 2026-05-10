import { describe, it, expect } from 'vitest';
import { renderReservationCreatedEmail } from './reservation-created';
import type { ReservationEmailData } from '../types';

const baseData: ReservationEmailData = {
  tenant: { tenantName: 'June Six Bistro Bar' },
  guestName: 'Alice',
  guestEmail: 'alice@example.com',
  reservationDate: '2026-05-15',
  reservationTime: '19:30',
  partySize: 2,
};

describe('renderReservationCreatedEmail', () => {
  it('returns subject, text, html', () => {
    const out = renderReservationCreatedEmail(baseData);
    expect(out.subject).toBeTypeOf('string');
    expect(out.text).toBeTypeOf('string');
    expect(out.html).toBeTypeOf('string');
    expect(out.subject.length).toBeGreaterThan(0);
  });

  it('says "received" and does NOT say "confirmed"', () => {
    const out = renderReservationCreatedEmail(baseData);
    expect(out.text.toLowerCase()).toContain('received');
    expect(out.text.toLowerCase()).not.toContain('confirmed');
    expect(out.html.toLowerCase()).not.toContain('confirmed');
  });

  it('includes tenant name, guest name, date, time, party size', () => {
    const out = renderReservationCreatedEmail(baseData);
    expect(out.html).toContain('June Six Bistro Bar');
    expect(out.html).toContain('Alice');
    expect(out.text).toContain('2026-05-15');
    expect(out.text).toContain('19:30');
    expect(out.text).toContain('2 guests');
  });

  it('omits notes line when notes are absent', () => {
    const out = renderReservationCreatedEmail(baseData);
    expect(out.text).not.toContain('Notes:');
    expect(out.html).not.toContain('Notes:');
  });

  it('includes notes line when notes are present', () => {
    const out = renderReservationCreatedEmail({
      ...baseData,
      notes: 'Window seat please',
    });
    expect(out.text).toContain('Notes: Window seat please');
    expect(out.html).toContain('Notes: Window seat please');
  });

  it('escapes guestName in html', () => {
    const out = renderReservationCreatedEmail({
      ...baseData,
      guestName: '<script>alert(1)</script>',
    });
    expect(out.html).not.toContain('<script>alert(1)</script>');
    expect(out.html).toContain('&lt;script&gt;');
  });
});
