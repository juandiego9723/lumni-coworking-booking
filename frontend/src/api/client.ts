import { QuoteRequest, QuoteResponse, Booking, BookingStatus } from '../types';

const API_BASE = '/api';

export function getAuthHeaders(userId: number = 1): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-user-id': String(userId),
  };
}

export async function requestQuote(payload: QuoteRequest): Promise<QuoteResponse> {
  const res = await fetch(`${API_BASE}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al cotizar');
  }

  return await res.json();
}

export async function createDraft(userId: number, data: {
  roomId: number;
  date: string;
  startTime: string;
  durationHours: number;
  customerName: string;
  customerEmail: string;
}): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings/draft`, {
    method: 'POST',
    headers: getAuthHeaders(userId),
    body: JSON.stringify({ userId, ...data }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al crear el borrador');
  }

  return await res.json();
}

export async function getBookingById(bookingId: number): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Reserva no encontrada');
  }
  return await res.json();
}

export async function updateBookingStep(bookingId: number, step: number, data: Record<string, unknown>): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/step`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, data }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al actualizar el borrador');
  }

  return await res.json();
}

export async function confirmBooking(bookingId: number): Promise<{ booking: Booking; alreadyConfirmed: boolean }> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al confirmar la reserva');
  }

  return await res.json();
}

// Admin APIs
export async function listAdminBookings(params: {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  roomId?: number;
}): Promise<{
  data: Booking[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.roomId) query.set('roomId', String(params.roomId));

  const res = await fetch(`${API_BASE}/admin/bookings?${query.toString()}`, {
    headers: getAuthHeaders(2), // 2 = Admin
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al listar reservas');
  }

  return await res.json();
}

export async function cancelBookingAdmin(bookingId: number, reason: string): Promise<Booking> {
  const res = await fetch(`${API_BASE}/admin/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(2),
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al cancelar la reserva');
  }

  const data = await res.json();
  return data.booking;
}

export async function listAdminEmails(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/admin/emails`, {
    headers: getAuthHeaders(2),
  });
  if (!res.ok) throw new Error('Error al cargar correos');
  return await res.json();
}

export async function triggerEmailProcess(): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/emails/process-now`, {
    method: 'POST',
    headers: getAuthHeaders(2),
  });
  return await res.json();
}

