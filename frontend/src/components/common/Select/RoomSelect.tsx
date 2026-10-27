import React from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { RoomSize } from '../../../types';
import { ROOMS_CATALOG } from '../../../utils/constants';
import { formatCOP } from '../../../utils/currency';

interface RoomSelectProps {
  value: number | RoomSize | string;
  onChange: (val: any) => void;
  bySize?: boolean;
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  allowAll?: boolean;
  allLabel?: string;
}

export const RoomSelect: React.FC<RoomSelectProps> = ({
  value,
  onChange,
  bySize = false,
  label = 'Sala de Coworking',
  fullWidth = true,
  size = 'medium',
  allowAll = false,
  allLabel = 'Todas las Salas',
}) => {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === '') {
          onChange('');
          return;
        }
        const selectedVal = bySize ? (raw as RoomSize) : Number(raw);
        onChange(selectedVal);
      }}
      fullWidth={fullWidth}
      size={size}
    >
      {allowAll && <MenuItem value="">{allLabel}</MenuItem>}
      {ROOMS_CATALOG.map((room) => (
        <MenuItem key={room.id} value={bySize ? room.size : room.id}>
          {room.name} — {room.capacity} ({formatCOP(room.rate)}/h)
        </MenuItem>
      ))}
    </TextField>
  );
};

export default RoomSelect;

