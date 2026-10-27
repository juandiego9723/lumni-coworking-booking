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
  const { role, setRole } = useAuth();

  return (
    <AppBar position="sticky" color="inherit" elevation={1} sx={{ bgcolor: 'white' }}>
      <Toolbar sx={{ justifyContent: 'space-between', maxWidth: '1280px', width: '100%', mx: 'auto', px: 2 }}>
        {/* Logo */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1 }}
          onClick={() => setCurrentTab('quoter')}
        >
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 0.8,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CorporateFareIcon />
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Lumni <span className="text-blue-600 font-semibold">Coworking</span>
          </Typography>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={currentTab === 'quoter' ? 'contained' : 'text'}
            size="small"
            onClick={() => setCurrentTab('quoter')}
          >
            1.1 Cotizador
          </Button>

          <Button
            variant={currentTab === 'wizard' ? 'contained' : 'text'}
            size="small"
            onClick={() => setCurrentTab('wizard')}
            endIcon={
              hasActiveDraft ? (
                <Chip
                  label="Draft"
                  size="small"
                  color="warning"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                />
              ) : undefined
            }
          >
            1.2 Reservar
          </Button>

          <Button
            variant={currentTab === 'admin' ? 'contained' : 'text'}
            color="secondary"
            size="small"
            startIcon={<AdminPanelSettingsIcon />}
            onClick={() => {
              setRole('ADMIN');
              setCurrentTab('admin');
            }}
          >
            1.3 Admin
          </Button>
        </Box>

        {/* Role Switcher */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f1f5f9', p: 0.5, borderRadius: 2 }}>
          <Button
            size="small"
            variant={role === 'CLIENT' ? 'contained' : 'text'}
            color="inherit"
            startIcon={<PersonIcon color={role === 'CLIENT' ? 'primary' : 'action'} />}
            onClick={() => setRole('CLIENT')}
            sx={{
              bgcolor: role === 'CLIENT' ? 'white' : 'transparent',
              boxShadow: role === 'CLIENT' ? 1 : 0,
              fontSize: '0.75rem',
            }}
          >
            Juan (Cliente)
          </Button>

          <Button
            size="small"
            variant={role === 'ADMIN' ? 'contained' : 'text'}
            color="inherit"
            startIcon={<AdminPanelSettingsIcon color={role === 'ADMIN' ? 'secondary' : 'action'} />}
            onClick={() => {
              setRole('ADMIN');
              setCurrentTab('admin');
            }}
            sx={{
              bgcolor: role === 'ADMIN' ? 'white' : 'transparent',
              boxShadow: role === 'ADMIN' ? 1 : 0,
              fontSize: '0.75rem',
            }}
          >
            Laura (Admin)
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

