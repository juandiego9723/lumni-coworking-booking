import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../../context/AuthContext';

interface HeaderProps {
  currentTab: 'quoter' | 'wizard' | 'admin';
  setCurrentTab: (tab: 'quoter' | 'wizard' | 'admin') => void;
  hasActiveDraft: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  hasActiveDraft,
}) => {
  const { role, userName, userEmail, logout, isAdmin } = useAuth();

  return (
    <AppBar position="sticky" color="inherit" elevation={1} sx={{ bgcolor: 'white' }}>
      <Toolbar sx={{ justifyContent: 'space-between', maxWidth: '1280px', width: '100%', mx: 'auto', px: 2 }}>
        {/* Logo */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1 }}
          onClick={() => setCurrentTab(isAdmin ? 'admin' : 'quoter')}
        >
          <Box
            sx={{
              bgcolor: isAdmin ? 'secondary.main' : 'primary.main',
              color: 'white',
              p: 0.8,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              boxShadow: 1,
            }}
          >
            <CorporateFareIcon />
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Lumni <span style={{ color: isAdmin ? '#9333ea' : '#2563eb', fontWeight: 700 }}>Coworking</span>
          </Typography>
        </Box>

        {/* Menú Dinámico según el Rol */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Si es ADMINISTRADOR: Muestra Panel Administrativo y consulta de Cotizador */}
          {isAdmin ? (
            <>
              <Button
                variant={currentTab === 'admin' ? 'contained' : 'outlined'}
                color="secondary"
                size="small"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => setCurrentTab('admin')}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Panel Administrativo
              </Button>

              <Button
                variant={currentTab === 'quoter' ? 'contained' : 'text'}
                color="inherit"
                size="small"
                onClick={() => setCurrentTab('quoter')}
                sx={{ borderRadius: 2 }}
              >
                Cotizador de Salas
              </Button>
            </>
          ) : (
            /* Si es CLIENTE: Muestra exclusivamente Cotizador y Reservar */
            <>
              <Button
                variant={currentTab === 'quoter' ? 'contained' : 'text'}
                size="small"
                onClick={() => setCurrentTab('quoter')}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Cotizador de Salas
              </Button>

              <Button
                variant={currentTab === 'wizard' ? 'contained' : 'text'}
                size="small"
                onClick={() => setCurrentTab('wizard')}
                sx={{ borderRadius: 2, fontWeight: 600 }}
                endIcon={
                  hasActiveDraft ? (
                    <Chip
                      label="Borrador Activo"
                      size="small"
                      color="warning"
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  ) : undefined
                }
              >
                Mis Reservas
              </Button>
            </>
          )}
        </Box>

        {/* Perfil del Usuario Activo y Botón de Salir */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              py: 0.5,
              px: 1.5,
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                bgcolor: isAdmin ? '#faf5ff' : '#eff6ff',
                color: isAdmin ? 'secondary.main' : 'primary.main',
                p: 0.5,
                borderRadius: '50%',
                display: 'flex',
              }}
            >
              {isAdmin ? <AdminPanelSettingsIcon sx={{ fontSize: 18 }} /> : <PersonIcon sx={{ fontSize: 18 }} />}
            </Box>
            <Box sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem', lineHeight: 1.1 }}>
                  {userName}
                </Typography>
                <Chip
                  label={role}
                  size="small"
                  color={isAdmin ? 'secondary' : 'primary'}
                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                {userEmail}
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon sx={{ fontSize: '1rem' }} />}
            onClick={logout}
            sx={{
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              borderColor: '#fca5a5',
              '&:hover': {
                bgcolor: '#fef2f2',
                borderColor: '#ef4444',
              },
            }}
          >
            Cerrar Sesión
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
