import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { Button } from '../../../components/common';

interface StepCustomerProps {
  name: string;
  onNameChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  onNext: () => void;
  isSaving: boolean;
}

export const StepCustomer: React.FC<StepCustomerProps> = ({
  name,
  onNameChange,
  email,
  onEmailChange,
  onNext,
  isSaving,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="h6" fontWeight={700}>
        Paso 1: Información del Cliente
      </Typography>

      <TextField
        label="Nombre Completo"
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
        fullWidth
      />

      <TextField
        label="Correo Electrónico"
        type="email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
        fullWidth
      />

      <Button
        variant="contained"
        size="large"
        onClick={onNext}
        isLoading={isSaving}
        sx={{ mt: 2, borderRadius: 2.5 }}
      >
        Guardar y Continuar al Paso 2 →
      </Button>
    </Box>
  );
};

export default StepCustomer;
