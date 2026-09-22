export const dynamic = 'force-dynamic';
'use client';

import { useState, useEffect } from 'react';
import { Activity, BarChart3, Signal, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [datosGraficos, setDatosGraficos] = useState<DatosAnaliticas>({
    conteoPaquetes: [],
    rssiPorNodo: []
  });
  const [cargando, setCargando] = useState(true);
  const [accesoDenegado, setAccesoDenegado] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('mesh_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.rol === 'Usuario') {
          setAccesoDenegado(true);
          setCargando(false);
          return;
        }
      } catch (e) {}
    }

    const cargarAnaliticas = async () => {
      try {
        const token = localStorage.getItem('mesh_token');
        const respuesta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telemetry/analytics`, {
          headers: { 'ngrok-skip-browser-warning': 'true',
            'Authorization': `Bearer ${token}`
          }
        });
        if (respuesta.ok) {
          const data = await respuesta.json();
          setDatosGraficos(data);
        } else if (respuesta.status === 403) {
          setAccesoDenegado(true);
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

  if (accesoDenegado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="p-4 bg-amber-50 rounded-full text-amber-500 mb-4">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Módulo de Analítica y Métricas</h2>
        <p className="text-gray-500 max-w-md mb-6">
          Las métricas de rendimiento y estadísticas de red están reservadas para los roles de <strong className="text-gray-700">Administrador</strong> y <strong className="text-gray-700">Operador</strong>.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Ir a Mensajes y Mapa
        </button>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800">Métricas y Analíticas de Red</h1>
          <p className="text-gray-500 text-sm mt-1">Análisis de rendimiento y calidad de enlace LoRa en tiempo real (Operadores y Admin)</p>
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
            {datosGraficos.rssiPorNodo.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Aún no hay datos de RSSI registrados...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGraficos.rssiPorNodo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="nodo" tick={{fontSize: 12}} />
                  <YAxis domain={['dataMin - 10', 0]} tick={{fontSize: 12}} label={{ value: 'dBm', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, offset: -5 }} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Legend />
                  <Bar dataKey="rssi" name="Promedio RSSI (dBm)" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
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
