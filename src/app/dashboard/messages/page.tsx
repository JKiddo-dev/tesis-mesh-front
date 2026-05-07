'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, Clock, Download, Filter, Radio } from 'lucide-react';

interface MensajeMesh {
  id: string;
  nodoOrigen: string;
  payload: string;
  rssi: number; 
  timestamp: Date;
  encriptado: boolean;
}

export default function MensajesPage() {
  const [mensajes, setMensajes] = useState<MensajeMesh[]>([
    { id: '1', nodoOrigen: 'LILYGO-01', payload: '{"lat":-33.448,"lng":-70.669,"bat":98}', rssi: -45, timestamp: new Date(Date.now() - 60000), encriptado: true },
    { id: '2', nodoOrigen: 'LILYGO-02', payload: '{"lat":-33.452,"lng":-70.650,"bat":85}', rssi: -78, timestamp: new Date(Date.now() - 30000), encriptado: true },
  ]);

  const [filtroNodo, setFiltroNodo] = useState<string>('Todos');
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const nuevoMensaje: MensajeMesh = {
        id: Math.random().toString(36).substring(7),
        nodoOrigen: Math.random() > 0.5 ? 'LILYGO-01' : 'LILYGO-02',
        payload: `{"lat":-33.4${Math.floor(Math.random() * 99)},"lng":-70.6${Math.floor(Math.random() * 99)},"bat":${Math.floor(Math.random() * 20) + 80}}`,
        rssi: -(Math.floor(Math.random() * 50) + 40), 
        timestamp: new Date(),
        encriptado: true
      };
      
      setMensajes((prev) => [...prev, nuevoMensaje]);
    }, 8000); 

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const mensajesFiltrados = filtroNodo === 'Todos' 
    ? mensajes 
    : mensajes.filter(m => m.nodoOrigen === filtroNodo);

  return (
    <div className="flex flex-col gap-6 h-full">
      
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tráfico de Red Mesh</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor de paquetes MQTT en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
            <Download size={18} />
            Exportar Log
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-[500px]">
        
        <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-gray-800 font-semibold border-b border-gray-100 pb-2">
            <Filter size={18} />
            Filtros
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => setFiltroNodo('Todos')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filtroNodo === 'Todos' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Todos los Nodos
            </button>
            <button 
              onClick={() => setFiltroNodo('LILYGO-01')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${filtroNodo === 'LILYGO-01' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>LILYGO-01 (Gateway)</span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </button>
            <button 
              onClick={() => setFiltroNodo('LILYGO-02')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${filtroNodo === 'LILYGO-02' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>LILYGO-02 (Móvil)</span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </button>
          </div>

          <div className="mt-auto bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="text-xs text-gray-500 flex justify-between mb-1">
              <span>Paquetes totales:</span>
              <span className="font-bold">{mensajes.length}</span>
            </div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <Activity size={14} /> Sistema operando
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 rounded-xl shadow-sm border border-gray-800 flex flex-col overflow-hidden font-mono text-sm">
          
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center text-slate-300">
            <div className="flex items-center gap-2">
              <Terminal size={16} />
              <span>Log de MQTT (AES-128 Decrypted)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Conectado al Broker
            </div>
          </div>

          {/* Área de mensajes (Scrolleable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {mensajesFiltrados.length === 0 ? (
              <div className="text-slate-500 text-center mt-10">No hay mensajes para este nodo.</div>
            ) : (
              mensajesFiltrados.map((msg) => (
                <div key={msg.id} className="bg-slate-800/50 p-3 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">{msg.nodoOrigen}</span>
                      <span className="text-slate-500 text-xs">ID: {msg.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1" title="Fuerza de la señal">
                        <Radio size={14} className={msg.rssi > -60 ? 'text-green-400' : 'text-yellow-400'} />
                        {msg.rssi} dBm
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-green-400 break-all">
                    {msg.payload}
                  </div>
                </div>
              ))
            )}
            <div ref={mensajesEndRef} />
          </div>

        </div>

      </div>
    </div>
  );
}