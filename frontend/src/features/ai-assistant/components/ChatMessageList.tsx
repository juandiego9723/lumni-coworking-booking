import React, { useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { AiChatMessage } from '../../../types';

interface ChatMessageListProps {
  messages: AiChatMessage[];
  loading: boolean;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, loading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: '#f8fafc',
      }}
    >
      {messages.map((m, idx) => (
        <Box
          key={idx}
          sx={{
            display: 'flex',
            gap: 1,
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: m.role === 'user' ? 'primary.main' : '#e0e7ff',
              color: m.role === 'user' ? 'white' : 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {m.role === 'user' ? <PersonIcon sx={{ fontSize: 16 }} /> : <SmartToyIcon sx={{ fontSize: 16 }} />}
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              maxWidth: '80%',
              borderRadius: 2.5,
              bgcolor: m.role === 'user' ? 'primary.main' : 'white',
              color: m.role === 'user' ? 'white' : 'text.primary',
              border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
              whiteSpace: 'pre-line',
              fontSize: '0.85rem',
              lineHeight: 1.4,
            }}
          >
            {m.content}
          </Paper>
        </Box>
      ))}

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
          <SmartToyIcon sx={{ fontSize: 16, animation: 'pulse 1.5s infinite' }} />
          <span>Consultando disponibilidad y reglas de cotización...</span>
        </Box>
      )}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessageList;

