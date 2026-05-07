'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Map, Users, Route, MessageSquare, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Ubicación (Mapa)', href: '/dashboard', icon: Map },
    { name: 'Gestión de Usuarios', href: '/dashboard/users', icon: Users },
    { name: 'Historial de Trackeo', href: '/dashboard/tracking', icon: Route },
    { name: 'Mensajes Mesh', href: '/dashboard/messages', icon: MessageSquare },
  ];

  const handleLogout = () => {
    alert('Cerrando sesión...');
    router.push('/login');
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

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600 tracking-wide">INNOVA UTEM</p>
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
          <div className="absolute top-16 right-4 w-56 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              )
            })}
            <hr className="my-1 border-gray-200" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-left w-full"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

    </div>
  );
}