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

// Definimos la interfaz de lo que el mapa espera recibir
interface NodoMap {
  id: string;
  lat: number;
  lng: number;
  ultimaActualizacion: Date;
}

interface MapComponentProps {
  nodosActivos: NodoMap[];
}

export default function MapComponent({ nodosActivos }: MapComponentProps) {
  // Centro por defecto (ubicación del T-Beam: 35.36046, -120.84578)
  const defaultCenter: [number, number] = [35.36046, -120.84578];

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
      
      {/* Mapeamos (iteramos) sobre los nodos que lleguen por Socket */}
      {nodosActivos.map((nodo) => (
        <Marker key={nodo.id} position={[nodo.lat, nodo.lng]} icon={customIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-blue-600">Nodo: {nodo.id}</p>
              <p>Lat: {nodo.lat.toFixed(5)}</p>
              <p>Lng: {nodo.lng.toFixed(5)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Actualizado: {nodo.ultimaActualizacion.toLocaleTimeString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}