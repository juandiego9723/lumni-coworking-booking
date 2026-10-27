import { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../../../types';
import { listAdminBookings, cancelBookingAdmin, triggerEmailProcess } from '../../../services/adminService';

export function useAdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRoomId, setFilterRoomId] = useState<string>('');

  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [processingWorker, setProcessingWorker] = useState(false);
  const [workerMessage, setWorkerMessage] = useState<string | null>(null);

  const loadData = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await listAdminBookings({
        page: targetPage,
        limit: 8,
        status: (filterStatus as BookingStatus) || undefined,
        roomId: filterRoomId ? Number(filterRoomId) : undefined,
      });

      setBookings(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      setPage(res.pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [filterStatus, filterRoomId]);

  const confirmCancel = async () => {
    if (!selectedBookingForCancel) return;
    if (!cancelReason || cancelReason.trim().length < 5) {
      setCancelError('El motivo de cancelación es obligatorio y debe tener al menos 5 caracteres.');
      return;
    }

    setCancelLoading(true);
    setCancelError(null);
    try {
      await cancelBookingAdmin(selectedBookingForCancel.id, cancelReason);
      setSelectedBookingForCancel(null);
      setCancelReason('');
      await loadData();
    } catch (err: any) {
      setCancelError(err.message || 'Error al cancelar la reserva');
    } finally {
      setCancelLoading(false);
    }
  };

  const processEmailsNow = async () => {
    setProcessingWorker(true);
    setWorkerMessage(null);
    try {
      const res = await triggerEmailProcess();
      setWorkerMessage(
        `Worker ejecutado: ${res.summary.processed} correos procesados (${res.summary.succeeded} exitosos, ${res.summary.failed} fallidos)`
      );
      await loadData();
    } catch (err: any) {
      setWorkerMessage(`Error: ${err.message}`);
    } finally {
      setProcessingWorker(false);
    }
  };

  return {
    bookings,
    loading,
    page,
    totalPages,
    totalCount,
    filterStatus,
    setFilterStatus,
    filterRoomId,
    setFilterRoomId,
    loadData,
    selectedBookingForCancel,
    setSelectedBookingForCancel,
    cancelReason,
    setCancelReason,
    cancelLoading,
    cancelError,
    confirmCancel,
    processingWorker,
    workerMessage,
    processEmailsNow,
  };
}

