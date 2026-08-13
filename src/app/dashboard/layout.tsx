'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Map, Users, Route, MessageSquare, LogOut, Menu, Activity, UserCircle, Settings, Radio } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import NotificationToast, { AlertaNotificacion } from '@/components/NotificationToast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [rolUsuario, setRolUsuario] = useState('');
  const [nodoUsuario, setNodoUsuario] = useState<string | null>(null);
  const [notificacionActiva, setNotificacionActiva] = useState<AlertaNotificacion | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:4000');

    socket.on('nuevoMensajeMesh', (data) => {
      const payloadObj = data?.payload;
      if (!payloadObj) return;

      const textoPayload = payloadObj.mensajeTexto || payloadObj.metadatos?.payload || '';
      const esEmergencia = /EMERGENCIA:/i.test(textoPayload);
      const esAlerta = /ALERTA:/i.test(textoPayload);
      const esPrecaucion = /PRECAUCIÓN:/i.test(textoPayload);

      if (esEmergencia || esAlerta || esPrecaucion) {
        setNotificacionActiva({
          id: payloadObj._id || Math.random().toString(36).substring(7),
          nodoOrigen: payloadObj.nodoId || 'Desconocido',
          payload: textoPayload,
          tipo: payloadObj.tipoPaquete || 'TEXTO',
          timestamp: new Date()
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCerrarNotificacion = useCallback(() => {
    setNotificacionActiva(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('mesh_token');
    const userStr = localStorage.getItem('mesh_user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setNombreUsuario(user.nombre);
        setRolUsuario(user.rol);
        setNodoUsuario(user.nodoId || null);
      } catch (error) {
        console.error('Error leyendo los datos del usuario');
      }
    }
  }, [router]);

  const allMenuItems = [
    { name: 'Ubicación (Mapa)', href: '/dashboard', icon: Map, roles: ['Admin', 'Operador', 'Usuario'] },
    { name: 'Gestión de Usuarios', href: '/dashboard/users', icon: Users, roles: ['Admin', 'Operador'] },
    { name: 'Historial de Trackeo', href: '/dashboard/tracking', icon: Route, roles: ['Admin', 'Operador', 'Usuario'] },
    { name: 'Mensajes Mesh', href: '/dashboard/messages', icon: MessageSquare, roles: ['Admin', 'Operador', 'Usuario'] },
    { name: 'Analítica y Métricas', href: '/dashboard/analytics', icon: Activity, roles: ['Admin', 'Operador'] },
    { name: 'Configuraciones', href: '/dashboard/settings', icon: Settings, roles: ['Admin'] },
  ];

  const menuItems = allMenuItems.filter(item => !rolUsuario || item.roles.includes(rolUsuario));

  const handleLogout = () => {
    localStorage.removeItem('mesh_token');
    localStorage.removeItem('mesh_user');
    router.push('/login');
  };

  const getRoleBadgeClass = (rol: string) => {
    if (rol === 'Admin') return 'bg-purple-100 text-purple-700 border border-purple-200';
    if (rol === 'Operador') return 'bg-blue-100 text-blue-700 border border-blue-200';
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h2 className="text-xl font-bold text-blue-600">LoRa Mesh UI</h2>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start gap-3 px-2 mb-3">
            <UserCircle size={32} className="text-gray-400 shrink-0 mt-0.5" />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-gray-800 truncate">{nombreUsuario || 'Cargando...'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${getRoleBadgeClass(rolUsuario)}`}>
                  {rolUsuario || 'Usuario'}
                </span>
              </div>
              {nodoUsuario && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-gray-600 mt-1 bg-gray-200/70 px-1.5 py-0.5 rounded truncate">
                  <Radio size={12} className="text-blue-600 shrink-0" />
                  <span className="truncate">Radio: {nodoUsuario}</span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
          
          <div className="text-center mt-4">
            <p className="text-xs font-bold text-gray-400 tracking-widest">INNOVA UTEM</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <h2 className="text-xl font-bold text-blue-600">LoRa Mesh UI</h2>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>

      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="absolute top-16 right-4 w-60 bg-white rounded-lg shadow-xl border border-gray-200 p-3 flex flex-col gap-1">
            
            <div className="px-3 py-2 mb-1 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-800 truncate">{nombreUsuario}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${getRoleBadgeClass(rolUsuario)}`}>
                  {rolUsuario}
                </span>
              </div>
              {nodoUsuario && (
                <div className="flex items-center gap-1 text-xs font-mono text-gray-600 mt-1">
                  <Radio size={12} className="text-blue-600 shrink-0" />
                  <span>Radio: {nodoUsuario}</span>
                </div>
              )}
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              )
            })}
            <hr className="my-1 border-gray-200" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-left w-full text-sm"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      <NotificationToast 
        notificacion={notificacionActiva} 
        onCerrar={handleCerrarNotificacion} 
      />

    </div>
  );
}
