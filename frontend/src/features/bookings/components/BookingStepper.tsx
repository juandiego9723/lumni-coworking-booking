import React from 'react';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Box from '@mui/material/Box';

interface BookingStepperProps {
  activeStep: number;
}

const STEPS = ['Datos de Contacto', 'Sala y Horario', 'Servicios Adicionales'];

export const BookingStepper: React.FC<BookingStepperProps> = ({ activeStep }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Stepper activeStep={activeStep - 1} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default BookingStepper;

