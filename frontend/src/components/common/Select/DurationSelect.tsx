import React from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

interface DurationSelectProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

export const DurationSelect: React.FC<DurationSelectProps> = ({
  value,
  onChange,
  label = 'Duración',
  fullWidth = true,
  size = 'medium',
}) => {
  // Entre 1 y 10 horas en bloques de 0.5h según la especificación oficial
  const durationOptions = Array.from({ length: 19 }).map((_, idx) => {
    const hours = 1 + idx * 0.5;
    let text = `${hours} hora${hours > 1 ? 's' : ''}`;
    if (hours >= 8) {
      text += ' (20% Dcto)';
    } else if (hours >= 4) {
      text += ' (10% Dcto)';
    }
    return { hours, text };
  });

  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value))}
      fullWidth={fullWidth}
      size={size}
    >
      {durationOptions.map((opt) => (
        <MenuItem key={opt.hours} value={opt.hours}>
          {opt.text}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default DurationSelect;
