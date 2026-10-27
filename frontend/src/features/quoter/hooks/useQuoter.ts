import { useState } from 'react';
import { RoomSize, QuoteResponse } from '../../../types';
import { requestQuote } from '../../../services/quoterService';

export function useQuoter() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [roomSize, setRoomSize] = useState<RoomSize>('SMALL');
  const [date, setDate] = useState<string>(defaultDateStr);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [durationHours, setDurationHours] = useState<number>(2);

  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSaturday = (() => {
    if (!date) return false;
    const parts = date.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDay() === 6;
  })();

  const calculateQuote = async (customStartTime?: string) => {
    setLoading(true);
    setError(null);
    const timeToUse = customStartTime || startTime;

    const payload = {
      roomSize,
      date,
      startTime: timeToUse,
      durationHours: Number(durationHours),
    };

    console.log('[useQuoter] Enviando cotización al backend:', payload);

    try {
      const response = await requestQuote(payload);
      console.log('[useQuoter] Cotización obtenida con éxito:', response);
      setQuoteResult(response);
      if (customStartTime) {
        setStartTime(customStartTime);
      }
    } catch (err: any) {
      console.error('[useQuoter] Error en cálculo de cotización:', err);
      setError(err.message || 'Error al cotizar sala');
      setQuoteResult(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    roomSize,
    setRoomSize,
    date,
    setDate,
    startTime,
    setStartTime,
    durationHours,
    setDurationHours,
    isSaturday,
    loading,
    quoteResult,
    error,
    calculateQuote,
    resetQuote: () => setQuoteResult(null),
  };
}
