import { apiClient } from './api';
import { Booking, BookingStatus } from '../types';

export interface AdminBookingsResponse {
  data: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function listAdminBookings(params: {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  roomId?: number;
}): Promise<AdminBookingsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.roomId) query.set('roomId', String(params.roomId));

  return await apiClient<AdminBookingsResponse>(`/admin/bookings?${query.toString()}`, {
    userId: 2, // Admin
  });
}

export async function cancelBookingAdmin(bookingId: number, reason: string): Promise<Booking> {
  const res = await apiClient<{ message: string; booking: Booking }>(
    `/admin/bookings/${bookingId}/cancel`,
    {
      method: 'POST',
      userId: 2,
      body: JSON.stringify({ reason }),
    }
  );
  return res.booking;
}

export async function triggerEmailProcess(): Promise<any> {
  return await apiClient<any>('/admin/emails/process-now', {
    method: 'POST',
    userId: 2,
  });
}

