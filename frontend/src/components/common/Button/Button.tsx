import React from 'react';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';

export interface ButtonProps extends MuiButtonProps {
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading,
  disabled,
  variant = 'contained',
  sx,
  ...props
}) => {
  return (
    <MuiButton
      variant={variant}
      disabled={disabled || isLoading}
      disableElevation
      sx={{
        borderRadius: '10px',
        fontWeight: 600,
        textTransform: 'none',
        ...sx,
      }}
      {...props}
    >
      {isLoading ? 'Cargando...' : children}
    </MuiButton>
  );
};

export default Button;
