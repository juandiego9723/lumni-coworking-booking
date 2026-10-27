import React, { useEffect } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import dayjs from 'dayjs';

interface TimeSelectProps {
  value: string;
  onChange: (val: string) => void;
  selectedDate?: string;
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

export const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  selectedDate,
  label = 'Hora de Inicio',
  fullWidth = true,
  size = 'medium',
}) => {
  const isToday = selectedDate ? dayjs(selectedDate).isSame(dayjs(), 'day') : false;
  const currentMinutesNow = dayjs().hour() * 60 + dayjs().minute();

  // Horario operativo de 07:00 a 20:30 en bloques de 30 min
  const timeSlots = Array.from({ length: 28 }).map((_, idx) => {
    const totalMins = 7 * 60 + idx * 30;
    const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const m = (totalMins % 60).toString().padStart(2, '0');
    const time = `${h}:${m}`;
    const isPast = isToday && totalMins <= currentMinutesNow;

    return {
      time,
      totalMins,
      isPast,
    };
  });

  // Si la fecha seleccionada es hoy y la hora elegida ya pasó, autoseleccionar el primer horario disponible
  useEffect(() => {
    if (isToday) {
      const [h, m] = (value || '00:00').split(':').map(Number);
      const valMinutes = (h || 0) * 60 + (m || 0);

      if (valMinutes <= currentMinutesNow) {
        const firstAvailable = timeSlots.find((s) => !s.isPast);
        if (firstAvailable && firstAvailable.time !== value) {
          onChange(firstAvailable.time);
        }
      }
    }
  }, [selectedDate, isToday, currentMinutesNow, value, onChange]);

  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      fullWidth={fullWidth}
      size={size}
    >
      {timeSlots.map((slot) => (
        <MenuItem
          key={slot.time}
          value={slot.time}
          disabled={slot.isPast}
          sx={slot.isPast ? { opacity: 0.5, fontStyle: 'italic' } : {}}
        >
          {slot.time} {slot.isPast ? '(Pasado)' : ''}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default TimeSelect;
