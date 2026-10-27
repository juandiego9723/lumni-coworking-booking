import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Button } from '../../../components/common';
import { Booking } from '../../../types';
import { formatCOP } from '../../../utils/currency';

interface BookingConfirmationProps {
  booking: Booking;
  onReset: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ booking, onReset }) => {
  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', py: 4, textAlign: 'center' }}>
      <Card variant="outlined" sx={{ borderRadius: 4, p: 2 }}>
        <CardContent>
          <Box sx={{ color: 'success.main', mb: 2 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            ¡Reserva Confirmada!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tu reserva <strong>#{booking.id}</strong> ha sido confirmada con éxito.
          </Typography>

          <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 3, textAlign: 'left', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Titular:</Typography>
              <Typography variant="body2" fontWeight={600}>{booking.customerName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Correo:</Typography>
              <Typography variant="body2" fontWeight={600}>{booking.customerEmail}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Total Pagado / Pactado:</Typography>
              <Typography variant="body2" fontWeight={800} color="primary.main">
                {formatCOP(booking.totalAmount)}
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ borderRadius: 2, mb: 3, textAlign: 'left' }}>
            Hemos encolado tu correo de confirmación en segundo plano.
          </Alert>

          <Button variant="contained" fullWidth size="large" onClick={onReset} sx={{ borderRadius: 2.5 }}>
            Hacer otra reserva
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BookingConfirmation;
