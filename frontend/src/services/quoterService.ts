import { apiClient } from './api';
import { QuoteRequest, QuoteResponse } from '../types';

export async function requestQuote(payload: QuoteRequest): Promise<QuoteResponse> {
  return await apiClient<QuoteResponse>('/quotes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

