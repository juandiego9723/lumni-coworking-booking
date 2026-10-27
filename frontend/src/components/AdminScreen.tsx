import { useState, useEffect } from 'react';
import { Booking, BookingStatus, EmailStatus } from '../types';
import { listAdminBookings, cancelBookingAdmin, triggerEmailProcess } from '../api/client';
import { Shield, Filter, RefreshCw, XCircle, AlertTriangle, Mail } from 'lucide-react';

export default function AdminScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRoomId, setFilterRoomId] = useState<string>('');

  // Modal Cancelación
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Email Worker Manual Trigger
  const [processingWorker, setProcessingWorker] = useState(false);
  const [workerMessage, setWorkerMessage] = useState<string | null>(null);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

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
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [filterStatus, filterRoomId]);

  const handleConfirmCancel = async () => {
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

  const handleTriggerEmails = async () => {
    setProcessingWorker(true);
    setWorkerMessage(null);
    try {
      const res = await triggerEmailProcess();
      setWorkerMessage(`Worker ejecutado: ${res.summary.processed} correos procesados (${res.summary.succeeded} exitosos, ${res.summary.failed} fallidos)`);
      await loadData();
    } catch (err: any) {
      setWorkerMessage(`Error al disparar worker: ${err.message}`);
    } finally {
      setProcessingWorker(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Confirmada</span>;
      case 'DRAFT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Borrador</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Completada</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Cancelada</span>;
    }
  };

  const getEmailBadge = (emailOutbox?: { status: EmailStatus; attempts: number; lastError?: string | null } | null) => {
    if (!emailOutbox) return <span className="text-xs text-slate-400">Sin outbox</span>;

    if (emailOutbox.status === 'SENT') {
      return (
        <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          ✓ Enviado
        </span>
      );
    }

    if (emailOutbox.status === 'PENDING') {
      return (
        <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title={`Intento ${emailOutbox.attempts}/5`}>
          ⏳ Pendiente ({emailOutbox.attempts}/5)
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 cursor-help"
        title={emailOutbox.lastError || 'Fallo definitivo tras 5 reintentos'}
      >
        ❌ Falló ({emailOutbox.attempts}/5)
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Encabezado Admin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Panel Administrativo</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestión paginada de reservas, cancelación con motivo obligatorio y monitoreo de outbox asíncrono.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTriggerEmails}
            disabled={processingWorker}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center transition-all disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            {processingWorker ? 'Procesando...' : 'Procesar Outbox Ahora'}
          </button>

          <button
            onClick={() => loadData(page)}
            className="p-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {workerMessage && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800">
          {workerMessage}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center text-sm font-semibold text-slate-700 mr-2">
          <Filter className="w-4 h-4 mr-1.5 text-slate-500" />
          Filtros:
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-medium"
          >
            <option value="">Todos los Estados</option>
            <option value="DRAFT">Borrador (DRAFT)</option>
            <option value="CONFIRMED">Confirmada (CONFIRMED)</option>
            <option value="COMPLETED">Completada (COMPLETED)</option>
            <option value="CANCELLED">Cancelada (CANCELLED)</option>
          </select>
        </div>

        <div>
          <select
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white font-medium"
          >
            <option value="">Todas las Salas</option>
            <option value="1">Sala Pequeña</option>
            <option value="2">Sala Mediana</option>
            <option value="3">Sala Grande</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500">
          Total encontradas: <strong>{totalCount}</strong> reservas
        </div>
      </div>

      {/* Tabla Paginada de Reservas */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Sala</th>
                <th className="px-5 py-3.5">Horario</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5">Correo Asíncrono</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No se encontraron reservas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">#{b.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{b.customerName}</div>
                      <div className="text-xs text-slate-500">{b.customerEmail}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800">{b.room?.name || `Sala ${b.roomId}`}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <div>{b.startsAt ? new Date(b.startsAt).toLocaleDateString('es-CO') : '-'}</div>
                      <div>{b.durationHours} hora(s)</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{formatCOP(b.totalAmount)}</td>
                    <td className="px-5 py-3.5">{getStatusBadge(b.status)}</td>
                    <td className="px-5 py-3.5">{getEmailBadge(b.emailOutbox)}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {(b.status === 'DRAFT' || b.status === 'CONFIRMED') && (
                        <button
                          onClick={() => {
                            setSelectedBookingForCancel(b);
                            setCancelReason('');
                            setCancelError(null);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Página <strong>{page}</strong> de <strong>{totalPages || 1}</strong>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadData(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 bg-white border border-slate-300 rounded-md font-medium hover:bg-slate-100 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => loadData(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 bg-white border border-slate-300 rounded-md font-medium hover:bg-slate-100 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Cancelación con Motivo Obligatorio */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center text-rose-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Cancelar Reserva #{selectedBookingForCancel.id}
              </h3>
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mt-3">
              Por especificación de negocio, <strong>es obligatorio indicar el motivo de la cancelación</strong> (mínimo 5 caracteres).
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo de Cancelación *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej. Solicitud de cambio de fecha por parte del cliente."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {cancelError && (
              <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {cancelError}
              </div>
            )}

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setSelectedBookingForCancel(null)}
                className="flex-1 py-2 text-sm font-medium border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                Regresar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="flex-1 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

