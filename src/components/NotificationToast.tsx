'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Flame, AlertCircle, X, Bell } from 'lucide-react';

export interface AlertaNotificacion {
  id: string;
  nodoOrigen: string;
  payload: string;
  tipo: string;
  timestamp: Date;
}

interface NotificationToastProps {
  notificacion: AlertaNotificacion | null;
  onCerrar: () => void;
}

export default function NotificationToast({ notificacion, onCerrar }: NotificationToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notificacion) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onCerrar();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [notificacion, onCerrar]);

  if (!notificacion || !visible) return null;

  const esEmergencia = /EMERGENCIA:/i.test(notificacion.payload);
  const esAlerta = /ALERTA:/i.test(notificacion.payload);

  let estiloContenedor = 'bg-slate-900 border-red-600 text-white';
  let Icono = AlertTriangle;
  let colorIcono = 'text-red-500';
  let titulo = 'ALERTA DE SEGURIDAD';

  if (esEmergencia) {
    estiloContenedor = 'bg-red-950 border-red-600 text-red-50 shadow-red-950/50';
    Icono = AlertTriangle;
    colorIcono = 'text-red-400 animate-bounce';
    titulo = 'EMERGENCIA DETECTADA';
  } else if (esAlerta) {
    estiloContenedor = 'bg-orange-950 border-orange-600 text-orange-50 shadow-orange-950/50';
    Icono = Flame;
    colorIcono = 'text-orange-400 animate-pulse';
    titulo = 'ALERTA EN RED MESH';
  } else {
    estiloContenedor = 'bg-amber-950 border-amber-600 text-amber-50 shadow-amber-950/50';
    Icono = AlertCircle;
    colorIcono = 'text-amber-400';
    titulo = 'PRECAUCIÓN';
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 transition-all duration-300 ease-in-out">
      <div className={`p-4 rounded-xl border-2 shadow-2xl backdrop-blur-md flex items-start gap-3 ${estiloContenedor}`}>
        <div className="p-2 rounded-lg bg-black/20 shrink-0">
          <Icono size={24} className={colorIcono} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <Bell size={12} />
              {titulo}
            </span>
            <span className="text-[10px] opacity-75 font-mono">
              {notificacion.timestamp.toLocaleTimeString()}
            </span>
          </div>

          <p className="text-sm font-semibold leading-snug break-words">
            {notificacion.payload}
          </p>

          <p className="text-xs opacity-80 mt-1 font-mono">
            Origen: Nodo {notificacion.nodoOrigen}
          </p>
        </div>

        <button
          onClick={() => {
            setVisible(false);
            onCerrar();
          }}
          className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
