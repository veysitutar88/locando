import { describe, it, expect } from 'vitest';
import { renderStaffReservationNotificationEmail } from './staff-reservation-notification';
import type { ReservationEmailData } from '../types';

const baseData: ReservationEmailData = {
  tenant: { tenantName: 'June Six Bistro Bar' },
  guestName: 'Dana',
  guestEmail: 'dana@example.com',
  reservationDate: '2026-05-18',
  reservationTime: '21:00',
  partySize: 3,
};

describe('renderStaffReservationNotificationEmail', () => {
  it('returns subject, text, html', () => {
    const out = renderStaffReservationNotificationEmail(baseData);
    expect(out.subject.length).toBeGreaterThan(0);
    expect(out.text.length).toBeGreaterThan(0);
    expect(out.html.length).toBeGreaterThan(0);
  });

  it('says "new reservation request"', () => {
    const out = renderStaffReservationNotificationEmail(baseData);
    expect(out.text.toLowerCase()).toContain('new reservation request');
    expect(out.html.toLowerCase()).toContain('new reservation request');
  });

  it('includes guest name and guest email when provided', () => {
    const out = renderStaffReservationNotificationEmail(baseData);
    expect(out.text).toContain('Dana');
    expect(out.text).toContain('dana@example.com');
    expect(out.html).toContain('Dana');
    expect(out.html).toContain('dana@example.com');
  });

  it('omits guest email line when absent', () => {
    const out = renderStaffReservationNotificationEmail({
      ...baseData,
      guestEmail: undefined,
    });
    expect(out.text).not.toContain('Email:');
    expect(out.html).not.toContain('Email:');
  });

  it('omits notes line when absent and includes when present', () => {
    const without = renderStaffReservationNotificationEmail(baseData);
    expect(without.text).not.toContain('Notes:');
    const withNotes = renderStaffReservationNotificationEmail({
      ...baseData,
      notes: 'High chair needed',
    });
    expect(withNotes.text).toContain('Notes: High chair needed');
  });

  it('escapes guestName in html', () => {
    const out = renderStaffReservationNotificationEmail({
      ...baseData,
      guestName: '<b>injected</b>',
    });
    expect(out.html).not.toContain('<b>injected</b>');
    expect(out.html).toContain('&lt;b&gt;injected&lt;/b&gt;');
  });
});
