export type RoomSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface Room {
  id: number;
  name: string;
  size: RoomSize;
  hourlyRate: number;
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

