'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Activity, Clock, Filter, Trash2, Send, 
  AlertTriangle, Flame, AlertCircle, MessageSquare, 
  MapPin, Radio, SlidersHorizontal, User, MessageCircle, 
  RefreshCw, Calendar, ShieldCheck, ChevronLeft, ChevronRight,
  Users, Layers
} from 'lucide-react';
import { io } from 'socket.io-client';

interface MensajeMesh {
  id: string;
  nodoOrigen: string;
  nodoDestino?: string;
  payload: string;
  mensajeTexto?: string;
  rssi: number;
  timestamp: Date;
  tipo: string;
}

interface UsuarioNodoDirectorio {
  _id?: string;
  nombre: string;
  nodoId: string;
  rol?: string;
}

export default function MensajesPage() {
  const [vistaActiva, setVistaActiva] = useState<'log' | 'chat'>('log');
  
  const [mensajes, setMensajes] = useState<MensajeMesh[]>([]);
  const [mensajesDirectos, setMensajesDirectos] = useState<MensajeMesh[]>([]);
  const [directorioNodos, setDirectorioNodos] = useState<UsuarioNodoDirectorio[]>([]);
  const [nodosActivos, setNodosActivos] = useState<string[]>([]);
  
  const [nodoRemitente, setNodoRemitente] = useState<string>('1234567890');
  const [nodoDestinatario, setNodoDestinatario] = useState<string>('');
  const [sidebarChatAbierto, setSidebarChatAbierto] = useState(true);
  
  const [filtroNodo, setFiltroNodo] = useState<string>('Todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [conexionSocket, setConexionSocket] = useState(false);
  const [mostrarFiltrosMobile, setMostrarFiltrosMobile] = useState(false);
  const [rolActual, setRolActual] = useState<string>('');
  
  const [mensajeAEnviar, setMensajeAEnviar] = useState('');
  const [mensajeDirectoAEnviar, setMensajeDirectoAEnviar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargandoDirectos, setCargandoDirectos] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const alertasRapidas = [
    { texto: "EMERGENCIA: Accidente o problema médico detectado.", icono: <AlertTriangle size={15} />, clase: "bg-red-600 text-white hover:bg-red-700 border-red-700" },
    { texto: "ALERTA: Posible foco de incendio avistado.", icono: <Flame size={15} />, clase: "bg-orange-600 text-white hover:bg-orange-700 border-orange-700" },
    { texto: "PRECAUCIÓN: Camino bloqueado o escombros en la ruta.", icono: <AlertCircle size={15} />, clase: "bg-amber-500 text-slate-950 hover:bg-amber-600 border-amber-600" }
  ];

  const formatearDocumento = (doc: any): MensajeMesh => {
    let textoPayload = '';
    
    if (doc.tipoPaquete === 'POSICION') {
      textoPayload = `GPS: Lat ${doc.latitud?.toFixed(5) || 'N/A'}, Lng ${doc.longitud?.toFixed(5) || 'N/A'}`;
    } else if (doc.tipoPaquete === 'TEXTO') {
      textoPayload = doc.mensajeTexto || doc.metadatos?.payload?.text || doc.metadatos?.payload || 'Sin texto';
    } else if (doc.tipoPaquete === 'TELEMETRIA') {
      const bat = doc.metadatos?.payload?.batteryLevel;
      const vol = doc.metadatos?.payload?.voltage;
      textoPayload = `Telemetría: ${bat ? `Bat ${bat}%` : ''} ${vol ? `(${vol}V)` : ''}`;
    } else if (doc.tipoPaquete === 'sendtext') {
      textoPayload = typeof doc.metadatos?.payload === 'string' ? doc.metadatos.payload : (doc.mensajeTexto || '...');
    } else {
      textoPayload = doc.mensajeTexto || `Sistema: Paquete tipo '${doc.tipoPaquete || 'OTRO'}' registrado.`;
    }

    return {
      id: doc._id || Math.random().toString(36).substring(7),
      nodoOrigen: doc.nodoId,
      nodoDestino: doc.nodoDestino || doc.metadatos?.toStr || (doc.metadatos?.to ? String(doc.metadatos?.to) : 'BROADCAST'),
      payload: textoPayload,
      mensajeTexto: doc.mensajeTexto || textoPayload,
      rssi: doc.metadatos?.rxRssi || 0,
      timestamp: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      tipo: doc.tipoPaquete || 'OTRO'
    };
  };

  useEffect(() => {
    const userStr = localStorage.getItem('mesh_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setRolActual(u.rol);
        if (u.nodoId) {
          setNodoRemitente(u.nodoId);
        }
      } catch (e) {}
    }

    const cargarDirectorio = async () => {
      try {
        const token = localStorage.getItem('mesh_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/node-directory`, { cache: 'no-store',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDirectorioNodos(data || []);
        }
      } catch (error) {
        console.error('Error cargando directorio', error);
      }
    };

    const cargarNodos = async () => {
      try {
        const token = localStorage.getItem('mesh_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telemetry/nodes`, { cache: 'no-store',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNodosActivos(data || []);
          if (data.length > 0 && !nodoDestinatario) {
            setNodoDestinatario(data[0]);
          }
        }
      } catch (error) {
        console.error('Error cargando nodos', error);
      }
    };

    const cargarHistorial = async () => {
      try {
        const token = localStorage.getItem('mesh_token');
        const respuesta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telemetry/messages`, { cache: 'no-store',
          headers: { 'Authorization': `Bearer ${token}` }
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

    cargarDirectorio();
    cargarNodos();
    cargarHistorial();
  }, []);

  const cargarConversacionDirecta = async (origen: string, destino: string) => {
    if (!origen || !destino) return;
    setCargandoDirectos(true);
    try {
      const token = localStorage.getItem('mesh_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telemetry/direct/${encodeURIComponent(origen)}/${encodeURIComponent(destino)}`, { cache: 'no-store',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMensajesDirectos(data.map(formatearDocumento));
      }
    } catch (e) {
      console.error('Error cargando conversación directa', e);
    } finally {
      setCargandoDirectos(false);
    }
  };

  useEffect(() => {
    if (nodoDestinatario) {
      cargarConversacionDirecta(nodoRemitente, nodoDestinatario);
    }
  }, [nodoRemitente, nodoDestinatario]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || '', { extraHeaders: { 'ngrok-skip-browser-warning': 'true' } });

    socket.on('connect', () => setConexionSocket(true));
    socket.on('disconnect', () => setConexionSocket(false));

    socket.on('nuevoMensajeMesh', (data) => {
      const { payload } = data; 
      if (!payload) return;
      const nuevoMensaje = formatearDocumento(payload);
      
      setMensajes((prev) => [...prev, nuevoMensaje]);
      
      const esDeEstaConversacion = 
        (String(nuevoMensaje.nodoOrigen) === String(nodoRemitente) && String(nuevoMensaje.nodoDestino) === String(nodoDestinatario)) ||
        (String(nuevoMensaje.nodoOrigen) === String(nodoDestinatario) && String(nuevoMensaje.nodoDestino) === String(nodoRemitente)) ||
        (String(nuevoMensaje.nodoOrigen) === String(nodoDestinatario) && (nuevoMensaje.nodoDestino === 'BROADCAST' || !nuevoMensaje.nodoDestino));

      if (esDeEstaConversacion) {
        setMensajesDirectos((prev) => [...prev, nuevoMensaje]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [nodoRemitente, nodoDestinatario]);

  useEffect(() => {
    if (vistaActiva === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajesDirectos, mensajes, vistaActiva]);

  const handleEliminarNodo = async (nodoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el nodo ${nodoId}?`)) return;

    try {
      const token = localStorage.getItem('mesh_token');
      const respuesta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telemetry/nodes/${nodoId}`, { cache: 'no-store',
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respuesta.ok) {
        setMensajes((prev) => prev.filter(m => String(m.nodoOrigen) !== String(nodoId)));
        setMensajesDirectos((prev) => prev.filter(m => String(m.nodoOrigen) !== String(nodoId)));
        if (filtroNodo === nodoId) setFiltroNodo('Todos');
      }
    } catch (error) {
      console.error('Error de red eliminando nodo:', error);
    }
  };

  const ejecutarEnvioMensaje = async (texto: string, destino?: string) => {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      const token = localStorage.getItem('mesh_token');
      const respuesta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telemetry/send`, { cache: 'no-store',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          mensaje: texto, 
          nodoDestino: destino || undefined,
          nodoOrigen: nodoRemitente || '1234567890'
        }),
      });

      if (respuesta.ok) {
        setMensajeAEnviar('');
        setMensajeDirectoAEnviar('');
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

  const handleEnviarMensajeDirecto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodoDestinatario) {
      alert('Por favor selecciona una radio destino.');
      return;
    }
    ejecutarEnvioMensaje(mensajeDirectoAEnviar, nodoDestinatario);
  };

  const handleEnviarMensajeGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutarEnvioMensaje(mensajeAEnviar);
  };

  const obtenerUsuarioPorNodo = (nodoId: string): UsuarioNodoDirectorio | undefined => {
    if (!nodoId) return undefined;
    return directorioNodos.find(u => u.nodoId && String(u.nodoId).trim().toLowerCase() === String(nodoId).trim().toLowerCase());
  };

  const getNombreVisible = (nodoId: string) => {
    if (nodoId === '1234567890') return 'Centro de Comando (Web)';
    const u = obtenerUsuarioPorNodo(nodoId);
    return u ? u.nombre : `Nodo ${nodoId}`;
  };

  const formatearFechaHora = (fecha: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(fecha);
  };

  const nodosUnicos = Array.from(new Set([
    ...directorioNodos.map(d => d.nodoId),
    ...nodosActivos,
    ...mensajes.map(m => String(m.nodoOrigen))
  ])).filter(Boolean);

  const mensajesFiltrados = mensajes.filter(m => {
    const cumpleFiltroNodo = filtroNodo === 'Todos' || String(m.nodoOrigen) === String(filtroNodo);
    
    let cumpleFiltroTipo = false;
    if (filtroTipo === 'TODOS') {
      cumpleFiltroTipo = true;
    } else if (filtroTipo === 'ALERTAS') {
      const esTexto = m.tipo === 'TEXTO';
      const contieneAlerta = /EMERGENCIA:|ALERTA:|PRECAUCIÓN:/i.test(m.payload);
      cumpleFiltroTipo = esTexto && contieneAlerta;
    } else {
      cumpleFiltroTipo = m.tipo === filtroTipo;
    }

    return cumpleFiltroNodo && cumpleFiltroTipo;
  });

  const usuarioDestinoActual = obtenerUsuarioPorNodo(nodoDestinatario);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-6.5rem)] min-h-[500px] overflow-hidden">
      
      {/* HEADER PRINCIPAL Y SWITCHER DE VISTAS */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center shrink-0 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">Tráfico de Red y Mensajería</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Monitor MQTT bidireccional y comunicaciones 1 a 1 entre radios</p>
        </div>

        {/* 1. SWITCHER DE PESTAÑAS (LOG GLOBAL PRIMERO POR DEFECTO) */}
        <div className="flex bg-gray-200/90 p-1 rounded-xl border border-gray-300/80 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setVistaActiva('log')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              vistaActiva === 'log'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Terminal size={15} />
            <span>Log Global</span>
          </button>

          <button
            onClick={() => setVistaActiva('chat')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              vistaActiva === 'chat'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle size={15} />
            <span>Chat 1 a 1</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: LOG GLOBAL DE TRÁFICO MESH (DEFAULT) */}
      {/* ========================================================================= */}
      {vistaActiva === 'log' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
          
          {/* BARRA SUPERIOR DE ALERTAS Y BOTÓN MÓVIL */}
          <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
            {rolActual !== 'Usuario' && (
              <div className="flex gap-2 flex-wrap items-center">
                {alertasRapidas.map((alerta, idx) => (
                  <button
                    key={idx}
                    onClick={() => ejecutarEnvioMensaje(alerta.texto)}
                    disabled={enviando || !conexionSocket}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${alerta.clase}`}
                    title="Transmitir alerta por RF"
                  >
                    {alerta.icono}
                    <span className="hidden md:inline">{alerta.texto.split(':')[0]}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto md:hidden">
              <button
                type="button"
                onClick={() => setMostrarFiltrosMobile(!mostrarFiltrosMobile)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs"
              >
                <SlidersHorizontal size={13} className="text-blue-600" />
                {mostrarFiltrosMobile ? 'Ocultar Filtros' : 'Filtrar Nodos'}
              </button>
            </div>
          </div>

          {/* CUERPO DEL LOG (2 COLUMNAS EN DESKTOP, CONTENEDOR CON SCROLL INTERNO) */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
            
            {/* SIDEBAR DE FILTROS (ESTILO TARJETA BLANCA / GRAY-200) */}
            <div className={`w-full md:w-72 bg-white rounded-xl shadow-xs border border-gray-200 p-3 shrink-0 flex-col gap-3 overflow-hidden ${
              mostrarFiltrosMobile ? 'flex max-h-56 md:max-h-full' : 'hidden md:flex'
            }`}>
              <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-100 pb-2 text-xs uppercase tracking-wider">
                <Filter size={15} /> Filtros de Nodos
              </div>
              
              <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pr-1 text-xs">
                <button 
                  onClick={() => setFiltroNodo('Todos')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    filtroNodo === 'Todos' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Todos los Nodos ({nodosUnicos.length})
                </button>
                
                {nodosUnicos.map((nodoId) => {
                  const usuarioAsignado = obtenerUsuarioPorNodo(nodoId);
                  const esCentroComando = nodoId === '1234567890';
                  
                  return (
                    <div 
                      key={nodoId}
                      className={`flex items-center justify-between w-full rounded-lg transition-colors border ${
                        filtroNodo === nodoId ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <button 
                        onClick={() => setFiltroNodo(nodoId)} 
                        className="flex-1 flex items-center gap-2 text-left px-2.5 py-1.5 truncate"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${esCentroComando ? 'bg-purple-500' : (usuarioAsignado ? 'bg-emerald-500' : 'bg-blue-500')}`}></span>
                        <div className="truncate flex flex-col items-start leading-tight">
                          <span className="truncate">
                            {esCentroComando ? 'Centro de Comando' : (usuarioAsignado ? usuarioAsignado.nombre : `Nodo ${nodoId}`)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {nodoId}
                          </span>
                        </div>
                      </button>
                      
                      {rolActual !== 'Usuario' && (
                        <button
                          onClick={(e) => handleEliminarNodo(nodoId, e)}
                          title="Eliminar nodo"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-r-lg transition-colors shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto bg-gray-50 p-2 rounded-lg border border-gray-100 shrink-0 text-[11px]">
                <div className="text-gray-500 flex justify-between mb-0.5">
                  <span>Paquetes en vista:</span>
                  <span className="font-bold text-gray-800">{mensajesFiltrados.length}</span>
                </div>
                <div className={`flex items-center gap-1 font-medium ${conexionSocket ? 'text-green-600' : 'text-red-600'}`}>
                  <Activity size={12} /> {conexionSocket ? 'Socket Conectado' : 'Socket Desconectado'}
                </div>
              </div>
            </div>

            {/* TERMINAL CENTRAL CON SCROLL INTERNO */}
            <div className="flex-1 bg-slate-900 rounded-xl shadow-xs border border-slate-800 flex flex-col overflow-hidden font-mono text-xs min-h-0">
              
              {/* CABECERA TERMINAL */}
              <div className="bg-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700 shrink-0">
                <div className="flex items-center gap-2 text-slate-300 px-3 py-2">
                  <Terminal size={15} />
                  <span className="font-semibold">Log de Tráfico Mesh</span>
                </div>
                
                <div className="flex bg-slate-800 w-full sm:w-auto overflow-x-auto">
                  {[
                    { id: 'TODOS', label: 'Todo', icon: <Filter size={13} /> },
                    { id: 'TEXTO', label: 'Mensajes', icon: <MessageSquare size={13} /> },
                    { id: 'ALERTAS', label: 'Alertas', icon: <AlertTriangle size={13} /> },
                    { id: 'POSICION', label: 'GPS', icon: <MapPin size={13} /> },
                    { id: 'TELEMETRIA', label: 'Telemetría', icon: <Radio size={13} /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFiltroTipo(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] transition-colors whitespace-nowrap border-b-2 ${
                        filtroTipo === tab.id 
                          ? 'border-blue-500 text-blue-400 bg-slate-700/50 font-bold' 
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTENIDO SCROLLEABLE INTERNO */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 min-h-0">
                {mensajesFiltrados.length === 0 ? (
                  <div className="text-slate-500 text-center py-12">No hay paquetes que coincidan con los filtros actuales...</div>
                ) : (
                  mensajesFiltrados.map((msg) => {
                    const esMensajeWeb = String(msg.nodoOrigen) === '1234567890';
                    const usuarioAsignado = obtenerUsuarioPorNodo(msg.nodoOrigen);
                    
                    const esEmergencia = /EMERGENCIA:/i.test(msg.payload);
                    const esAlerta = /ALERTA:/i.test(msg.payload);
                    const esPrecaucion = /PRECAUCIÓN:/i.test(msg.payload);
                    
                    let clasesBase = 'p-2.5 rounded border transition-colors ';
                    let colorTitulo = 'text-blue-400';
                    let colorTexto = 'text-green-400';
                    let etiquetaTipo = msg.tipo;

                    if (esMensajeWeb) {
                      clasesBase += 'bg-slate-800/80 border-purple-900/50';
                      colorTitulo = 'text-purple-400';
                      colorTexto = 'text-purple-200';
                    } else if (esEmergencia) {
                      clasesBase += 'bg-red-900/20 border-red-900/50';
                      colorTitulo = 'text-red-400';
                      colorTexto = 'text-red-200 font-semibold';
                      etiquetaTipo = 'EMERGENCIA';
                    } else if (esAlerta) {
                      clasesBase += 'bg-orange-900/20 border-orange-900/50';
                      colorTitulo = 'text-orange-400';
                      colorTexto = 'text-orange-200 font-semibold';
                      etiquetaTipo = 'ALERTA';
                    } else if (esPrecaucion) {
                      clasesBase += 'bg-yellow-900/20 border-yellow-900/50';
                      colorTitulo = 'text-yellow-400';
                      colorTexto = 'text-yellow-200 font-semibold';
                      etiquetaTipo = 'PRECAUCIÓN';
                    } else {
                      clasesBase += 'bg-slate-800/50 border-slate-700/50';
                    }

                    return (
                      <div key={msg.id} className={clasesBase}>
                        <div className="flex justify-between items-start mb-1 flex-wrap gap-1">
                          <div className="flex items-center gap-1.5">
                            {usuarioAsignado ? (
                              <span className="font-bold text-emerald-300 flex items-center gap-1 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                                <User size={11} />
                                {usuarioAsignado.nombre} ({msg.nodoOrigen})
                              </span>
                            ) : (
                              <span className={`font-bold ${colorTitulo}`}>
                                {esMensajeWeb ? 'PLATAFORMA WEB' : `Nodo: ${msg.nodoOrigen}`}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">[{etiquetaTipo}]</span>
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock size={11} />
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className={`${colorTexto} break-all font-mono leading-relaxed`}>
                          {msg.payload}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={logEndRef} />
              </div>

              {/* INPUT DE ENVÍO BROADCAST */}
              {rolActual !== 'Usuario' && (
                <form onSubmit={handleEnviarMensajeGlobal} className="bg-slate-800 p-2.5 border-t border-slate-700 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={mensajeAEnviar}
                    onChange={(e) => setMensajeAEnviar(e.target.value)}
                    placeholder="Escribe un mensaje libre para transmitir a las radios..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 text-xs font-sans"
                    disabled={enviando || !conexionSocket}
                  />
                  <button
                    type="submit"
                    disabled={enviando || !mensajeAEnviar.trim() || !conexionSocket}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 text-xs font-sans font-semibold shrink-0"
                  >
                    <Send size={13} />
                    <span>{enviando ? '...' : 'Transmitir'}</span>
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: CHAT 1 A 1 DIRECTO (SIDEBAR ARMONIZADO EN ESTILO BLANCO/GRIS) */}
      {/* ========================================================================= */}
      {vistaActiva === 'chat' && (
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
          
          {/* BARRA LATERAL DE RADIOS / USUARIOS (ESTILO TARJETA BLANCA / GRAY-200 ARMONIZADA) */}
          <div className={`transition-all duration-200 flex flex-col bg-white rounded-xl shadow-xs border border-gray-200 p-3 shrink-0 overflow-hidden ${
            sidebarChatAbierto ? 'w-full md:w-72' : 'w-full md:w-14 p-2'
          }`}>
            
            {/* CABECERA SIDEBAR CON BOTÓN TOGGLE */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-xs font-bold text-gray-800">
              {sidebarChatAbierto ? (
                <div className="flex items-center gap-2 uppercase tracking-wider truncate">
                  <Radio size={15} className="text-blue-600 shrink-0" />
                  <span className="truncate">Radios / Usuarios</span>
                </div>
              ) : (
                <Radio size={16} className="text-blue-600 mx-auto" />
              )}

              <button
                type="button"
                onClick={() => setSidebarChatAbierto(!sidebarChatAbierto)}
                className="hidden md:flex p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={sidebarChatAbierto ? 'Colapsar panel para agrandar chat' : 'Expandir radios'}
              >
                {sidebarChatAbierto ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>

            {/* LISTA EXPANDIBLE */}
            {sidebarChatAbierto ? (
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 min-h-0 text-xs mt-2">
                
                {/* SELECTOR EMISOR */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                    Emisor (Tú):
                  </label>
                  <select
                    value={nodoRemitente}
                    onChange={(e) => setNodoRemitente(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-1.5 text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="1234567890">Centro de Comando (Web)</option>
                    {directorioNodos.map(d => (
                      <option key={d.nodoId} value={d.nodoId}>
                        {d.nombre} ({d.nodoId})
                      </option>
                    ))}
                  </select>
                </div>

                <hr className="border-gray-100" />

                {/* DESTINATARIOS */}
                <div className="space-y-1 flex-1 overflow-y-auto pr-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    Seleccionar Destinatario:
                  </label>
                  
                  {nodosUnicos.map((nodoId) => {
                    if (nodoId === nodoRemitente) return null;
                    const u = obtenerUsuarioPorNodo(nodoId);
                    const esCentroComando = nodoId === '1234567890';
                    const esSeleccionado = nodoDestinatario === nodoId;

                    return (
                      <button
                        key={nodoId}
                        onClick={() => setNodoDestinatario(nodoId)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                          esSeleccionado 
                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-2xs' 
                            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            esCentroComando ? 'bg-purple-500' : (u ? 'bg-emerald-500' : 'bg-blue-500')
                          }`}></span>
                          
                          <div className="truncate flex flex-col leading-tight">
                            <span className="truncate text-xs">
                              {esCentroComando ? 'Centro de Comando' : (u ? u.nombre : `Radio ${nodoId}`)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono truncate">
                              ID: {nodoId}
                            </span>
                          </div>
                        </div>

                        {esSeleccionado && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* FOOTER DEL SIDEBAR */}
                <div className="mt-auto bg-gray-50 p-2 rounded-lg border border-gray-100 shrink-0 text-[11px]">
                  <div className="text-gray-500 flex justify-between mb-0.5">
                    <span>Destinatarios:</span>
                    <span className="font-bold text-gray-800">{nodosUnicos.length - 1}</span>
                  </div>
                  <div className={`flex items-center gap-1 font-medium ${conexionSocket ? 'text-green-600' : 'text-red-600'}`}>
                    <Activity size={12} /> {conexionSocket ? 'Broker Conectado' : 'Sin Conexión'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 flex-col items-center py-4 gap-3 text-gray-400">
                <Users size={16} />
                <span className="text-[9px] [writing-mode:vertical-lr] tracking-widest font-mono text-gray-400 font-bold">RADIOS</span>
              </div>
            )}
          </div>

          {/* VENTANA DE CONVERSACIÓN PRINCIPAL (ESTILO CONSOLA OSCURA) */}
          <div className="flex-1 bg-slate-900 rounded-xl shadow-xs border border-slate-800 flex flex-col overflow-hidden font-mono text-xs min-h-0">
            
            {/* CABECERA DEL CHAT */}
            <div className="bg-slate-800 p-2.5 sm:px-4 sm:py-2.5 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-700 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <User size={14} />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-bold text-xs sm:text-sm truncate">
                      {usuarioDestinoActual ? usuarioDestinoActual.nombre : (nodoDestinatario ? `Radio ${nodoDestinatario}` : 'Seleccione Destinatario')}
                    </span>
                    {nodoDestinatario && (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                        {nodoDestinatario}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CONTROLES DERECHA */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => cargarConversacionDirecta(nodoRemitente, nodoDestinatario)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                  title="Recargar conversación"
                >
                  <RefreshCw size={13} className={cargandoDirectos ? 'animate-spin text-blue-400' : ''} />
                </button>
                <span className="text-[10px] bg-slate-950 border border-slate-700 text-slate-400 px-2 py-0.5 rounded font-mono">
                  {mensajesDirectos.length} msjs
                </span>
              </div>
            </div>

            {/* CUERPO DEL CHAT: TARJETAS EN ESTILO CONSOLA (Usuario, ID, Fecha, Mensaje) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 min-h-0">
              {!nodoDestinatario ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
                  <Radio size={36} className="text-slate-600 mb-2" />
                  <p className="text-xs">Selecciona una radio destinataria de la barra lateral para ver su canal directo</p>
                </div>
              ) : mensajesDirectos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
                  <MessageSquare size={32} className="text-slate-600 mb-2" />
                  <p className="text-xs">No hay mensajes directos registrados entre estas dos radios aún.</p>
                  {rolActual !== 'Usuario' && (
                    <p className="text-[11px] text-slate-600 mt-1">Escribe abajo para transmitir un mensaje directo por RF.</p>
                  )}
                </div>
              ) : (
                mensajesDirectos.map((msg) => {
                  const esSaliente = String(msg.nodoOrigen) === String(nodoRemitente);
                  const nombreUsuario = getNombreVisible(msg.nodoOrigen);
                  
                  const esEmergencia = /EMERGENCIA:/i.test(msg.payload);
                  const esAlerta = /ALERTA:/i.test(msg.payload);

                  let estiloCard = esSaliente 
                    ? 'bg-slate-800/90 border-blue-900/60' 
                    : 'bg-slate-800/60 border-slate-700/80';

                  let colorTextoMensaje = esSaliente ? 'text-blue-200' : 'text-green-400';

                  if (esEmergencia) {
                    estiloCard = 'bg-red-950/40 border-red-800/80';
                    colorTextoMensaje = 'text-red-200 font-bold';
                  } else if (esAlerta) {
                    estiloCard = 'bg-orange-950/40 border-orange-800/80';
                    colorTextoMensaje = 'text-orange-200 font-bold';
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`rounded-lg p-3 border shadow-2xs font-mono ${estiloCard}`}
                    >
                      {/* FILA SUPERIOR CON DATOS ESTRUCTURADOS */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-700/50 pb-1.5 mb-1.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Usuario:</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded ${
                            esSaliente 
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/60' 
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          }`}>
                            {nombreUsuario}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span className="font-mono">
                            <span className="text-slate-500">ID:</span> {msg.nodoOrigen}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatearFechaHora(msg.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* CUERPO DEL MENSAJE */}
                      <div className="text-xs pt-0.5">
                        <span className="text-slate-400 mr-2">Mensaje:</span>
                        <span className={`break-all leading-relaxed ${colorTextoMensaje}`}>
                          {msg.payload}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* INPUT DE ENVÍO DIRECTO EN CONSOLA */}
            {rolActual !== 'Usuario' ? (
              <form onSubmit={handleEnviarMensajeDirecto} className="bg-slate-800 p-2.5 border-t border-slate-700 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={mensajeDirectoAEnviar}
                  onChange={(e) => setMensajeDirectoAEnviar(e.target.value)}
                  placeholder={nodoDestinatario ? `Mensaje directo hacia ${getNombreVisible(nodoDestinatario)}...` : 'Selecciona una radio...'}
                  disabled={enviando || !conexionSocket || !nodoDestinatario}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-sans disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={enviando || !mensajeDirectoAEnviar.trim() || !conexionSocket || !nodoDestinatario}
                  className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-sans font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={13} />
                  <span>{enviando ? '...' : 'Transmitir'}</span>
                </button>
              </form>
            ) : (
              <div className="bg-slate-800 p-2 border-t border-slate-700 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 shrink-0">
                <ShieldCheck size={13} className="text-blue-400" />
                <span>Modo Espectador: Rol Usuario con visualización de mensajes en vivo.</span>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
