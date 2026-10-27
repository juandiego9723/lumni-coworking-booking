import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import { Button } from '../../../components/common';
import { Booking } from '../../../types';
import { formatCOP } from '../../../utils/currency';

interface StepServicesProps {
  hasProjector: boolean;
  hasCoffee: boolean;
  onUpdateServices: (proj: boolean, coffee: boolean) => void;
  booking: Booking | null;
  onPrev: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
}

export const StepServices: React.FC<StepServicesProps> = ({
  hasProjector,
  hasCoffee,
  onUpdateServices,
  booking,
  onPrev,
  onConfirm,
  isConfirming,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="h6" fontWeight={700}>
        Paso 3: Servicios Adicionales
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasProjector}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateServices(e.target.checked, hasCoffee)
                }
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Proyector Full HD (+ $20.000 COP)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Incluye cables y adaptadores para presentaciones.
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasCoffee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateServices(hasProjector, e.target.checked)
                }
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Estación de Café Ilimitada (+ $10.000 COP)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Café de origen, té y agua para tus asistentes.
                </Typography>
              </Box>
            }
          />
        </Box>
      </Box>

      {/* Resumen Financiero Consolidado */}
      {booking && (
        <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Resumen Financiero Consolidado
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Tarifa Base:</Typography>
            <Typography variant="body2">{formatCOP(booking.baseAmount)}</Typography>
          </Box>
          {booking.discountAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, color: 'success.main' }}>
              <Typography variant="body2">Descuento aplicado:</Typography>
              <Typography variant="body2">-{formatCOP(booking.discountAmount)}</Typography>
            </Box>
          )}
          {booking.surchargeAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, color: 'warning.main' }}>
              <Typography variant="body2">Recargo Sábado (+25%):</Typography>
              <Typography variant="body2">+{formatCOP(booking.surchargeAmount)}</Typography>
            </Box>
          )}
          {booking.servicesAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, color: 'primary.main' }}>
              <Typography variant="body2">Servicios adicionales:</Typography>
              <Typography variant="body2">+{formatCOP(booking.servicesAmount)}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography variant="subtitle1" fontWeight={800}>Total a Pagar:</Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              {formatCOP(booking.totalAmount)}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button variant="outlined" onClick={onPrev}>
          ← Volver al Paso 2
        </Button>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={onConfirm}
          isLoading={isConfirming}
          sx={{ flex: 1, borderRadius: 2.5 }}
        >
          Confirmar Reserva Definitiva
        </Button>
      </Box>
    </Box>
  );
};

export default StepServices;
