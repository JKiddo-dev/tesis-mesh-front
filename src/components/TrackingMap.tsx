'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
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

interface TrackingMapProps {
  ruta: [number, number][]; 
}

function AutoFitBounds({ ruta }: { ruta: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (ruta.length > 0) {
      const bounds = L.latLngBounds(ruta);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [ruta, map]);
  return null;
}

export default function TrackingMap({ ruta }: TrackingMapProps) {
  // Centro por defecto (UTEM Macul)
  const defaultCenter: [number, number] = [-33.466, -70.598];

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={13} 
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {ruta.length > 0 && <AutoFitBounds ruta={ruta} />}

      {ruta.length > 1 && (
        <>
          <Polyline 
            positions={ruta} 
            color="#2563eb" 
            weight={4} 
            opacity={0.8} 
            dashArray="10, 10" 
          />
          
          <Marker position={ruta[0]} icon={customIcon}>
            <Popup>
              <div className="font-bold text-blue-600">Punto de Inicio</div>
            </Popup>
          </Marker>

          <Marker position={ruta[ruta.length - 1]} icon={customIcon}>
            <Popup>
              <div className="font-bold text-green-600">Punto Final / Actual</div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}