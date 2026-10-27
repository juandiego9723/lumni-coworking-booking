import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CalculateIcon from '@mui/icons-material/Calculate';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { RoomSelector } from './RoomSelector';
import { Button, DatePickerField, TimeSelect, DurationSelect } from '../../../components/common';
import { RoomSize } from '../../../types';

interface QuoterFormProps {
  roomSize: RoomSize;
  onRoomSizeChange: (size: RoomSize) => void;
  date: string;
  onDateChange: (date: string) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  durationHours: number;
  onDurationChange: (hours: number) => void;
  onCalculate: () => void;
  loading: boolean;
  error?: string | null;
}

export const QuoterForm: React.FC<QuoterFormProps> = ({
  roomSize,
  onRoomSizeChange,
  date,
  onDateChange,
  startTime,
  onStartTimeChange,
  durationHours,
  onDurationChange,
  onCalculate,
  loading,
  error,
}) => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
      <CardContent>
        {/* Selector Visual de Salas */}
        <RoomSelector selectedSize={roomSize} onSelect={onRoomSizeChange} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Campo de Fecha */}
          <DatePickerField value={date} onChange={onDateChange} />

          {/* Fila de Hora y Duración */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TimeSelect value={startTime} onChange={onStartTimeChange} />
            <DurationSelect value={durationHours} onChange={onDurationChange} />
          </Box>

          {/* Botón de Cálculo con Componente Común y estado de carga */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<CalculateIcon />}
            onClick={onCalculate}
            isLoading={loading}
            sx={{ mt: 1, py: 1.3, borderRadius: 2.5 }}
          >
            Calcular Cotización
          </Button>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2, whiteSpace: 'pre-line' }}>
              <Typography variant="body2" fontWeight={600}>
                {error}
              </Typography>
              {error.includes('backend') && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.9 }}>
                  💡 Ejecuta en una terminal PowerShell: <code>npm run dev:backend</code>
                </Typography>
              )}
            </Alert>
          )}

          {/* Panel de Debug Rápido en Frontend */}
          <Box sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoOutlinedIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Parámetros: Sala <strong>{roomSize}</strong> | Fecha: <strong>{date || 'Sin fecha'}</strong> | Hora: <strong>{startTime}</strong> | Duración: <strong>{durationHours}h</strong>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuoterForm;
