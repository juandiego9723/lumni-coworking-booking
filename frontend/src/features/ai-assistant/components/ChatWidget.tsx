import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Button } from '../../../components/common';
import { useAiChat } from '../hooks/useAiChat';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

interface ChatWidgetProps {
  onOpenDraftInWizard?: (draftId: number) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onOpenDraftInWizard }) => {
  const {
    isOpen,
    setIsOpen,
    messages,
    inputText,
    setInputText,
    loading,
    activeDraftId,
    sendMessage,
    resetChat,
  } = useAiChat();

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}>
      {/* Floating Action Button (MUI Fab) */}
      {!isOpen && (
        <Badge
          color="success"
          variant="dot"
          invisible={!activeDraftId}
          overlap="circular"
        >
          <Fab
            color="primary"
            variant="extended"
            onClick={() => setIsOpen(true)}
            sx={{
              px: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 4,
            }}
          >
            <AutoAwesomeIcon sx={{ mr: 1, color: '#fcd34d' }} />
            Asistente IA
          </Fab>
        </Badge>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Paper
          elevation={8}
          sx={{
            width: { xs: '90vw', sm: 420 },
            height: 550,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon sx={{ color: '#fcd34d' }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Asistente Virtual Lumni
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.65rem' }}>
                  IA protegida con validación Zod
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" color="inherit" onClick={resetChat} title="Reiniciar chat">
                <RefreshIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="inherit" onClick={() => setIsOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Active Draft Banner */}
          {activeDraftId && (
            <Box
              sx={{
                bgcolor: '#ecfdf5',
                borderBottom: '1px solid #a7f3d0',
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 600 }}>
                📋 Borrador <strong>#{activeDraftId}</strong> generado.
              </Typography>
              <Button
                size="small"
                variant="text"
                color="success"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => {
                  if (onOpenDraftInWizard) onOpenDraftInWizard(activeDraftId);
                  setIsOpen(false);
                }}
                sx={{ fontSize: '0.7rem', fontWeight: 700 }}
              >
                Confirmar en App
              </Button>
            </Box>
          )}

          {/* Messages Container Modular */}
          <ChatMessageList messages={messages} loading={loading} />

          {/* Input Box Modular */}
          <ChatInput
            value={inputText}
            onChange={setInputText}
            onSend={sendMessage}
            loading={loading}
          />
        </Paper>
      )}
    </Box>
  );
};

export default ChatWidget;
