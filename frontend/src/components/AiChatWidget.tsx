import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
}

interface AiChatWidgetProps {
  onOpenDraftInWizard?: (draftId: number) => void;
}

const CHAT_SESSION_KEY = 'lumni_ai_chat_session_id';

export default function AiChatWidget({ onOpenDraftInWizard }: AiChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Recuperar sesión y mensajes previos al montar el componente (Recarga de página)
  useEffect(() => {
    let savedSessionId = localStorage.getItem(CHAT_SESSION_KEY);
    if (!savedSessionId) {
      savedSessionId = crypto.randomUUID();
      localStorage.setItem(CHAT_SESSION_KEY, savedSessionId);
    }
    setSessionId(savedSessionId);
    loadHistory(savedSessionId);
  }, []);

  const loadHistory = async (sid: string) => {
    try {
      const res = await fetch(`/api/ai/chat/${sid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Mensaje inicial de bienvenida
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
      } else {
        setMessages([
          {
            role: 'assistant',
            content: '¡Hola! Soy tu asistente de reservas de Lumni Coworking. Cuéntame qué necesitas en lenguaje natural (ej. *"necesito una sala para 6 personas el sábado en la mañana con proyector"*).',
          },
        ]);
      }
    } catch {
      // Ignorar fallo de red inicial
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          userId: 1,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al conectar con el asistente de IA');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.draftBooking?.id) {
        setActiveDraftId(data.draftBooking.id);
        localStorage.setItem('lumni_active_draft_id', String(data.draftBooking.id));
      }
    } catch (err: any) {
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

  const handleResetChat = () => {
    const newSid = crypto.randomUUID();
    localStorage.setItem(CHAT_SESSION_KEY, newSid);
    setSessionId(newSid);
    setActiveDraftId(null);
    setMessages([
      {
        role: 'assistant',
        content: 'Nueva conversación iniciada. ¿En qué sala y fecha estás interesado hoy?',
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón Flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="text-sm">Asistente IA</span>
          {activeDraftId && (
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" title="Borrador listo" />
          )}
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[92vw] sm:w-[420px] h-[550px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header del Chat */}
          <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">Asistente Virtual Lumni</h3>
                <p className="text-[10px] text-blue-100">IA protegida con validación Zod</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleResetChat}
                className="p-1 hover:bg-white/20 rounded-md text-blue-100 transition-colors"
                title="Reiniciar chat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-md text-blue-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner de Borrador Activo */}
          {activeDraftId && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-2 flex items-center justify-between text-xs text-emerald-800">
              <span className="font-medium">
                📋 Borrador <strong>#{activeDraftId}</strong> generado.
              </span>
              <button
                onClick={() => {
                  if (onOpenDraftInWizard) onOpenDraftInWizard(activeDraftId);
                  setIsOpen(false);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center underline ml-2 shrink-0"
              >
                Confirmar en App <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          )}

          {/* Lista de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-sm bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2 ${
                  m.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm whitespace-pre-line shadow-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 italic">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                </div>
                <span>Consultando disponibilidad y reglas de cotización...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Envío */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ej: Sala para 6 el sábado en la mañana..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputText.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
