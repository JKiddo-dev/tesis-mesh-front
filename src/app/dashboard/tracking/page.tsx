'use client';

import { useState, useEffect } from 'react';
import { Search, RotateCcw, Calendar, MapPin } from 'lucide-react';
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
        }
      } catch (error) {
        console.error('Error cargando la lista de nodos disponibles', error);
      }
    }
    cargarNodos();
  }, [])
  

  const handleVerTrackeo = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      const puntosRuta: [number, number][] = historial
        .filter((punto: any) => punto.nodoId === dispositivo)
        .map((punto: any) => [punto.latitud, punto.longitud]);

      if (puntosRuta.length === 0) {
        alert('No se encontraron coordenadas para este nodo.');
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
    setDispositivo('4145953316');
    setFechaInicio('');
    setFechaFin('');
    setRutaHistorica([]); 
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Historial de Trackeo</h1>
        <p className="text-gray-500 text-sm mt-1">Consulta las rutas históricas de los nodos Mesh</p>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleVerTrackeo} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dispositivo</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={dispositivo}
                onChange={(e) => setDispositivo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Seleccione un nodo...</option>
                {nodosDisponibles.map((nodo) => (
                  <option key={nodo} value={nodo}>
                    Nodo: {nodo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde (Opcional)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="datetime-local" 
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta (Opcional)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="datetime-local" 
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              type="submit"
              disabled={cargando}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Search size={18} />
              {cargando ? 'Buscando...' : 'Ver Trackeo'}
            </button>
            <button 
              type="button"
              onClick={handleResetear}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
              title="Resetear Mapa"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </form>
      </div>

      <div className="h-[500px] w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <TrackingMap ruta={rutaHistorica} />
      </div>
    </div>
  );
}