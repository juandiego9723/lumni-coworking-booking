import React from 'react';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { Modal, Button } from '../../../components/common';
import { Booking } from '../../../types';

interface CancelBookingModalProps {
  booking: Booking | null;
  onClose: () => void;
  reason: string;
  onReasonChange: (val: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  booking,
  onClose,
  reason,
  onReasonChange,
  onConfirm,
  isLoading,
  error,
}) => {
  if (!booking) return null;

  return (
    <Modal
      open={!!booking}
      onClose={onClose}
      title={`Cancelar Reserva #${booking.id}`}
      actions={
        <>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>
            Regresar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={reason.trim().length < 5}
          >
            Confirmar Cancelación
          </Button>
        </>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Por especificación de negocio, <strong>es obligatorio indicar el motivo de la cancelación</strong> (mínimo 5 caracteres).
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Motivo de Cancelación *"
        placeholder="Ej. El cliente solicitó reprogramar la reunión para otra fecha."
        value={reason}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onReasonChange(e.target.value)}
        error={!!error}
        helperText={error || 'Mínimo 5 caracteres'}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
    </Modal>
  );
};

export default CancelBookingModal;
