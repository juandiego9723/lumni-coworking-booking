import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';
import { theme } from './styles/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header, Footer } from './components/layout';
import LoginPage from './pages/LoginPage';
import QuoterPage from './pages/QuoterPage';
import BookingWizardPage from './pages/BookingWizardPage';
import AdminPage from './pages/AdminPage';
import { ChatWidget } from './features/ai-assistant';
import { RoomSize, QuoteResponse } from './types';
import { LOCAL_STORAGE_KEYS } from './utils/constants';

export const AppContent: React.FC = () => {
  const { isAuthenticated, role, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<'quoter' | 'wizard' | 'admin'>('quoter');
  const [hasActiveDraft, setHasActiveDraft] = useState<boolean>(false);

  const [quoteForBooking, setQuoteForBooking] = useState<{
    roomSize: RoomSize;
    date: string;
    startTime: string;
    durationHours: number;
    quoteResult: QuoteResponse;
  } | null>(null);

  const checkActiveDraft = () => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEYS.DRAFT_ID);
    setHasActiveDraft(!!savedDraft);
  };

  useEffect(() => {
    checkActiveDraft();
  }, [currentTab]);

  // Adapta la pestaña automáticamente según el rol autenticado
  useEffect(() => {
    if (isAdmin) {
      setCurrentTab('admin');
    } else {
      if (currentTab === 'admin') {
        setCurrentTab('quoter');
      }
    }
  }, [role, isAdmin, isAuthenticated]);

  const handleProceedToBooking = (quoteData: {
    roomSize: RoomSize;
    date: string;
    startTime: string;
    durationHours: number;
    quoteResult: QuoteResponse;
  }) => {
    setQuoteForBooking(quoteData);
    setCurrentTab('wizard');
  };

  const handleOpenDraftInWizard = (draftId: number) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.DRAFT_ID, String(draftId));
    setQuoteForBooking(null);
    setCurrentTab('wizard');
    checkActiveDraft();
  };

  // Si no está autenticado, muestra la pantalla de Login
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={checkActiveDraft} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        hasActiveDraft={hasActiveDraft}
      />

      <Box component="main" sx={{ flex: 1 }}>
        {currentTab === 'quoter' && (
          <QuoterPage onProceedToBooking={handleProceedToBooking} />
        )}

        {currentTab === 'wizard' && !isAdmin && (
          <BookingWizardPage
            initialQuoteData={quoteForBooking}
            onBookingConfirmed={checkActiveDraft}
          />
        )}

        {currentTab === 'admin' && isAdmin && <AdminPage />}
      </Box>

      {/* Widget de Asistente de IA (Módulo 2.2) */}
      <ChatWidget onOpenDraftInWizard={handleOpenDraftInWizard} />

      <Footer />
    </Box>
  );
};

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
