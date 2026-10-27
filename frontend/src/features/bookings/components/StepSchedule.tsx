import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  Button,
  RoomSelect,
  DatePickerField,
  TimeSelect,
  DurationSelect,
} from '../../../components/common';

interface StepScheduleProps {
  roomId: number;
  onRoomIdChange: (id: number) => void;
  date: string;
  onDateChange: (date: string) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  durationHours: number;
  onDurationChange: (hours: number) => void;
  onPrev: () => void;
  onNext: () => void;
  isSaving: boolean;
}

export const StepSchedule: React.FC<StepScheduleProps> = ({
  roomId,
  onRoomIdChange,
  date,
  onDateChange,
  startTime,
  onStartTimeChange,
  durationHours,
  onDurationChange,
  onPrev,
  onNext,
  isSaving,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="h6" fontWeight={700}>
        Paso 2: Sala y Horario
      </Typography>

      {/* Selector de Sala Común */}
      <RoomSelect value={roomId} onChange={onRoomIdChange} label="Sala a Reservar" />

      {/* Selectores de Fecha y Hora Reutilizables */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
        <DatePickerField value={date} onChange={onDateChange} label="Fecha de Reserva" />
        <TimeSelect value={startTime} onChange={onStartTimeChange} selectedDate={date} />
        <DurationSelect value={durationHours} onChange={onDurationChange} />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button variant="outlined" onClick={onPrev}>
          ← Volver al Paso 1
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          isLoading={isSaving}
          sx={{ flex: 1 }}
        >
          Continuar al Paso 3 →
        </Button>
      </Box>
    </Box>
  );
};

export default StepSchedule;
