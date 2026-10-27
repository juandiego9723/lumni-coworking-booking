import { useState } from 'react';
import { RoomSize, QuoteResponse } from '../types';
import { requestQuote } from '../api/client';
import { Calendar, Clock, DollarSign, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

interface QuoterScreenProps {
  onProceedToBooking: (quoteData: {
    roomSize: RoomSize;
    date: string;
    startTime: string;
    durationHours: number;
    quoteResult: QuoteResponse;
  }) => void;
}

const ROOM_OPTIONS = [
  { size: 'SMALL' as RoomSize, name: 'Sala Pequeña', capacity: '1 - 4 personas', rate: 40000, color: 'border-emerald-200 bg-emerald-50/50' },
  { size: 'MEDIUM' as RoomSize, name: 'Sala Mediana', capacity: '5 - 8 personas', rate: 70000, color: 'border-blue-200 bg-blue-50/50' },
  { size: 'LARGE' as RoomSize, name: 'Sala Grande', capacity: '9 - 16 personas', rate: 120000, color: 'border-purple-200 bg-purple-50/50' },
];

export default function QuoterScreen({ onProceedToBooking }: QuoterScreenProps) {
  // Configurar fecha por defecto (mañana o lunes si hoy es sábado/domingo)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1); // Evitar domingo
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [roomSize, setRoomSize] = useState<RoomSize>('SMALL');
  const [date, setDate] = useState<string>(defaultDateStr);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [durationHours, setDurationHours] = useState<number>(2);

  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formateador de moneda en pesos colombianos COP
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCalculateQuote = async (customStartTime?: string) => {
    setLoading(true);
    setError(null);
    const timeToUse = customStartTime || startTime;

    try {
      const response = await requestQuote({
        roomSize,
        date,
        startTime: timeToUse,
        durationHours: Number(durationHours),
      });

      setQuoteResult(response);
      if (customStartTime) {
        setStartTime(customStartTime);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cotizar sala');
      setQuoteResult(null);
    } finally {
      setLoading(false);
    }
  };

  const isSaturday = (() => {
    if (!date) return false;
    const parts = date.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDay() === 6;
  })();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cotizador de Salas de Coworking
        </h1>
        <p className="mt-2 text-slate-600">
          Calcula tu tarifa en tiempo real con descuentos por volumen y verifica la disponibilidad instantánea.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario de Cotización (Columna Izquierda) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Configura tu reserva
          </h2>

          <div className="space-y-5">
            {/* 1. Selección de Sala */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Selecciona la Sala
              </label>
              <div className="grid grid-cols-3 gap-3">
                {ROOM_OPTIONS.map((opt) => (
                  <button
                    key={opt.size}
                    type="button"
                    onClick={() => {
                      setRoomSize(opt.size);
                      setQuoteResult(null);
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      roomSize === opt.size
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-sm">{opt.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.capacity}</div>
                    <div className="text-xs font-semibold text-blue-700 mt-2">
                      {formatCOP(opt.rate)} /h
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Fecha de Reserva */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Fecha (Lunes a Sábado)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setQuoteResult(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {isSaturday && (
                <p className="text-xs text-amber-600 mt-1 flex items-center font-medium">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Los sábados aplican un 25% de recargo sobre el valor ya descontado.
                </p>
              )}
            </div>

            {/* 3. Hora de Inicio y Duración */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Hora de inicio (07:00 a 20:30)
                </label>
                <select
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setQuoteResult(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const totalMins = 7 * 60 + idx * 30;
                    const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
                    const m = (totalMins % 60).toString().padStart(2, '0');
                    const val = `${h}:${m}`;
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Duración (horas)
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => {
                    setDurationHours(parseFloat(e.target.value));
                    setQuoteResult(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {Array.from({ length: 19 }).map((_, idx) => {
                    const hours = 1 + idx * 0.5;
                    let label = `${hours} hora${hours > 1 ? 's' : ''}`;
                    if (hours >= 8) label += ' (20% Dcto)';
                    else if (hours >= 4) label += ' (10% Dcto)';
                    return <option key={hours} value={hours}>{label}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Botón de Calcular Cotización */}
            <button
              type="button"
              onClick={() => handleCalculateQuote()}
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span>Consultando disponibilidad...</span>
              ) : (
                <>
                  <DollarSign className="w-5 h-5 mr-1.5" />
                  Calcular Cotización y Disponibilidad
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta de Desglose y Disponibilidad (Columna Derecha) */}
        <div className="lg:col-span-5 space-y-4">
          {quoteResult ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              {/* Estado de Disponibilidad */}
              <div className="mb-5 pb-4 border-b border-slate-100">
                {quoteResult.isAvailable ? (
                  <div className="flex items-center text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-sm font-semibold">
                    <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
                    <span>¡Horario disponible para reservar!</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start text-rose-700 bg-rose-50 p-3 rounded-lg text-sm font-medium">
                      <AlertTriangle className="w-5 h-5 mr-2 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <div className="font-bold">No disponible</div>
                        <div>{quoteResult.reason}</div>
                      </div>
                    </div>

                    {quoteResult.suggestedNextSlot && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm">
                        <span className="font-semibold text-amber-900 block mb-1">
                          Sugerencia para hoy:
                        </span>
                        <p className="text-amber-800 text-xs mb-2">
                          Hay cupo disponible a partir de las <strong>{quoteResult.suggestedNextSlot}</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCalculateQuote(quoteResult.suggestedNextSlot!)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md transition-colors"
                        >
                          Usar horario {quoteResult.suggestedNextSlot}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Desglose de Precios */}
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                Desglose de Cotización
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tarifa base ({durationHours}h):</span>
                  <span className="font-medium text-slate-800">{formatCOP(quoteResult.baseAmount)}</span>
                </div>

                {quoteResult.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Descuento por duración:</span>
                    <span>-{formatCOP(quoteResult.discountAmount)}</span>
                  </div>
                )}

                {quoteResult.surchargeAmount > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>Recargo sábado (+25%):</span>
                    <span>+{formatCOP(quoteResult.surchargeAmount)}</span>
                  </div>
                )}

                <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-900">Total Estimado:</span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    {formatCOP(quoteResult.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Botón de Continuar a Reserva */}
              {quoteResult.isAvailable && (
                <button
                  type="button"
                  onClick={() =>
                    onProceedToBooking({
                      roomSize,
                      date,
                      startTime,
                      durationHours,
                      quoteResult,
                    })
                  }
                  className="w-full mt-6 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center"
                >
                  Continuar con la Reserva
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-100/70 border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-medium">
                Selecciona tus preferencias y haz clic en <strong>Calcular Cotización</strong> para ver el desglose en tiempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

