export type EmailAddress = {
  email: string;
  name?: string;
};

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

export type TenantEmailIdentity = {
  tenantName: string;
  publicBaseUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export type ReservationEmailData = {
  tenant: TenantEmailIdentity;
  guestName: string;
  guestEmail?: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  reservationId?: string;
  notes?: string | null;
};
