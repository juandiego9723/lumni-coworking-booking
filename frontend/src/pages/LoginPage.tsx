import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Por favor ingresa un correo electrónico.');
      return;
    }
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Por favor ingresa un formato de correo válido (ej: usuario@dominio.com).');
      return;
    }

    setError(null);
    login(trimmed);
    onLoginSuccess?.();
  };

  const handleQuickLogin = (quickEmail: string) => {
    setError(null);
    login(quickEmail);
    onLoginSuccess?.();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        p: 2,
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 4,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Logo y Encabezado */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 52,
                height: 52,
                borderRadius: 3,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                boxShadow: 2,
              }}
            >
              <CorporateFareIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary" gutterBottom>
              Lumni <span style={{ color: '#2563eb' }}>Coworking</span>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa con tu correo de cliente o administrador para adaptar la vista y los permisos correspondientes.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Formulario de Login por Correo */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              placeholder="ej. cliente@lumni.com o admin@lumni.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              variant="outlined"
              size="medium"
              sx={{ mb: 2 }}
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              sx={{
                py: 1.25,
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 600 }}>
              O ACCEDE CON UN PERFIL DE PRUEBA
            </Typography>
          </Divider>

          {/* Accesos Rápidos */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Opción Cliente */}
            <Box
              onClick={() => handleQuickLogin('cliente@lumni.com')}
              sx={{
                p: 1.75,
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: '#eff6ff',
                  transform: 'translateY(-1px)',
                },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                    p: 1,
                    borderRadius: 2,
                    display: 'flex',
                  }}
                >
                  <PersonIcon />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                      Juan Cliente
                    </Typography>
                    <Chip label="CLIENTE" size="small" color="primary" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    cliente@lumni.com &bull; Cotizador y Reservas
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Opción Admin */}
            <Box
              onClick={() => handleQuickLogin('admin@lumni.com')}
              sx={{
                p: 1.75,
                borderRadius: 2.5,
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'secondary.main',
                  bgcolor: '#faf5ff',
                  transform: 'translateY(-1px)',
                },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: '#faf5ff',
                    color: '#9333ea',
                    p: 1,
                    borderRadius: 2,
                    display: 'flex',
                  }}
                >
                  <AdminPanelSettingsIcon />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                      Laura Admin
                    </Typography>
                    <Chip label="ADMIN" size="small" color="secondary" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    admin@lumni.com &bull; Panel Admin y Auditoría
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;

