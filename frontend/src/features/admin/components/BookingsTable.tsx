import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Button, StatusBadge } from '../../../components/common';
import { Booking } from '../../../types';
import { formatCOP } from '../../../utils/currency';
import { formatBookingDate, formatTimeRange, formatDateTime } from '../../../utils/dates';

interface BookingsTableProps {
  bookings: Booking[];
  onCancelClick: (booking: Booking) => void;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
  bookings,
  onCancelClick,
  page,
  totalPages,
  onPageChange,
}) => {
  return (
    <TableContainer component={Card} variant="outlined" sx={{ borderRadius: 3 }}>
      <Table sx={{ minWidth: 850 }} size="small">
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Sala</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Fecha y Horario</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Creación / Cancelación</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Correo Asíncrono</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No se encontraron reservas con los filtros seleccionados.
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>#{b.id}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{b.customerName}</Typography>
                  <Typography variant="caption" color="text.secondary">{b.customerEmail}</Typography>
                </TableCell>
                <TableCell>{b.room?.name || `Sala ${b.roomId}`}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {formatBookingDate(b.startsAt)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Chip
                        size="small"
                        icon={<AccessTimeIcon sx={{ fontSize: '0.85rem !important' }} />}
                        label={formatTimeRange(b.startsAt, b.endsAt, b.durationHours)}
                        variant="outlined"
                        sx={{
                          height: 22,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          borderColor: '#cbd5e1',
                          bgcolor: '#f1f5f9',
                          color: '#1e293b',
                          '& .MuiChip-icon': { ml: '4px', mr: '-2px' },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        ({b.durationHours} hrs)
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                        Creada:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        {formatDateTime(b.createdAt)}
                      </Typography>
                    </Box>
                    {b.status === 'CANCELLED' ? (
                      <Box sx={{ bgcolor: '#fef2f2', p: 0.5, borderRadius: 1, border: '1px solid #fecaca', mt: 0.25 }}>
                        <Typography variant="caption" color="error.main" sx={{ display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>
                          Cancelada: {formatDateTime(b.updatedAt)}
                        </Typography>
                        {b.cancellationReason && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              fontSize: '0.68rem',
                              fontStyle: 'italic',
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={b.cancellationReason}
                          >
                            &quot;{b.cancellationReason}&quot;
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                        Sin cancelar
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{formatCOP(b.totalAmount)}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell>
                  {b.emailOutbox ? (
                    <Chip
                      size="small"
                      label={
                        b.emailOutbox.status === 'SENT'
                          ? '✓ Enviado'
                          : b.emailOutbox.status === 'PENDING'
                            ? `⏳ Pendiente (${b.emailOutbox.attempts}/5)`
                            : `❌ Falló (${b.emailOutbox.attempts}/5)`
                      }
                      color={
                        b.emailOutbox.status === 'SENT'
                          ? 'success'
                          : b.emailOutbox.status === 'PENDING'
                            ? 'warning'
                            : 'error'
                      }
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">Sin outbox</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {(b.status === 'DRAFT' || b.status === 'CONFIRMED') && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => onCancelClick(b)}
                      sx={{ fontSize: '0.7rem', borderRadius: 2 }}
                    >
                      Cancelar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Paginación con Botón Común */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Typography variant="caption" color="text.secondary">
          Página <strong>{page}</strong> de <strong>{totalPages || 1}</strong>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Siguiente
          </Button>
        </Box>
      </Box>
    </TableContainer>
  );
};

export default BookingsTable;
