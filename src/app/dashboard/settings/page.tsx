"use client";
import { useState, useEffect } from "react";

const API_URL = "http://localhost:4000"; 

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    mqttBrokerUrl: "",
    mqttTopic: "",
    mapCenterLat: 0,
    mapCenterLng: 0,
    mapZoom: 13,
    retentionDays: 30,
    notificationsEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: "exito" | "error" } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('mesh_token'); 
        const res = await fetch(`${API_URL}/settings`, {
          headers: {
            "Authorization": `Bearer ${token}` 
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.mqttBrokerUrl) {
            setSettings(data);
          }
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMensaje(null);

    try {
      const token = localStorage.getItem('mesh_token'); 

      const res = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMensaje({ 
          texto: "Configuración guardada. Si cambiaste MQTT, el backend se ha reconectado.", 
          tipo: "exito" 
        });
      } else {
        const errorData = await res.json().catch(() => null);
        setMensaje({ 
          texto: errorData?.message || "Error al guardar. Verifica que tengas permisos de Admin y tu sesión esté activa.", 
          tipo: "error" 
        });
      }
    } catch (error) {
      setMensaje({ 
        texto: "Error crítico de conexión con el servidor.", 
        tipo: "error" 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMensaje(null), 5000); 
    }
  };

  if (loading) return <div className="p-6">Cargando configuraciones...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Configuración del Sistema Mesh</h1>
      
      {mensaje && (
        <div className={`p-4 mb-6 rounded ${mensaje.tipo === "exito" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sección MQTT */}
        <div className="p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Conexión MQTT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">URL del Broker</label>
              <input type="text" name="mqttBrokerUrl" value={settings.mqttBrokerUrl} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tópico de Suscripción</label>
              <input type="text" name="mqttTopic" value={settings.mqttTopic} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
          </div>
        </div>

        {/* Sección Mapa */}
        <div className="p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Mapa Inicial</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Latitud</label>
              <input type="number" step="any" name="mapCenterLat" value={settings.mapCenterLat} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Longitud</label>
              <input type="number" step="any" name="mapCenterLng" value={settings.mapCenterLng} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zoom por defecto</label>
              <input type="number" name="mapZoom" value={settings.mapZoom} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
          </div>
        </div>

        {/* Sección Mantenimiento y Alertas */}
        <div className="p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Preferencias Generales</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Días de retención de datos en BD</label>
              <input type="number" name="retentionDays" value={settings.retentionDays} onChange={handleChange} className="mt-1 block w-full md:w-1/3 rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="notificationsEnabled" checked={settings.notificationsEnabled} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-900">Activar notificaciones emergentes en el navegador</label>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200">
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </form>
    </div>
  );
}