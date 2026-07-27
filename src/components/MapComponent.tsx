'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface NodoMap {
  id: string;
  lat: number;
  lng: number;
  ultimaActualizacion: Date;
}

interface MapComponentProps {
  nodosActivos: NodoMap[];
  centro?: [number, number];
  zoom?: number;
}

export default function MapComponent({ 
  nodosActivos,
  centro = [-33.4660619, -70.5980495], 
  zoom = 13 
}: MapComponentProps) {
  
  return (
    <MapContainer 
      center={centro} 
      zoom={zoom} 
      className="w-full h-full rounded-xl z-0"
    >
      <ChangeView center={centro} zoom={zoom} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
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