import React from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

interface TimeSelectProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

export const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  label = 'Hora de Inicio',
  fullWidth = true,
  size = 'medium',
}) => {
  // Horario operativo de 07:00 a 20:30 en bloques de 30 min
  const timeSlots = Array.from({ length: 28 }).map((_, idx) => {
    const totalMins = 7 * 60 + idx * 30;
    const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const m = (totalMins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  });

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
        <MenuItem key={slot} value={slot}>
          {slot}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default TimeSelect;

