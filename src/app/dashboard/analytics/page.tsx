'use client';

import { useState, useEffect } from 'react';
import { Activity, BarChart3, Signal } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

interface ConteoPaquete {
  name: string;
  value: number;
}

interface RssiNodo {
  nodo: string;
  rssi: number;
  paquetes: number;
}

interface DatosAnaliticas {
  conteoPaquetes: ConteoPaquete[];
  rssiPorNodo: RssiNodo[];
}

export default function AnalyticsPage() {
  const [datosGraficos, setDatosGraficos] = useState<DatosAnaliticas>({
    conteoPaquetes: [],
    rssiPorNodo: []
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarAnaliticas = async () => {
      try {
        const token = localStorage.getItem('mesh_token');
        const respuesta = await fetch('http://localhost:4000/telemetry/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (respuesta.ok) {
          const data = await respuesta.json();
          setDatosGraficos(data);
        }
      } catch (error) {
        console.error('Error cargando analíticas:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarAnaliticas();
    const intervalo = setInterval(cargarAnaliticas, 10000);
    return () => clearInterval(intervalo);
  }, []);

  if (cargando) {
    return <div className="flex h-full items-center justify-center text-slate-500">Cargando métricas de la red Mesh...</div>;
  }

  const datosTortaConColores = datosGraficos.conteoPaquetes.map((entry, index) => ({
    ...entry,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-10 scrollbar-thin scrollbar-thumb-gray-300">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Métricas y Analíticas</h1>
          <p className="text-gray-500 text-sm mt-1">Análisis de rendimiento de la red LORA en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO 1: Calidad de Señal (RSSI) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2 shrink-0">
            <Signal className="text-blue-500" size={20} />
            <h2 className="font-semibold text-gray-700">Calidad de Señal Promedio (RSSI)</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 shrink-0">
            Mide la fuerza de la señal recibida por nodo. Valores más cercanos a 0 son mejores (Ej: -40dBm es excelente, -120dBm es crítica).
          </p>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGraficos.rssiPorNodo} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="nodo" tick={{fontSize: 12}} />
                <YAxis label={{ value: 'dBm', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Legend />
                <Bar dataKey="rssi" name="Promedio RSSI (dBm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: Distribución de Tráfico */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2 shrink-0">
            <Activity className="text-emerald-500" size={20} />
            <h2 className="font-semibold text-gray-700">Distribución de Tráfico por Tipo</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 shrink-0">
            Muestra el volumen de paquetes procesados por la red según su propósito (telemetría, posición, texto, etc).
          </p>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosTortaConColores}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}