import React from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface DatePickerFieldProps {
  value: string; // ISO 'YYYY-MM-DD'
  onChange: (val: string) => void;
  label?: string;
  fullWidth?: boolean;
  showSaturdayAlert?: boolean;
  size?: 'small' | 'medium';
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  label = 'Fecha (Lunes a Sábado)',
  fullWidth = true,
  showSaturdayAlert = true,
  size = 'medium',
}) => {
  const dayjsValue = value ? dayjs(value) : null;
  const isSaturday = dayjsValue ? dayjsValue.day() === 6 : false;

  // Deshabilitar Domingos (regla de negocio Lumni: domingo cerrado)
  const shouldDisableDate = (date: Dayjs) => {
    return date.day() === 0;
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <DatePicker
        label={label}
        value={dayjsValue}
        onChange={(newValue: Dayjs | null) => {
          if (newValue && newValue.isValid()) {
            onChange(newValue.format('YYYY-MM-DD'));
          } else {
            onChange('');
          }
        }}
        shouldDisableDate={shouldDisableDate}
        minDate={dayjs()}
        format="DD/MM/YYYY"
        slotProps={{
          textField: {
            fullWidth,
            size,
          },
        }}
      />

      {showSaturdayAlert && isSaturday && (
        <Alert
          icon={<AutoAwesomeIcon fontSize="inherit" />}
          severity="warning"
          sx={{ mt: 1, py: 0.5, borderRadius: 2, fontSize: '0.75rem' }}
        >
          Los sábados aplican un 25% de recargo sobre el valor base descontado.
        </Alert>
      )}
    </Box>
  );
};

export default DatePickerField;
