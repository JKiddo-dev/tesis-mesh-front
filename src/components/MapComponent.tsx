'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapComponent() {
  const defaultCenter: [number, number] = [-33.448, -70.669];

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={13} 
      className="w-full h-full rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Nodo de Prueba 1: Santiago Centro */}
      <Marker position={[-33.448, -70.669]} icon={customIcon}>
        <Popup>
          <div className="text-sm">
            <p className="font-bold text-blue-600">Nodo Gateway</p>
            <p>Ubicación: Santiago Centro</p>
            <p>Estado: <span className="text-green-500 font-semibold">Online</span></p>
          </div>
        </Popup>
      </Marker>

      {/* Nodo de Prueba 2: Macul (Cerca de UTEM) */}
      <Marker position={[-33.466, -70.598]} icon={customIcon}>
        <Popup>
          <div className="text-sm">
            <p className="font-bold text-blue-600">Nodo LoRa 01</p>
            <p>Ubicación: Macul</p>
            <p>Batería: 85%</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}