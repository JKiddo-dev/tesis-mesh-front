'use client';

import { useState, useEffect } from 'react';
import { Search, RotateCcw, Calendar, MapPin, Navigation, Clock, Activity, ShieldAlert } from 'lucide-react';
import dynamic from 'next/dynamic';

const TrackingMap = dynamic(() => import('../../../components/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-50 flex items-center justify-center rounded-xl border border-gray-200">
      <span className="flex items-center gap-2 text-blue-600 font-medium animate-pulse">
        <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
        Cargando mapa de historial...
      </span>
    </div>
  )
});

export default function TrackeoPage() {
  const [dispositivo, setDispositivo] = useState('');
  const [nodosDisponibles, setNodosDisponibles] = useState<string[]>([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [rutaHistorica, setRutaHistorica] = useState<[number, number][]>([]);
  const [cargando, setCargando] = useState(false);
  const [ultimosPuntos, setUltimosPuntos] = useState<any[]>([]);

  useEffect(() => {
    const cargarNodos = async () => {
      try {
        const token = localStorage.getItem('mesh_token');
        const respuesta = await fetch('http://localhost:4000/telemetry/nodes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (respuesta.ok) {
          const nodos = await respuesta.json();
          setNodosDisponibles(nodos);
          if (nodos.length > 0) {
            setDispositivo(nodos[0]);
          }
        }
      } catch (error) {
        console.error('Error cargando la lista de nodos disponibles', error);
      }
    };
    cargarNodos();
  }, []);

  const aplicarRangoRapido = (horas: number | null) => {
    if (horas === null) {
      setFechaInicio('');
      setFechaFin('');
      return;
    }

    const fin = new Date();
    const inicio = new Date(fin.getTime() - horas * 60 * 60 * 1000);
    
    setFechaInicio(inicio.toISOString().slice(0, 16));
    setFechaFin(fin.toISOString().slice(0, 16));
  };

  const handleVerTrackeo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!dispositivo) {
      alert('Por favor selecciona un dispositivo.');
      return;
    }

    setCargando(true);
    try {
      const token = localStorage.getItem('mesh_token');
      const respuesta = await fetch('http://localhost:4000/telemetry/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!respuesta.ok) throw new Error('Error al obtener datos');
      
      const historial = await respuesta.json();

      let puntosFiltrados = historial.filter((punto: any) => String(punto.nodoId) === String(dispositivo));

      if (fechaInicio) {
        const tInicio = new Date(fechaInicio).getTime();
        puntosFiltrados = puntosFiltrados.filter((p: any) => new Date(p.createdAt || p.timestamp).getTime() >= tInicio);
      }

      if (fechaFin) {
        const tFin = new Date(fechaFin).getTime();
        puntosFiltrados = puntosFiltrados.filter((p: any) => new Date(p.createdAt || p.timestamp).getTime() <= tFin);
      }

      const puntosRuta: [number, number][] = puntosFiltrados
        .filter((punto: any) => typeof punto.latitud === 'number' && typeof punto.longitud === 'number')
        .map((punto: any) => [punto.latitud, punto.longitud]);

      setUltimosPuntos(puntosFiltrados);

      if (puntosRuta.length === 0) {
        setRutaHistorica([]);
        alert('No se encontraron coordenadas para este filtro de nodo y fechas.');
      } else {
        setRutaHistorica(puntosRuta);
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un problema contactando al servidor.');
    } finally {
      setCargando(false);
    }
  };

  const handleResetear = () => {
    if (nodosDisponibles.length > 0) {
      setDispositivo(nodosDisponibles[0]);
    } else {
      setDispositivo('');
    }
    setFechaInicio('');
    setFechaFin('');
    setRutaHistorica([]);
    setUltimosPuntos([]);
  };

  const ultimaPosicion = rutaHistorica.length > 0 ? rutaHistorica[rutaHistorica.length - 1] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historial de Trackeo</h1>
          <p className="text-gray-500 text-sm mt-1">Consulta y analiza la trayectoria de posicionamiento de la red Mesh</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-blue-600" />
            Accesos Rápidos de Rango Temporal
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => aplicarRangoRapido(1)}
              className="px-3 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-xs font-medium rounded-md transition-colors border border-gray-200"
            >
              Última Hora
            </button>
            <button
              type="button"
              onClick={() => aplicarRangoRapido(24)}
              className="px-3 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-xs font-medium rounded-md transition-colors border border-gray-200"
            >
              Hoy (24h)
            </button>
            <button
              type="button"
              onClick={() => aplicarRangoRapido(168)}
              className="px-3 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-xs font-medium rounded-md transition-colors border border-gray-200"
            >
              Últimos 7 Días
            </button>
            <button
              type="button"
              onClick={() => aplicarRangoRapido(null)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-md transition-colors border border-gray-200"
            >
              Todo
            </button>
          </div>
        </div>

        <form onSubmit={handleVerTrackeo} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dispositivo Nodo</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={dispositivo}
                onChange={(e) => setDispositivo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Seleccione un nodo...</option>
                {nodosDisponibles.map((nodo) => (
                  <option key={nodo} value={nodo}>
                    {nodo === '1234567890' ? 'Centro de Comando' : `Nodo: ${nodo}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={cargando || !dispositivo}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-xs"
            >
              <Search size={18} />
              {cargando ? 'Cargando...' : 'Consultar'}
            </button>
            <button
              type="button"
              onClick={handleResetear}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center transition-colors border border-gray-200"
              title="Resetear Filtros"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </form>
      </div>

      {rutaHistorica.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Navigation size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Puntos Coordenados</p>
              <p className="text-xl font-bold text-gray-800">{rutaHistorica.length} Waypoints</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <MapPin size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Última Posición Registrada</p>
              <p className="text-sm font-bold text-gray-800 font-mono">
                {ultimaPosicion ? `${ultimaPosicion[0].toFixed(5)}, ${ultimaPosicion[1].toFixed(5)}` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Estado del Trayecto</p>
              <p className="text-sm font-bold text-purple-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                Ruta Mapeada
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="h-[500px] w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <TrackingMap ruta={rutaHistorica} />
      </div>
    </div>
  );
}