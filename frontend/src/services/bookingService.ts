import { apiClient } from './api';
import { Booking } from '../types';

export async function createDraft(userId: number, data: {
  roomId: number;
  date: string;
  startTime: string;
  durationHours: number;
  customerName: string;
  customerEmail: string;
}): Promise<Booking> {
  return await apiClient<Booking>('/bookings/draft', {
    method: 'POST',
    userId,
    body: JSON.stringify({ userId, ...data }),
  });
}

export async function getBookingById(bookingId: number): Promise<Booking> {
  return await apiClient<Booking>(`/bookings/${bookingId}`);
}

export async function updateBookingStep(
  bookingId: number,
  step: number,
  data: Record<string, unknown>
): Promise<Booking> {
  return await apiClient<Booking>(`/bookings/${bookingId}/step`, {
    method: 'PATCH',
    body: JSON.stringify({ step, data }),
  });
}

export async function confirmBooking(
  bookingId: number
): Promise<{ booking: Booking; alreadyConfirmed: boolean }> {
  return await apiClient<{ booking: Booking; alreadyConfirmed: boolean }>(
    `/bookings/${bookingId}/confirm`,
    {
      method: 'POST',
    }
  );
}

