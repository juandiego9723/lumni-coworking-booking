import { useState, useEffect } from 'react';
import { sendChatMessage, getChatHistory } from '../../../services/aiService';
import { LOCAL_STORAGE_KEYS } from '../../../utils/constants';
import { AiChatMessage } from '../../../types';

export function useAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);

  useEffect(() => {
    let savedSessionId = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_CHAT_SESSION_ID);
    if (!savedSessionId) {
      savedSessionId = crypto.randomUUID();
      localStorage.setItem(LOCAL_STORAGE_KEYS.AI_CHAT_SESSION_ID, savedSessionId);
    }
    setSessionId(savedSessionId);
    loadHistory(savedSessionId);
  }, []);

  const loadHistory = async (sid: string) => {
    try {
      const data = await getChatHistory(sid);
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      } else {
        setMessages([
          {
            role: 'assistant',
            content: '¡Hola! Soy tu asistente de reservas de Lumni Coworking. Cuéntame qué necesitas en lenguaje natural (ej. *"necesito una sala para 6 personas el sábado en la mañana con proyector"*).',
          },
        ]);
      }
      if (data.draftBookingId) {
        setActiveDraftId(data.draftBookingId);
      }
    } catch {
      setMessages([
        {
          role: 'assistant',
          content: '¡Hola! Soy tu asistente de reservas de Lumni Coworking. Cuéntame qué necesitas en lenguaje natural (ej. *"necesito una sala para 6 personas el sábado en la mañana con proyector"*).',
        },
      ]);
    }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    const userMsg: AiChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const data = await sendChatMessage({ sessionId, message: text, userId: 1 });
      const assistantMsg: AiChatMessage = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.draftBooking?.id) {
        setActiveDraftId(data.draftBooking.id);
        localStorage.setItem(LOCAL_STORAGE_KEYS.DRAFT_ID, String(data.draftBooking.id));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, ocurrió un error temporal al procesar tu solicitud. Por favor intenta de nuevo.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    const newSid = crypto.randomUUID();
    localStorage.setItem(LOCAL_STORAGE_KEYS.AI_CHAT_SESSION_ID, newSid);
    setSessionId(newSid);
    setActiveDraftId(null);
    setMessages([
      {
        role: 'assistant',
        content: 'Nueva conversación iniciada. ¿En qué sala y fecha estás interesado hoy?',
      },
    ]);
  };

  return {
    isOpen,
    setIsOpen,
    sessionId,
    messages,
    inputText,
    setInputText,
    loading,
    activeDraftId,
    sendMessage,
    resetChat,
  };
}
