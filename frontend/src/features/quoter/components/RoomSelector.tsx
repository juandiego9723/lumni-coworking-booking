import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import { RoomSize } from '../../../types';
import { ROOMS_CATALOG } from '../../../utils/constants';
import { formatCOP } from '../../../utils/currency';

interface RoomSelectorProps {
  selectedSize: RoomSize;
  onSelect: (size: RoomSize) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({ selectedSize, onSelect }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
        Selecciona la Sala
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
        {ROOMS_CATALOG.map((room) => {
          const isSelected = selectedSize === room.size;
          return (
            <Card
              key={room.size}
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: isSelected ? 'primary.main' : 'divider',
                borderWidth: isSelected ? 2 : 1,
                bgcolor: isSelected ? '#eff6ff' : 'background.paper',
                transition: 'all 0.2s',
              }}
            >
              <CardActionArea onClick={() => onSelect(room.size)} sx={{ height: '100%', p: 1 }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {room.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                    {room.capacity}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {formatCOP(room.rate)} /h
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

