'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, Clock, Filter } from 'lucide-react';
import { io } from 'socket.io-client';

interface MensajeMesh {
  id: string;
  nodoOrigen: string;
  payload: string;
  rssi: number;
  timestamp: Date;
  tipo: string;
}

export default function MensajesPage() {
  const [mensajes, setMensajes] = useState<MensajeMesh[]>([]);
  const [filtroNodo, setFiltroNodo] = useState<string>('Todos');
  const [conexionSocket, setConexionSocket] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const respuesta = await fetch('http://localhost:4000/telemetry/messages');
        if (respuesta.ok) {
          const historial = await respuesta.json();
          
          const mensajesHistoricos: MensajeMesh[] = historial.map((doc: any) => {
            let textoPayload = '';
            
            if (doc.tipoPaquete === 'position') {
              textoPayload = `GPS: Lat ${doc.latitud || 'N/A'}, Lng ${doc.longitud || 'N/A'}`;
            } else if (doc.tipoPaquete === 'text') {
              textoPayload = `Mensaje: ${doc.mensajeTexto || 'Sin texto'}`;
            } else {
              textoPayload = `Sistema: Paquete tipo '${doc.tipoPaquete}' guardado.`;
            }

            return {
              id: doc._id,
              nodoOrigen: doc.nodoId,
              payload: textoPayload,
              rssi: doc.metadatos?.rxRssi || 0,
              timestamp: new Date(doc.createdAt),
              tipo: doc.tipoPaquete
            };
          }); // <-- Corregido aquí

          setMensajes(mensajesHistoricos);
        }
      } catch (error) {
        console.error('Error cargando historial de mensajes:', error);
      }
    };

    cargarHistorial();
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:4000');

    socket.on('connect', () => {
      console.log('Conectado al servidor de WebSockets');
      setConexionSocket(true);
    });

    socket.on('disconnect', () => {
      setConexionSocket(false);
    });

    socket.on('nuevoMensajeMesh', (data) => {
      const { topico, payload } = data;
      
      let textoPayload = '';
      
      if (payload.type === 'position' && payload.payload) {
        const lat = payload.payload.latitude_i ? (payload.payload.latitude_i / 10000000).toFixed(5) : 'N/A';
        const lng = payload.payload.longitude_i ? (payload.payload.longitude_i / 10000000).toFixed(5) : 'N/A';
        textoPayload = `GPS: Lat ${lat}, Lng ${lng}`;
      } 
      else if (payload.type === 'text' && payload.payload) {
        textoPayload = `Mensaje: ${payload.payload.text || 'Sin texto'}`;
      } 
      else {
        textoPayload = `Sistema: Paquete tipo '${payload.type}' recibido.`;
      }

      const nuevoMensaje: MensajeMesh = {
        id: payload.id ? payload.id.toString() : Math.random().toString(36).substring(7),
        nodoOrigen: payload.fromStr || payload.from || 'Desconocido', 
        payload: textoPayload,
        rssi: payload.rxRssi || 0, 
        timestamp: new Date(),
        tipo: payload.type || 'unknown'
      };
      
      setMensajes((prev) => [...prev, nuevoMensaje]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const nodosUnicos = Array.from(new Set(mensajes.map(m => m.nodoOrigen)));

  const mensajesFiltrados = filtroNodo === 'Todos' 
    ? mensajes 
    : mensajes.filter(m => String(m.nodoOrigen) === String(filtroNodo));

  return (
    <div className="flex flex-col gap-6 h-full">
      
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tráfico de Red Mesh</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor de paquetes MQTT en tiempo real</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-[500px]">
        
        <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-gray-800 font-semibold border-b border-gray-100 pb-2">
            <Filter size={18} /> Filtros
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-60 scrollbar-thin scrollbar-thumb-gray-300">
            <button 
              onClick={() => setFiltroNodo('Todos')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filtroNodo === 'Todos' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Todos los Nodos
            </button>
            
            {nodosUnicos.map((nodoId) => (
              <button 
                key={nodoId}
                onClick={() => setFiltroNodo(nodoId)} 
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${filtroNodo === nodoId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="truncate pr-2">Nodo: {nodoId}</span>
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              </button>
            ))}
          </div>

          <div className="mt-auto bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="text-xs text-gray-500 flex justify-between mb-1">
              <span>Paquetes totales:</span>
              <span className="font-bold">{mensajes.length}</span>
            </div>
            <div className={`text-xs flex items-center gap-1 ${conexionSocket ? 'text-green-600' : 'text-red-600'}`}>
              <Activity size={14} /> {conexionSocket ? 'Socket Conectado' : 'Socket Desconectado'}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 rounded-xl shadow-sm border border-gray-800 flex flex-col overflow-hidden font-mono text-sm">
          
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center text-slate-300">
            <div className="flex items-center gap-2">
              <Terminal size={16} />
              <span>Log de Tráfico (Real-time + Historial)</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {mensajesFiltrados.length === 0 ? (
              <div className="text-slate-500 text-center mt-10">Esperando datos de la red Mesh...</div>
            ) : (
              mensajesFiltrados.map((msg) => (
                <div key={msg.id} className="bg-slate-800/50 p-3 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">{msg.nodoOrigen}</span>
                      {/* Conflicto de Tailwind arreglado aquí */}
                      <span className="text-xs text-purple-400">[{msg.tipo}]</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
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