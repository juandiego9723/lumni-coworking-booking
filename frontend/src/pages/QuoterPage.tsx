import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import { useQuoter, QuoterForm, PricingSummary } from '../features/quoter';
import { RoomSize, QuoteResponse } from '../types';

interface QuoterPageProps {
  onProceedToBooking: (quoteData: {
    roomSize: RoomSize;
    date: string;
    startTime: string;
    durationHours: number;
    quoteResult: QuoteResponse;
  }) => void;
}

export const QuoterPage: React.FC<QuoterPageProps> = ({ onProceedToBooking }) => {
  const {
    roomSize,
    setRoomSize,
    date,
    setDate,
    startTime,
    setStartTime,
    durationHours,
    setDurationHours,
    loading,
    quoteResult,
    error,
    calculateQuote,
    resetQuote,
  } = useQuoter();

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 4, px: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
          Cotizador de Salas de Coworking
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Calcula tu tarifa en tiempo real con descuentos por volumen y verifica la disponibilidad instantánea.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 4 }}>
        {/* Formulario Modular */}
        <QuoterForm
          roomSize={roomSize}
          onRoomSizeChange={(size) => {
            setRoomSize(size);
            resetQuote();
          }}
          date={date}
          onDateChange={(d) => {
            setDate(d);
            resetQuote();
          }}
          startTime={startTime}
          onStartTimeChange={(t) => {
            setStartTime(t);
            resetQuote();
          }}
          durationHours={durationHours}
          onDurationChange={(h) => {
            setDurationHours(h);
            resetQuote();
          }}
          onCalculate={() => calculateQuote()}
          loading={loading}
          error={error}
        />

        {/* Resumen Financiero */}
        <Box>
          {quoteResult ? (
            <PricingSummary
              quoteResult={quoteResult}
              durationHours={durationHours}
              onProceed={() =>
                onProceedToBooking({
                  roomSize,
                  date,
                  startTime,
                  durationHours,
                  quoteResult,
                })
              }
              onUseSuggestedSlot={(slot) => calculateQuote(slot)}
            />
          ) : (
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                p: 5,
                textAlign: 'center',
                borderStyle: 'dashed',
                bgcolor: '#f8fafc',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Configura tu sala y haz clic en <strong>Calcular Cotización</strong> para consultar disponibilidad en tiempo real.
              </Typography>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default QuoterPage;
