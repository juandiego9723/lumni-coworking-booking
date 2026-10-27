import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import QuoterScreen from './components/QuoterScreen';
import BookingWizardScreen from './components/BookingWizardScreen';
import AdminScreen from './components/AdminScreen';
import AiChatWidget from './components/AiChatWidget';
import { RoomSize, QuoteResponse } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'quoter' | 'wizard' | 'admin'>('quoter');
  const [currentUserRole, setCurrentUserRole] = useState<'CLIENT' | 'ADMIN'>('CLIENT');
  const [hasActiveDraft, setHasActiveDraft] = useState<boolean>(false);

  // Datos pasados del cotizador a la reserva
  const [quoteForBooking, setQuoteForBooking] = useState<{
    roomSize: RoomSize;
    date: string;
    startTime: string;
    durationHours: number;
    quoteResult: QuoteResponse;
  } | null>(null);

  const checkActiveDraft = () => {
    const savedDraft = localStorage.getItem('lumni_active_draft_id');
    setHasActiveDraft(!!savedDraft);
  };

  useEffect(() => {
    checkActiveDraft();
  }, [currentTab]);

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
    localStorage.setItem('lumni_active_draft_id', String(draftId));
    setQuoteForBooking(null);
    setCurrentTab('wizard');
    checkActiveDraft();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        hasActiveDraft={hasActiveDraft}
      />

      <main className="flex-1">
        {currentTab === 'quoter' && (
          <QuoterScreen onProceedToBooking={handleProceedToBooking} />
        )}

        {currentTab === 'wizard' && (
          <BookingWizardScreen
            initialQuoteData={quoteForBooking}
            onBookingConfirmed={() => {
              checkActiveDraft();
            }}
          />
        )}

        {currentTab === 'admin' && <AdminScreen />}
      </main>

      {/* Widget Flotante del Asistente Virtual con IA (Parte 2.2) */}
      <AiChatWidget onOpenDraftInWizard={handleOpenDraftInWizard} />

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Lumni Coworking &copy; {new Date().getFullYear()} — Plataforma de Reservas (Prueba Técnica Full Stack)
      </footer>
    </div>
  );
}
