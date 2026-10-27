import { useState, useEffect } from 'react';
import { Booking, RoomSize, QuoteResponse } from '../types';
import { createDraft, updateBookingStep, confirmBooking, getBookingById } from '../api/client';
import { Check, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface BookingWizardScreenProps {
  initialQuoteData?: {
    roomSize: RoomSize;
    date: string;
    startTime: string;
    durationHours: number;
    quoteResult: QuoteResponse;
  } | null;
  onBookingConfirmed?: () => void;
}

const LOCAL_STORAGE_DRAFT_KEY = 'lumni_active_draft_id';

const ROOMS_CATALOG = [
  { id: 1, size: 'SMALL' as RoomSize, name: 'Sala Pequeña (1-4 personas)', rate: 40000 },
  { id: 2, size: 'MEDIUM' as RoomSize, name: 'Sala Mediana (5-8 personas)', rate: 70000 },
  { id: 3, size: 'LARGE' as RoomSize, name: 'Sala Grande (9-16 personas)', rate: 120000 },
];

export default function BookingWizardScreen({
  initialQuoteData,
  onBookingConfirmed,
}: BookingWizardScreenProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('Juan Cliente');
  const [customerEmail, setCustomerEmail] = useState('cliente@lumni.com');

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

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Cargar borrador previo de localStorage si existe
  useEffect(() => {
    const savedId = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
    if (savedId && !initialQuoteData) {
      const parsedId = parseInt(savedId, 10);
      if (!isNaN(parsedId)) {
        loadExistingDraft(parsedId);
      }
    } else if (initialQuoteData && !draftId) {
      // Si venimos del cotizador con datos prellenados, inicializamos el borrador
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
          const isoDate = starts.toISOString().split('T')[0];
          const hours = starts.getHours().toString().padStart(2, '0');
          const mins = starts.getMinutes().toString().padStart(2, '0');
          setDate(isoDate);
          setStartTime(`${hours}:${mins}`);
        }
      } else {
        localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
      }
    } catch (err) {
      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
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
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, String(created.id));
      setActiveStep(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStep(false);
    }
  };

  // Guardar Paso 1: Datos del Cliente
  const handleSaveStep1 = async () => {
    if (!customerName || !customerEmail) {
      setError('Por favor completa tu nombre y correo electrónico.');
      return;
    }
    setError(null);
    setSavingStep(true);

    try {
      if (!draftId) {
        // Crear primer borrador
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
        localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, String(created.id));
      } else {
        // Actualizar datos del cliente
        const updated = await updateBookingStep(draftId, 1, {
          customerName,
          customerEmail,
        });
        setCurrentBooking(updated);
      }
      setActiveStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStep(false);
    }
  };

  // Guardar Paso 2: Sala y Horario
  const handleSaveStep2 = async () => {
    if (!draftId) return;
    setError(null);
    setSavingStep(true);

    try {
      const updated = await updateBookingStep(draftId, 2, {
        roomId,
        date,
        startTime,
        durationHours,
      });
      setCurrentBooking(updated);
      setActiveStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStep(false);
    }
  };

  // Guardar Paso 3: Servicios adicionales
  const handleUpdateServices = async (newProjector: boolean, newCoffee: boolean) => {
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

  // Confirmar Reserva (draft -> confirmed)
  const handleFinalConfirm = async () => {
    if (!draftId) return;
    setError(null);
    setLoading(true);

    try {
      const res = await confirmBooking(draftId);
      setConfirmedBooking(res.booking);
      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
      if (onBookingConfirmed) onBookingConfirmed();
    } catch (err: any) {
      // Capturar conflicto de concurrencia
      setError(err.message || 'Error al confirmar la reserva.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">¡Reserva Confirmada!</h2>
          <p className="text-slate-600 mt-2">
            Tu reserva <strong className="text-slate-900">#{confirmedBooking.id}</strong> ha sido confirmada con éxito.
          </p>

          <div className="mt-6 p-4 bg-slate-50 rounded-xl text-left text-sm space-y-2 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Titular:</span>
              <span className="font-medium text-slate-800">{confirmedBooking.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Correo:</span>
              <span className="font-medium text-slate-800">{confirmedBooking.customerEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Pagado / Pactado:</span>
              <span className="font-bold text-blue-600">{formatCOP(confirmedBooking.totalAmount)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center justify-center">
            <span>✉️ Hemos encolado tu correo de confirmación en segundo plano.</span>
          </div>

          <button
            onClick={() => {
              setConfirmedBooking(null);
              setDraftId(null);
              setActiveStep(1);
            }}
            className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
          >
            Hacer otra reserva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Encabezado y Progreso */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Formulario de Reserva en 3 Pasos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cada paso se guarda automáticamente como borrador para que puedas retomar en cualquier momento.
        </p>

        {/* Indicador de Pasos */}
        <div className="flex items-center justify-between mt-6 max-w-lg mx-auto">
          {[
            { step: 1, label: '1. Datos del Cliente' },
            { step: 2, label: '2. Sala y Horario' },
            { step: 3, label: '3. Servicios y Total' },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  activeStep === s.step
                    ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                    : activeStep > s.step
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {activeStep > s.step ? <Check className="w-5 h-5" /> : s.step}
              </div>
              <span className="text-xs font-medium text-slate-600 mt-1.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerta de Borrador Persistente */}
      {draftId && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <span>
            💾 <strong>Borrador activo #{draftId}:</strong> Guardado en el servidor. Puedes cerrar el navegador y continuar después.
          </span>
          <button
            onClick={() => loadExistingDraft(draftId)}
            className="font-semibold text-amber-900 hover:underline flex items-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Sincronizar
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Contenido del Paso */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
        {/* PASO 1: DATOS DEL CLIENTE */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Paso 1: Información de Contacto</h2>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="juan@ejemplo.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveStep1}
              disabled={savingStep}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
            >
              {savingStep ? 'Guardando borrador...' : 'Guardar y Continuar al Paso 2 →'}
            </button>
          </div>
        )}

        {/* PASO 2: SALA Y HORARIO */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Paso 2: Sala y Horario</h2>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Sala Seleccionada
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300"
              >
                {ROOMS_CATALOG.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {formatCOP(r.rate)}/h
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hora inicio</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step={1800}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Duración (horas)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={0.5}
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
              >
                ← Volver al Paso 1
              </button>
              <button
                type="button"
                onClick={handleSaveStep2}
                disabled={savingStep}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                {savingStep ? 'Validando horario...' : 'Continuar al Paso 3 →'}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: SERVICIOS ADICIONALES Y CONFIRMACIÓN */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-800">Paso 3: Servicios Adicionales</h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Proyector Full HD</div>
                  <div className="text-xs text-slate-500">Incluye cable HDMI y adaptadores</div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-slate-700 mr-3">+ $20.000 COP</span>
                  <input
                    type="checkbox"
                    checked={hasProjector}
                    onChange={(e) => handleUpdateServices(e.target.checked, hasCoffee)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </label>

              <label className="flex items-center justify-between p-3.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Estación de Café Ilimitada</div>
                  <div className="text-xs text-slate-500">Café de origen, té y agua para los asistentes</div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-slate-700 mr-3">+ $10.000 COP</span>
                  <input
                    type="checkbox"
                    checked={hasCoffee}
                    onChange={(e) => handleUpdateServices(hasProjector, e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </label>
            </div>

            {/* Resumen Final Consolidado */}
            {currentBooking && (
              <div className="mt-6 p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-sm">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-2">
                  Resumen de la Reserva
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tarifa base:</span>
                  <span>{formatCOP(currentBooking.baseAmount)}</span>
                </div>
                {currentBooking.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Descuento aplicado:</span>
                    <span>-{formatCOP(currentBooking.discountAmount)}</span>
                  </div>
                )}
                {currentBooking.surchargeAmount > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>Recargo sábado:</span>
                    <span>+{formatCOP(currentBooking.surchargeAmount)}</span>
                  </div>
                )}
                {currentBooking.servicesAmount > 0 && (
                  <div className="flex justify-between text-indigo-600 font-medium">
                    <span>Servicios adicionales:</span>
                    <span>+{formatCOP(currentBooking.servicesAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-base text-slate-900">
                  <span>Total a Pagar:</span>
                  <span className="text-xl text-blue-600">{formatCOP(currentBooking.totalAmount)}</span>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
              >
                ← Volver al Paso 2
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Confirmando reserva...' : 'Confirmar Reserva Definitiva'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

