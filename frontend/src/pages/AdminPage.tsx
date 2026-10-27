import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { Button } from '../components/common';
import {
  useAdminBookings,
  BookingsFilterBar,
  BookingsTable,
  CancelBookingModal,
} from '../features/admin';

export const AdminPage: React.FC = () => {
  const {
    bookings,
    loading,
    page,
    totalPages,
    totalCount,
    filterStatus,
    setFilterStatus,
    filterRoomId,
    setFilterRoomId,
    loadData,
    selectedBookingForCancel,
    setSelectedBookingForCancel,
    cancelReason,
    setCancelReason,
    cancelLoading,
    cancelError,
    confirmCancel,
    processingWorker,
    workerMessage,
    processEmailsNow,
  } = useAdminBookings();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettingsIcon color="secondary" />
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Panel Administrativo
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Gestión paginada de reservas, cancelación con motivo obligatorio y monitoreo de outbox asíncrono.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<SendIcon />}
            onClick={processEmailsNow}
            isLoading={processingWorker}
            sx={{ borderRadius: 2 }}
          >
            Procesar Outbox Ahora
          </Button>

          <IconButton onClick={() => loadData(page)} sx={{ border: '1px solid #cbd5e1' }}>
            <RefreshIcon className={loading ? 'animate-spin' : ''} />
          </IconButton>
        </Box>
      </Box>

      {workerMessage && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          {workerMessage}
        </Alert>
      )}

      {/* Barra de Filtros Modular con Componente Común */}
      <BookingsFilterBar
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterRoomId={filterRoomId}
        onFilterRoomIdChange={setFilterRoomId}
        totalCount={totalCount}
      />

      {/* Tabla de Reservas Modular con Componente Común */}
      <BookingsTable
        bookings={bookings}
        onCancelClick={(b) => setSelectedBookingForCancel(b)}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => loadData(p)}
      />

      {/* Modal de Cancelación con Componente Común */}
      <CancelBookingModal
        booking={selectedBookingForCancel}
        onClose={() => setSelectedBookingForCancel(null)}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onConfirm={confirmCancel}
        isLoading={cancelLoading}
        error={cancelError}
      />
    </Box>
  );
};

export default AdminPage;
