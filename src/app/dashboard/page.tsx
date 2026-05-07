'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center min-h-[500px]">
      <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse">
        <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
        Cargando mapa y nodos...
      </div>
    </div>
  )
});

export default function DashboardIndex() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
      
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Monitoreo en Tiempo Real</h1>
          <p className="text-gray-500 text-sm mt-1">Visualización de nodos en la red Mesh</p>
        </div>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Broker MQTT Conectado
        </div>
      </div>

      <div className="flex-1 rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <MapComponent />
      </div>

    </div>
  );
}