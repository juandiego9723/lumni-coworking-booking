import React from 'react';
import Chip from '@mui/material/Chip';
import { BookingStatus } from '../../../types';

interface StatusBadgeProps {
  status: BookingStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'CONFIRMED':
      return <Chip label="Confirmada" color="success" size="small" sx={{ fontWeight: 700 }} />;
    case 'DRAFT':
      return <Chip label="Borrador" color="warning" size="small" sx={{ fontWeight: 700 }} />;
    case 'COMPLETED':
      return <Chip label="Completada" color="primary" size="small" sx={{ fontWeight: 700 }} />;
    case 'CANCELLED':
      return <Chip label="Cancelada" color="error" size="small" sx={{ fontWeight: 700 }} />;
    default:
      return <Chip label={status} size="small" />;
  }
};

export default StatusBadge;

