export type RoomSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type BookingStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Room {
  id: number;
  name: string;
  size: RoomSize;
  hourlyRate: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'CLIENT' | 'ADMIN';
}

export interface QuoteRequest {
  roomSize?: RoomSize;
  roomId?: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationHours: number;
}

export interface QuoteResponse {
  isAvailable: boolean;
  reason?: string;
  suggestedNextSlot?: string | null;
  roomId?: number;
  roomName?: string;
  baseAmount: number;
  discountAmount: number;
  surchargeAmount: number;
  totalAmount: number;
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
  emailOutbox?: {
    id: number;
    status: EmailStatus;
    attempts: number;
    lastError?: string | null;
    sentAt?: string | null;
    nextRetryAt?: string | null;
  } | null;
}

