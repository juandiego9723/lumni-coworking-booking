import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Button } from '../../../components/common';
import { QuoteResponse } from '../../../types';
import { formatCOP } from '../../../utils/currency';

interface PricingSummaryProps {
  quoteResult: QuoteResponse;
  durationHours: number;
  onProceed: () => void;
  onUseSuggestedSlot?: (slot: string) => void;
}

export const PricingSummary: React.FC<PricingSummaryProps> = ({
  quoteResult,
  durationHours,
  onProceed,
  onUseSuggestedSlot,
}) => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
      <CardContent>
        {/* Estado de Disponibilidad y Alertas */}
        {quoteResult.isAvailable ? (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}>
            ¡Horario disponible para reservar!
          </Alert>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2, fontWeight: 500 }}>
              {quoteResult.reason || 'Horario no disponible'}
            </Alert>

            {quoteResult.suggestedNextSlot && (
              <Alert
                severity="warning"
                sx={{ borderRadius: 2 }}
                action={
                  onUseSuggestedSlot && (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => onUseSuggestedSlot(quoteResult.suggestedNextSlot!)}
                    >
                      Usar {quoteResult.suggestedNextSlot}
                    </Button>
                  )
                }
              >
                Sugerencia hoy: a partir de las <strong>{quoteResult.suggestedNextSlot}</strong>.
              </Alert>
            )}
          </Box>
        )}

        {/* Desglose Oficial de Cotización (Siempre presente según especificación del PDF) */}
        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}>
          Desglose de Cotización
        </Typography>

        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <Typography variant="body2" color="text.secondary">
              Tarifa base ({durationHours}h):
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCOP(quoteResult.baseAmount)}
            </Typography>
          </Box>

          {(quoteResult.discountAmount ?? 0) > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
              <Typography variant="body2">Descuento duración:</Typography>
              <Typography variant="body2" fontWeight={600}>
                -{formatCOP(quoteResult.discountAmount)}
              </Typography>
            </Box>
          )}

          {(quoteResult.surchargeAmount ?? 0) > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'warning.main' }}>
              <Typography variant="body2">Recargo sábado (+25%):</Typography>
              <Typography variant="body2" fontWeight={600}>
                +{formatCOP(quoteResult.surchargeAmount)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Total Estimado:
            </Typography>
            <Typography variant="h5" fontWeight={800} color="primary.main">
              {formatCOP(quoteResult.totalAmount)}
            </Typography>
          </Box>
        </Box>

        {/* Botón de Confirmación: Solo disponible si isAvailable es true */}
        {quoteResult.isAvailable && (
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={onProceed}
            sx={{ mt: 3, borderRadius: 2.5, py: 1.2, fontWeight: 700 }}
          >
            Continuar con la Reserva
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingSummary;
