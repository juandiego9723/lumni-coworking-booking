import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  loading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  loading,
}) => {
  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: 'white',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <TextField
        size="small"
        fullWidth
        placeholder="Ej: Sala para 6 el sábado en la mañana..."
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSend()}
        disabled={loading}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
      />
      <IconButton
        color="primary"
        onClick={onSend}
        disabled={loading || !value.trim()}
        sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
      >
        <SendIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default ChatInput;

