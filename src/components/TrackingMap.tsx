'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
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

interface TrackingMapProps {
  mostrarRuta: boolean;
}

export default function TrackingMap({ mostrarRuta }: TrackingMapProps) {
  // Simulación de un trackeo desde Santiago Centro hacia Macul
  const rutaSimulada: [number, number][] = [
    [-33.448, -70.669], // Inicio: Santiago Centro
    [-33.452, -70.650], // Punto intermedio
    [-33.458, -70.635], // Punto intermedio
    [-33.466, -70.598]  // Fin: UTEM Macul
  ];

  
  const defaultCenter: [number, number] = [-33.455, -70.630];

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
      
  
      {mostrarRuta && (
        <>
          <Polyline 
            positions={rutaSimulada} 
            color="#2563eb" 
            weight={4} 
            opacity={0.8} 
            dashArray="10, 10" 
          />
          
          <Marker position={rutaSimulada[0]} icon={customIcon}>
            <Popup>
              <div className="font-bold text-blue-600">Punto de Inicio</div>
              <div className="text-xs text-gray-500">Santiago Centro</div>
            </Popup>
          </Marker>

          <Marker position={rutaSimulada[rutaSimulada.length - 1]} icon={customIcon}>
            <Popup>
              <div className="font-bold text-green-600">Punto Final</div>
              <div className="text-xs text-gray-500">Macul</div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}