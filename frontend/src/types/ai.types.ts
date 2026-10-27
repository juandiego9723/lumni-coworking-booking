import { Booking } from './booking.types';
import { QuoteResponse } from './quoter.types';

export interface AiChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  action: string;
  quoteData?: QuoteResponse;
  draftBooking?: Booking;
}

export interface ChatHistoryResponse {
  sessionId: string;
  draftBookingId?: number | null;
  draftBooking?: Booking;
  messages: AiChatMessage[];
}

