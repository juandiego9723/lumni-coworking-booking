import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { RoomSelect } from '../../../components/common';

interface BookingsFilterBarProps {
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  filterRoomId: string;
  onFilterRoomIdChange: (roomId: string) => void;
  totalCount: number;
}

export const BookingsFilterBar: React.FC<BookingsFilterBarProps> = ({
  filterStatus,
  onFilterStatusChange,
  filterRoomId,
  onFilterRoomIdChange,
  totalCount,
}) => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" fontWeight={700} sx={{ mr: 1 }}>
            Filtros:
          </Typography>

          <TextField
            select
            size="small"
            label="Estado"
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFilterStatusChange(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos los Estados</MenuItem>
            <MenuItem value="DRAFT">Borrador (DRAFT)</MenuItem>
            <MenuItem value="CONFIRMED">Confirmada (CONFIRMED)</MenuItem>
            <MenuItem value="COMPLETED">Completada (COMPLETED)</MenuItem>
            <MenuItem value="CANCELLED">Cancelada (CANCELLED)</MenuItem>
          </TextField>

          {/* Selector común reutilizable con allowAll */}
          <Box sx={{ minWidth: 200 }}>
            <RoomSelect
              size="small"
              label="Filtrar por Sala"
              value={filterRoomId}
              onChange={(val) => onFilterRoomIdChange(val ? String(val) : '')}
              allowAll
              allLabel="Todas las Salas"
              fullWidth={false}
            />
          </Box>

          <Box sx={{ ml: 'auto' }}>
            <Typography variant="caption" color="text.secondary">
              Total: <strong>{totalCount}</strong> reservas
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BookingsFilterBar;
