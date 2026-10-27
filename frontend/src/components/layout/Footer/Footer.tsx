import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'white',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Lumni Coworking &copy; {new Date().getFullYear()} — Plataforma Modular de Reservas
      </Typography>
    </Box>
  );
};

export default Footer;

