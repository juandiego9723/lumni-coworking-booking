import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import SyncIcon from '@mui/icons-material/Sync';
import {
  useBookingDraft,
  BookingConfirmation,
  BookingStepper,
  StepCustomer,
  StepSchedule,
  StepServices,
} from '../features/bookings';
import { RoomSize, QuoteResponse } from '../types';

interface BookingWizardPageProps {
  initialQuoteData?: {
    roomSize: RoomSize;
    date: string;
    startTime: string;
    durationHours: number;
    quoteResult: QuoteResponse;
  } | null;
  onBookingConfirmed?: () => void;
}

export const BookingWizardPage: React.FC<BookingWizardPageProps> = ({
  initialQuoteData,
  onBookingConfirmed,
}) => {
  const {
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
    resetWizard,
  } = useBookingDraft({ initialQuoteData, onBookingConfirmed });

  if (confirmedBooking) {
    return <BookingConfirmation booking={confirmedBooking} onReset={resetWizard} />;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
          Reserva de Sala por Pasos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cada paso se guarda automáticamente como borrador persistente en el servidor.
        </Typography>
      </Box>

      {/* Stepper Modular */}
      <BookingStepper activeStep={activeStep} />

      {/* Alerta de Borrador Persistente */}
      {draftId && (
        <Alert
          severity="info"
          icon={<SyncIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          Borrador activo <strong>#{draftId}</strong> sincronizado. Puedes cerrar la ventana y retomar donde ibas.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 4, p: 2 }}>
        <CardContent>
          {activeStep === 1 && (
            <StepCustomer
              name={customerName}
              onNameChange={setCustomerName}
              email={customerEmail}
              onEmailChange={setCustomerEmail}
              onNext={saveStep1}
              isSaving={savingStep}
            />
          )}

          {activeStep === 2 && (
            <StepSchedule
              roomId={roomId}
              onRoomIdChange={setRoomId}
              date={date}
              onDateChange={setDate}
              startTime={startTime}
              onStartTimeChange={setStartTime}
              durationHours={durationHours}
              onDurationChange={setDurationHours}
              onPrev={() => setActiveStep(1)}
              onNext={saveStep2}
              isSaving={savingStep}
            />
          )}

          {activeStep === 3 && (
            <StepServices
              hasProjector={hasProjector}
              hasCoffee={hasCoffee}
              onUpdateServices={updateServices}
              booking={currentBooking}
              onPrev={() => setActiveStep(2)}
              onConfirm={confirm}
              isConfirming={loading}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default BookingWizardPage;
