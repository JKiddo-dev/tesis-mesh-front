'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center min-h-125">
      <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse">
        <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
        Cargando mapa interactivo...
      </div>
    </div>
  )
});

interface NodoState {
  [id: string]: {
    id: string;
    lat: number;
    lng: number;
    ultimaActualizacion: Date;
  };
}

export default function DashboardIndex() {
  const [nodosTracker, setNodosTracker] = useState<NodoState>({});
  const [conexionStatus, setConexionStatus] = useState(false);
  
  const [mapConfig, setMapConfig] = useState({
    lat: -33.4660619,
    lng: -70.5980495,
    zoom: 13
  });

  useEffect(() => {
    const token = localStorage.getItem('mesh_token');

    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:4000/settings', {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.mapCenterLat) {
            setMapConfig({
              lat: data.mapCenterLat,
              lng: data.mapCenterLng,
              zoom: data.mapZoom || 13
            });
          }
        }
      } catch (error) {
        console.error("Error cargando configuración del mapa:", error);
      }
    };

    const fetchUltimasPosiciones = async () => {
      try {
        const res = await fetch('http://localhost:4000/telemetry/history', {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const historial = await res.json();
          const ultimasPosiciones: NodoState = {};

          historial.forEach((punto: any) => {
            const id = punto.nodoId;
            if (!id) return;

            const lat = punto.latitud;
            const lng = punto.longitud;
            const fecha = punto.createdAt ? new Date(punto.createdAt) : new Date();

            if (!ultimasPosiciones[id] || fecha > ultimasPosiciones[id].ultimaActualizacion) {
              ultimasPosiciones[id] = { id, lat, lng, ultimaActualizacion: fecha };
            }
          });

          setNodosTracker((prev) => ({ ...ultimasPosiciones, ...prev }));
        }
      } catch (error) {
        console.error("Error cargando posiciones iniciales:", error);
      }
    };

    fetchSettings();
    fetchUltimasPosiciones();

    const socket = io('http://localhost:4000');

    socket.on('connect', () => setConexionStatus(true));
    socket.on('disconnect', () => setConexionStatus(false));

    socket.on('nuevoMensajeMesh', (data) => {
      console.log('Dato recibido por Socket (Live):', data);
      const { payload } = data;
      
      if (payload.type === 'position' && payload.payload?.latitude_i && payload.payload?.longitude_i) {
        const lat = payload.payload.latitude_i / 10000000;
        const lng = payload.payload.longitude_i / 10000000;
        const id = payload.sender || 'Desconocido';

        setNodosTracker((prev) => ({
          ...prev,
          [id]: { id, lat, lng, ultimaActualizacion: new Date() }
        }));
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  const nodosArray = Object.values(nodosTracker);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Monitoreo en Tiempo Real</h1>
          <p className="text-gray-500 text-sm mt-1">Geolocalización de nodos Mesh en vivo</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 self-start sm:self-auto ${conexionStatus ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          <span className={`w-2 h-2 rounded-full ${conexionStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          {conexionStatus ? 'Socket Conectado' : 'Socket Desconectado'}
        </div>
      </div>

      <div className="flex-1 rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <MapComponent 
          nodosActivos={nodosArray} 
          centro={[mapConfig.lat, mapConfig.lng]} 
          zoom={mapConfig.zoom} 
        />
      </div>

    </div>
  );
}