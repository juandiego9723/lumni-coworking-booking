import { apiClient } from './api';
import { ChatResponse, ChatHistoryResponse } from '../types';

export async function sendChatMessage(payload: {
  sessionId: string;
  message: string;
  userId?: number;
}): Promise<ChatResponse> {
  return await apiClient<ChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
  return await apiClient<ChatHistoryResponse>(`/ai/chat/${sessionId}`);
}
