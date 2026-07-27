'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Activity, Clock, Filter, Trash2, Send, 
  AlertTriangle, Flame, AlertCircle, MessageSquare, 
  MapPin, Radio 
} from 'lucide-react';
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
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [conexionSocket, setConexionSocket] = useState(false);
  
  const [mensajeAEnviar, setMensajeAEnviar] = useState('');
  const [enviando, setEnviando] = useState(false);
  
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Botones de acción para enviar alertas (NO son filtros)
  const alertasRapidas = [
    { texto: "EMERGENCIA: Accidente o problema médico detectado.", icono: <AlertTriangle size={16} />, clase: "bg-red-900/40 text-red-400 hover:bg-red-900/60 border-red-800" },
    { texto: "ALERTA: Posible foco de incendio avistado.", icono: <Flame size={16} />, clase: "bg-orange-900/40 text-orange-400 hover:bg-orange-900/60 border-orange-800" },
    { texto: "PRECAUCIÓN: Camino bloqueado o escombros en la ruta.", icono: <AlertCircle size={16} />, clase: "bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/60 border-yellow-800" }
  ];

  const formatearDocumento = (doc: any): MensajeMesh => {
    let textoPayload = '';
    
    if (doc.tipoPaquete === 'POSICION') {
      textoPayload = `GPS: Lat ${doc.latitud?.toFixed(5) || 'N/A'}, Lng ${doc.longitud?.toFixed(5) || 'N/A'}`;
    } else if (doc.tipoPaquete === 'TEXTO') {
      textoPayload = `Mensaje: ${doc.mensajeTexto || 'Sin texto'}`;
    } else if (doc.tipoPaquete === 'TELEMETRIA') {
      const bat = doc.metadatos?.payload?.batteryLevel;
      const vol = doc.metadatos?.payload?.voltage;
      textoPayload = `Telemetría: ${bat ? `Bat ${bat}%` : ''} ${vol ? `(${vol}V)` : ''}`;
    } else if (doc.tipoPaquete === 'sendtext') {
      textoPayload = `Mensaje Saliente (Web): ${doc.metadatos?.payload || '...'}`;
    } else {
      textoPayload = `Sistema: Paquete tipo '${doc.tipoPaquete || 'OTRO'}' registrado.`;
    }

    return {
      id: doc._id || Math.random().toString(36).substring(7),
      nodoOrigen: doc.nodoId,
      payload: textoPayload,
      rssi: doc.metadatos?.rxRssi || 0,
      timestamp: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      tipo: doc.tipoPaquete || 'OTRO'
    };
  };

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const token = localStorage.getItem('mesh_token');
        const respuesta = await fetch('http://localhost:4000/telemetry/messages',{
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (respuesta.ok) {
          const historial = await respuesta.json();
          const mensajesHistoricos: MensajeMesh[] = historial.map(formatearDocumento); 
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
      setConexionSocket(true);
    });

    socket.on('disconnect', () => {
      setConexionSocket(false);
    });

    socket.on('nuevoMensajeMesh', (data) => {
      const { payload } = data; 
      const nuevoMensaje = formatearDocumento(payload);
      setMensajes((prev) => [...prev, nuevoMensaje]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleEliminarNodo = async (nodoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el nodo ${nodoId}?`)) return;

    try {
      const token = localStorage.getItem('mesh_token');
      const respuesta = await fetch(`http://localhost:4000/telemetry/nodes/${nodoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respuesta.ok) {
        setMensajes((prev) => prev.filter(m => String(m.nodoOrigen) !== String(nodoId)));
        if (filtroNodo === nodoId) setFiltroNodo('Todos');
      }
    } catch (error) {
      console.error('Error de red eliminando nodo:', error);
    }
  };

  const ejecutarEnvioMensaje = async (texto: string) => {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      const token = localStorage.getItem('mesh_token');
      const respuesta = await fetch('http://localhost:4000/telemetry/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mensaje: texto }),
      });

      if (respuesta.ok) {
        setMensajeAEnviar(''); 
      } else {
        alert('Hubo un error al enviar el mensaje al servidor.');
      }
    } catch (error) {
      console.error('Error enviando el mensaje:', error);
      alert('Error de conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviarMensajeManual = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutarEnvioMensaje(mensajeAEnviar);
  };

  const nodosUnicos = Array.from(new Set(mensajes.map(m => String(m.nodoOrigen))));
  
  // --- NUEVA LÓGICA DE FILTRADO ---
  const mensajesFiltrados = mensajes.filter(m => {
    const cumpleFiltroNodo = filtroNodo === 'Todos' || String(m.nodoOrigen) === String(filtroNodo);
    
    let cumpleFiltroTipo = false;
    if (filtroTipo === 'TODOS') {
      cumpleFiltroTipo = true;
    } else if (filtroTipo === 'ALERTAS') {
      // Verifica si es texto Y contiene alguna de las palabras clave de alerta (ignorando mayúsculas/minúsculas)
      const esTexto = m.tipo === 'TEXTO';
      const contieneAlerta = /EMERGENCIA:|ALERTA:|PRECAUCIÓN:/i.test(m.payload);
      cumpleFiltroTipo = esTexto && contieneAlerta;
    } else {
      cumpleFiltroTipo = m.tipo === filtroTipo;
    }

    return cumpleFiltroNodo && cumpleFiltroTipo;
  });

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tráfico de Red Mesh</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor de paquetes MQTT bidireccional</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {alertasRapidas.map((alerta, idx) => (
            <button
              key={idx}
              onClick={() => ejecutarEnvioMensaje(alerta.texto)}
              disabled={enviando || !conexionSocket}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${alerta.clase}`}
              title="Transmitir alerta por RF"
            >
              {alerta.icono}
              <span className="hidden md:inline">{alerta.texto.split(':')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-[500px]">
        {/* SIDEBAR NODOS */}
        <div className="w-full md:w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-gray-800 font-semibold border-b border-gray-100 pb-2">
            <Filter size={18} /> Filtros de Nodos
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-80 scrollbar-thin scrollbar-thumb-gray-300 pr-1">
            <button 
              onClick={() => setFiltroNodo('Todos')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filtroNodo === 'Todos' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Todos los Nodos
            </button>
            
            {nodosUnicos.map((nodoId) => (
              <div 
                key={nodoId}
                className={`flex items-center justify-between w-full rounded-lg text-sm transition-colors border border-transparent ${filtroNodo === nodoId ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-200'}`}
              >
                <button 
                  onClick={() => setFiltroNodo(nodoId)} 
                  className="flex-1 flex items-center gap-2 text-left px-3 py-2 truncate"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${nodoId === '1234567890' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                  <span className="truncate">
                    {nodoId === '1234567890' ? 'Centro de Comando' : `Nodo: ${nodoId}`}
                  </span>
                </button>
                
                <button
                  onClick={(e) => handleEliminarNodo(nodoId, e)}
                  title="Eliminar nodo"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-r-lg transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-auto bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="text-xs text-gray-500 flex justify-between mb-1">
              <span>Paquetes en vista:</span>
              <span className="font-bold">{mensajesFiltrados.length}</span>
            </div>
            <div className={`text-xs flex items-center gap-1 ${conexionSocket ? 'text-green-600' : 'text-red-600'}`}>
              <Activity size={14} /> {conexionSocket ? 'Socket Conectado' : 'Socket Desconectado'}
            </div>
          </div>
        </div>

        {/* TERMINAL CENTRAL */}
        <div className="flex-1 bg-slate-900 rounded-xl shadow-sm border border-gray-800 flex flex-col overflow-hidden font-mono text-sm">
          
          {/* HEADER TERMINAL Y PESTAÑAS */}
          <div className="bg-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700">
            <div className="flex items-center gap-2 text-slate-300 px-4 py-3 sm:py-2">
              <Terminal size={16} />
              <span>Log de Tráfico</span>
            </div>
            
            <div className="flex bg-slate-800 w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'TODOS', label: 'Todo', icon: <Filter size={14} /> },
                { id: 'TEXTO', label: 'Mensajes', icon: <MessageSquare size={14} /> },
                // NUEVA PESTAÑA DE ALERTAS
                { id: 'ALERTAS', label: 'Alertas', icon: <AlertTriangle size={14} /> },
                { id: 'POSICION', label: 'GPS', icon: <MapPin size={14} /> },
                { id: 'TELEMETRIA', label: 'Telemetría', icon: <Radio size={14} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFiltroTipo(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 sm:py-2 text-xs transition-colors whitespace-nowrap border-b-2 ${
                    filtroTipo === tab.id 
                      ? 'border-blue-500 text-blue-400 bg-slate-700/50' 
                      : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* CUERPO DEL LOG */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {mensajesFiltrados.length === 0 ? (
              <div className="text-slate-500 text-center mt-10">No hay paquetes que coincidan con los filtros actuales...</div>
            ) : (
              mensajesFiltrados.map((msg) => {
                const esMensajeWeb = String(msg.nodoOrigen) === '1234567890';
                
                // Expresiones regulares para identificar el tipo de alerta
                const esEmergencia = /EMERGENCIA:/i.test(msg.payload);
                const esAlerta = /ALERTA:/i.test(msg.payload);
                const esPrecaucion = /PRECAUCIÓN:/i.test(msg.payload);
                
                // Variables dinámicas para el estilado
                let clasesBase = 'p-3 rounded border transition-colors ';
                let colorTitulo = 'text-blue-400';
                let colorTexto = 'text-green-400';
                let etiquetaTipo = msg.tipo;

                if (esMensajeWeb) {
                  clasesBase += 'bg-slate-800/80 border-purple-900/50 hover:border-purple-700/50';
                  colorTitulo = 'text-purple-400';
                  colorTexto = 'text-purple-200';
                } else if (esEmergencia) {
                  clasesBase += 'bg-red-900/20 border-red-900/50 hover:border-red-700/50';
                  colorTitulo = 'text-red-400';
                  colorTexto = 'text-red-200 font-semibold';
                  etiquetaTipo = 'EMERGENCIA';
                } else if (esAlerta) {
                  clasesBase += 'bg-orange-900/20 border-orange-900/50 hover:border-orange-700/50';
                  colorTitulo = 'text-orange-400';
                  colorTexto = 'text-orange-200 font-semibold';
                  etiquetaTipo = 'ALERTA';
                } else if (esPrecaucion) {
                  clasesBase += 'bg-yellow-900/20 border-yellow-900/50 hover:border-yellow-700/50';
                  colorTitulo = 'text-yellow-400';
                  colorTexto = 'text-yellow-200 font-semibold';
                  etiquetaTipo = 'PRECAUCIÓN';
                } else {
                  // Estilo por defecto (paquetes normales)
                  clasesBase += 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600';
                }

                return (
                  <div key={msg.id} className={clasesBase}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${colorTitulo}`}>
                          {esMensajeWeb ? 'PLATAFORMA WEB' : msg.nodoOrigen}
                        </span>
                        <span className="text-xs text-slate-500">[{etiquetaTipo}]</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className={`${colorTexto} break-all`}>
                      {msg.payload}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={mensajesEndRef} />
          </div>

          {/* INPUT MANUAL */}
          <form onSubmit={handleEnviarMensajeManual} className="bg-slate-800 p-3 border-t border-slate-700 flex gap-3">
            <input
              type="text"
              value={mensajeAEnviar}
              onChange={(e) => setMensajeAEnviar(e.target.value)}
              placeholder="Escribe un mensaje libre para transmitir a las radios..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 transition-colors"
              disabled={enviando || !conexionSocket}
            />
            <button
              type="submit"
              disabled={enviando || !mensajeAEnviar.trim() || !conexionSocket}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans font-medium"
            >
              <Send size={16} />
              <span className="hidden sm:inline">{enviando ? 'Enviando...' : 'Transmitir'}</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}