import { useState, useEffect } from 'react';
import { Booking, RoomSize, QuoteResponse } from '../../../types';
import { createDraft, updateBookingStep, confirmBooking, getBookingById } from '../../../services/bookingService';
import { LOCAL_STORAGE_KEYS, ROOMS_CATALOG } from '../../../utils/constants';

interface UseBookingDraftProps {
  initialQuoteData?: {
    roomSize: RoomSize;
    date: string;
    startTime: string;
    durationHours: number;
    quoteResult: QuoteResponse;
  } | null;
  onBookingConfirmed?: () => void;
}

export function useBookingDraft({ initialQuoteData, onBookingConfirmed }: UseBookingDraftProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Campos
  const [customerName, setCustomerName] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.USER_NAME) || 'Juan Cliente'
  );
  const [customerEmail, setCustomerEmail] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.USER_EMAIL) || 'cliente@lumni.com'
  );

  const [roomId, setRoomId] = useState<number>(
    initialQuoteData?.quoteResult?.roomId ||
    (ROOMS_CATALOG.find((r) => r.size === initialQuoteData?.roomSize)?.id || 1)
  );
  const [date, setDate] = useState<string>(initialQuoteData?.date || '');
  const [startTime, setStartTime] = useState<string>(initialQuoteData?.startTime || '09:00');
  const [durationHours, setDurationHours] = useState<number>(initialQuoteData?.durationHours || 2);

  const [hasProjector, setHasProjector] = useState(false);
  const [hasCoffee, setHasCoffee] = useState(false);

  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem(LOCAL_STORAGE_KEYS.DRAFT_ID);
    if (savedId && !initialQuoteData) {
      const parsedId = parseInt(savedId, 10);
      if (!isNaN(parsedId)) {
        loadExistingDraft(parsedId);
      }
    } else if (initialQuoteData && !draftId) {
      initDraftFromQuoter();
    }
  }, [initialQuoteData]);

  const loadExistingDraft = async (id: number) => {
    setLoading(true);
    try {
      const booking = await getBookingById(id);
      if (booking.status === 'DRAFT') {
        setDraftId(booking.id);
        setCurrentBooking(booking);
        setCustomerName(booking.customerName);
        setCustomerEmail(booking.customerEmail);
        setRoomId(booking.roomId);
        setDurationHours(booking.durationHours);
        setHasProjector(booking.hasProjector);
        setHasCoffee(booking.hasCoffee);
        setActiveStep(booking.currentStep || 1);

        if (booking.startsAt) {
          const starts = new Date(booking.startsAt);
          setDate(starts.toISOString().split('T')[0]);
          setStartTime(
            `${starts.getHours().toString().padStart(2, '0')}:${starts.getMinutes().toString().padStart(2, '0')}`
          );
        }
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.DRAFT_ID);
      }
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.DRAFT_ID);
    } finally {
      setLoading(false);
    }
  };

  const initDraftFromQuoter = async () => {
    if (!initialQuoteData) return;
    setSavingStep(true);
    setError(null);

    try {
      const targetRoomId = initialQuoteData.quoteResult.roomId ||
        (ROOMS_CATALOG.find((r) => r.size === initialQuoteData.roomSize)?.id || 1);

      const created = await createDraft(1, {
        roomId: targetRoomId,
        date: initialQuoteData.date,
        startTime: initialQuoteData.startTime,
        durationHours: initialQuoteData.durationHours,
        customerName,
        customerEmail,
      });

      setDraftId(created.id);
      setCurrentBooking(created);
      localStorage.setItem(LOCAL_STORAGE_KEYS.DRAFT_ID, String(created.id));
      setActiveStep(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStep(false);
    }
  };

  const saveStep1 = async () => {
    if (!customerName || !customerEmail) {
      setError('Por favor completa tu nombre y correo electrónico.');
      return;
    }
    setError(null);
    setSavingStep(true);

    try {
      if (!draftId) {
        const created = await createDraft(1, {
          roomId,
          date: date || new Date().toISOString().split('T')[0],
          startTime,
          durationHours,
          customerName,
          customerEmail,
        });
        setDraftId(created.id);
        setCurrentBooking(created);
        localStorage.setItem(LOCAL_STORAGE_KEYS.DRAFT_ID, String(created.id));
      } else {
        const updated = await updateBookingStep(draftId, 1, { customerName, customerEmail });
        setCurrentBooking(updated);
      }
      setActiveStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStep(false);
    }
  };

  const saveStep2 = async () => {
    if (!draftId) return;
    setError(null);
    setSavingStep(true);

    try {
      const updated = await updateBookingStep(draftId, 2, { roomId, date, startTime, durationHours });
      setCurrentBooking(updated);
      setActiveStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStep(false);
    }
  };

  const updateServices = async (newProjector: boolean, newCoffee: boolean) => {
    if (!draftId) return;
    setHasProjector(newProjector);
    setHasCoffee(newCoffee);
    setSavingStep(true);

    try {
      const updated = await updateBookingStep(draftId, 3, {
        hasProjector: newProjector,
        hasCoffee: newCoffee,
      });
      setCurrentBooking(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStep(false);
    }
  };

  const confirm = async () => {
    if (!draftId) return;
    setError(null);
    setLoading(true);

    try {
      const res = await confirmBooking(draftId);
      setConfirmedBooking(res.booking);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.DRAFT_ID);
      if (onBookingConfirmed) onBookingConfirmed();
    } catch (err: any) {
      setError(err.message || 'Error al confirmar la reserva.');
    } finally {
      setLoading(false);
    }
  };

  return {
    activeStep,
    setActiveStep,
    draftId,
    loading,
    savingStep,
    error,
    confirmedBooking,
    customerName,
    setCustomerName,
    customerEmail,
    setCustomerEmail,
    roomId,
    setRoomId,
    date,
    setDate,
    startTime,
    setStartTime,
    durationHours,
    setDurationHours,
    hasProjector,
    hasCoffee,
    currentBooking,
    saveStep1,
    saveStep2,
    updateServices,
    confirm,
    resetWizard: () => {
      setConfirmedBooking(null);
      setDraftId(null);
      setActiveStep(1);
    },
  };
}

