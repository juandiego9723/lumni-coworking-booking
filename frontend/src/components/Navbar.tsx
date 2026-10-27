import { Building2, Shield, User } from 'lucide-react';

interface NavbarProps {
  currentTab: 'quoter' | 'wizard' | 'admin';
  setCurrentTab: (tab: 'quoter' | 'wizard' | 'admin') => void;
  currentUserRole: 'CLIENT' | 'ADMIN';
  setCurrentUserRole: (role: 'CLIENT' | 'ADMIN') => void;
  hasActiveDraft: boolean;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  currentUserRole,
  setCurrentUserRole,
  hasActiveDraft,
}: NavbarProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Marca */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('quoter')}>
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Lumni</span>
              <span className="text-xl font-medium text-blue-600 ml-1">Coworking</span>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentTab('quoter')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'quoter'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              1.1 Cotizador
            </button>

            <button
              onClick={() => setCurrentTab('wizard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                currentTab === 'wizard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              1.2 Reservar en 3 Pasos
              {hasActiveDraft && (
                <span className="ml-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Borrador activo" />
              )}
            </button>

            <button
              onClick={() => {
                setCurrentUserRole('ADMIN');
                setCurrentTab('admin');
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                currentTab === 'admin'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4 mr-1.5" />
              1.3 Panel Admin
            </button>
          </nav>

          {/* Selector de Usuario Sembrado (Simulación Auth) */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium px-2">Rol activo:</span>
            <button
              onClick={() => setCurrentUserRole('CLIENT')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center ${
                currentUserRole === 'CLIENT'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Juan (Cliente)
            </button>
            <button
              onClick={() => {
                setCurrentUserRole('ADMIN');
                setCurrentTab('admin');
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center ${
                currentUserRole === 'ADMIN'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Laura (Admin)
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

