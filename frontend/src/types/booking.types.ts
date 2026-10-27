import { Room } from './quoter.types';
import { User } from './auth.types';

export type BookingStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface EmailOutboxInfo {
  id: number;
  status: EmailStatus;
  attempts: number;
  lastError?: string | null;
  sentAt?: string | null;
  nextRetryAt?: string | null;
}

export interface Booking {
  id: number;
  userId: number;
  roomId: number;
  customerName: string;
  customerEmail: string;
  startsAt: string;
  endsAt: string;
  durationHours: number;
  hasProjector: boolean;
  hasCoffee: boolean;
  currentStep: number;
  baseAmount: number;
  discountAmount: number;
  surchargeAmount: number;
  servicesAmount: number;
  totalAmount: number;
  status: BookingStatus;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  room?: Room;
  user?: User;
  emailOutbox?: EmailOutboxInfo | null;
}

