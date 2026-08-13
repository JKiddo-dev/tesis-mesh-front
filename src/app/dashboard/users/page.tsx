'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, Search, X, Radio, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: 'Admin' | 'Operador' | 'Usuario';
  estado: 'Activo' | 'Inactivo';
  nodoId?: string | null;
}

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nodosActivos, setNodosActivos] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [rolActual, setRolActual] = useState<string>('');
  const [accesoDenegado, setAccesoDenegado] = useState(false);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoUser, setNuevoUser] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'Usuario' as 'Admin' | 'Operador' | 'Usuario',
    estado: 'Activo' as 'Activo' | 'Inactivo',
    nodoId: ''
  });

  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState({
    _id: '',
    nombre: '',
    email: '',
    password: '',
    rol: 'Usuario' as 'Admin' | 'Operador' | 'Usuario',
    estado: 'Activo' as 'Activo' | 'Inactivo',
    nodoId: ''
  });

  const [mostrarModalRadio, setMostrarModalRadio] = useState(false);
  const [usuarioAsignandoRadio, setUsuarioAsignandoRadio] = useState<{ _id: string; nombre: string; nodoId: string }>({
    _id: '',
    nombre: '',
    nodoId: ''
  });

  const cargarNodosActivos = async () => {
    try {
      const token = localStorage.getItem('mesh_token');
      const res = await fetch('http://localhost:4000/telemetry/nodes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNodosActivos(data || []);
      }
    } catch (error) {
      console.error('Error cargando nodos', error);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('mesh_token');
      const res = await fetch('http://localhost:4000/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      } else {
        if (res.status === 403) {
          setAccesoDenegado(true);
        }
      }
    } catch (error) {
      console.error('Error cargando usuarios', error);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('mesh_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRolActual(user.rol);
        if (user.rol === 'Usuario') {
          setAccesoDenegado(true);
          return;
        }
      } catch (e) {}
    }
    cargarUsuarios();
    cargarNodosActivos();
  }, []);

  const eliminarUsuario = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${nombre}?`)) return;
    try {
      const token = localStorage.getItem('mesh_token');
      const res = await fetch(`http://localhost:4000/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsuarios(usuarios.filter(user => user._id !== id));
    } catch (error) {
      console.error('Error eliminando', error);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('mesh_token');
      const payload = {
        ...nuevoUser,
        nodoId: nuevoUser.nodoId.trim() === '' ? null : nuevoUser.nodoId.trim()
      };
      const res = await fetch('http://localhost:4000/auth/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMostrarModal(false);
        setNuevoUser({ nombre: '', email: '', password: '', rol: 'Usuario', estado: 'Activo', nodoId: '' });
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error creando usuario', error);
    }
  };

  const abrirModalEdicion = (user: Usuario) => {
    setUsuarioEditando({
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      password: '', 
      rol: user.rol,
      estado: user.estado,
      nodoId: user.nodoId || ''
    });
    setMostrarModalEditar(true);
  };

  const abrirModalAsignarRadio = (user: Usuario) => {
    setUsuarioAsignandoRadio({
      _id: user._id,
      nombre: user.nombre,
      nodoId: user.nodoId || ''
    });
    setMostrarModalRadio(true);
  };

  const handleEditarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('mesh_token');
      const payload = {
        ...usuarioEditando,
        nodoId: usuarioEditando.nodoId.trim() === '' ? null : usuarioEditando.nodoId.trim()
      };
      const res = await fetch(`http://localhost:4000/auth/users/${usuarioEditando._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMostrarModalEditar(false);
        cargarUsuarios();
      } else {
        alert("Error al actualizar usuario");
      }
    } catch (error) {
      console.error('Error editando usuario', error);
    }
  };

  const handleGuardarRadioRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('mesh_token');
      const res = await fetch(`http://localhost:4000/auth/users/${usuarioAsignandoRadio._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          nodoId: usuarioAsignandoRadio.nodoId.trim() === '' ? null : usuarioAsignandoRadio.nodoId.trim()
        })
      });
      if (res.ok) {
        setMostrarModalRadio(false);
        cargarUsuarios();
      } else {
        alert("Error al asignar radio");
      }
    } catch (error) {
      console.error('Error asignando radio', error);
    }
  };

  if (accesoDenegado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="p-4 bg-red-50 rounded-full text-red-500 mb-4">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
        <p className="text-gray-500 max-w-md mb-6">
          La gestión de usuarios y asignación de radios está disponible únicamente para los roles de <strong className="text-gray-700">Administrador</strong> y <strong className="text-gray-700">Operador</strong>.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Volver al Mapa Principal
        </button>
      </div>
    );
  }

  const usuariosFiltrados = usuarios.filter(user => 
    user.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    user.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    (user.nodoId && user.nodoId.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const getRolBadge = (rol: string) => {
    if (rol === 'Admin') {
      return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">Admin</span>;
    }
    if (rol === 'Operador') {
      return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">Operador</span>;
    }
    return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Usuario</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios y Radios</h1>
          <p className="text-gray-500 text-sm mt-1">Administra roles, accesos y asignación de nodos Mesh</p>
        </div>
        <button onClick={() => setMostrarModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm shrink-0">
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o nodo..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border text-gray-700 border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>Total usuarios: <strong>{usuarios.length}</strong></span>
            <span>•</span>
            <span>Nodos activos detectados: <strong>{nodosActivos.length}</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Nombre y Correo</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Radio / Nodo Mesh</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{usuario.nombre}</div>
                      <div className="text-gray-500 text-xs">{usuario.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getRolBadge(usuario.rol)}
                    </td>
                    <td className="px-6 py-4">
                      {usuario.nodoId ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-800 border border-slate-300">
                          <Radio size={13} className="text-blue-600" />
                          Nodo: {usuario.nodoId}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic flex items-center gap-1">
                          Sin radio asignada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${usuario.estado === 'Activo' ? 'text-green-600' : 'text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${usuario.estado === 'Activo' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        {usuario.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button 
                        onClick={() => abrirModalAsignarRadio(usuario)} 
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors p-1.5 rounded-md" 
                        title="Asignar o Cambiar Radio"
                      >
                        <Radio size={18} />
                      </button>
                      
                      <button 
                        onClick={() => abrirModalEdicion(usuario)} 
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors p-1.5 rounded-md" 
                        title="Editar Usuario"
                      >
                        <Edit2 size={18} />
                      </button>
                      
                      <button 
                        onClick={() => eliminarUsuario(usuario._id, usuario.nombre)} 
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors p-1.5 rounded-md" 
                        title="Eliminar Usuario"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR USUARIO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Nuevo Usuario</h2>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCrearUsuario} className="space-y-4 text-gray-700">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={nuevoUser.nombre} onChange={e => setNuevoUser({...nuevoUser, nombre: e.target.value})} placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                <input type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={nuevoUser.email} onChange={e => setNuevoUser({...nuevoUser, email: e.target.value})} placeholder="juan@correo.cl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña</label>
                <input type="password" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={nuevoUser.password} onChange={e => setNuevoUser({...nuevoUser, password: e.target.value})} placeholder="••••••••" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rol</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={nuevoUser.rol} onChange={e => setNuevoUser({...nuevoUser, rol: e.target.value as any})}>
                    <option value="Usuario">Usuario (Espectador)</option>
                    <option value="Operador">Operador</option>
                    {rolActual === 'Admin' && <option value="Admin">Admin</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={nuevoUser.estado} onChange={e => setNuevoUser({...nuevoUser, estado: e.target.value as any})}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center justify-between">
                  <span>Radio / Nodo Asignado (Opcional)</span>
                </label>
                <div className="space-y-2">
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    value={nodosActivos.includes(nuevoUser.nodoId) ? nuevoUser.nodoId : (nuevoUser.nodoId ? 'custom' : '')}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setNuevoUser({ ...nuevoUser, nodoId: e.target.value });
                      }
                    }}
                  >
                    <option value="">Sin radio asignada</option>
                    {nodosActivos.map(nodo => (
                      <option key={nodo} value={nodo}>
                        Nodo detectado: {nodo}
                      </option>
                    ))}
                    <option value="custom">-- Ingresar ID manualmente --</option>
                  </select>

                  {(!nodosActivos.includes(nuevoUser.nodoId) && nuevoUser.nodoId !== '') && (
                    <input 
                      type="text" 
                      placeholder="Ingresa ID del nodo (ej: 1234567890 o 3b8a1c)" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" 
                      value={nuevoUser.nodoId} 
                      onChange={e => setNuevoUser({...nuevoUser, nodoId: e.target.value})} 
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Si no se asigna radio, el usuario actuará como espectador.</p>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {mostrarModalEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Editar Usuario</h2>
              <button onClick={() => setMostrarModalEditar(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditarUsuario} className="space-y-4 text-gray-700">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={usuarioEditando.nombre} onChange={e => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                <input type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed text-sm" value={usuarioEditando.email} disabled title="El correo no se puede cambiar" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nueva Contraseña <span className="text-gray-400 text-xs font-normal">(dejar en blanco para no cambiar)</span></label>
                <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={usuarioEditando.password} onChange={e => setUsuarioEditando({...usuarioEditando, password: e.target.value})} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rol</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={usuarioEditando.rol} onChange={e => setUsuarioEditando({...usuarioEditando, rol: e.target.value as any})}>
                    <option value="Usuario">Usuario</option>
                    <option value="Operador">Operador</option>
                    {rolActual === 'Admin' && <option value="Admin">Admin</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={usuarioEditando.estado} onChange={e => setUsuarioEditando({...usuarioEditando, estado: e.target.value as any})}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Radio / Nodo Asignado</label>
                <div className="space-y-2">
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    value={nodosActivos.includes(usuarioEditando.nodoId) ? usuarioEditando.nodoId : (usuarioEditando.nodoId ? 'custom' : '')}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setUsuarioEditando({ ...usuarioEditando, nodoId: e.target.value });
                      }
                    }}
                  >
                    <option value="">Sin radio asignada</option>
                    {nodosActivos.map(nodo => (
                      <option key={nodo} value={nodo}>
                        Nodo detectado: {nodo}
                      </option>
                    ))}
                    <option value="custom">-- Ingresar ID manualmente --</option>
                  </select>

                  {(!nodosActivos.includes(usuarioEditando.nodoId) && usuarioEditando.nodoId !== '') && (
                    <input 
                      type="text" 
                      placeholder="Ingresa ID del nodo" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" 
                      value={usuarioEditando.nodoId} 
                      onChange={e => setUsuarioEditando({...usuarioEditando, nodoId: e.target.value})} 
                    />
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setMostrarModalEditar(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">Actualizar Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR RADIO RÁPIDA */}
      {mostrarModalRadio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Radio className="text-blue-600" size={22} />
                <h2 className="text-xl font-bold text-gray-800">Asignar Radio</h2>
              </div>
              <button onClick={() => setMostrarModalRadio(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Asigna o reasigna una radio LoRa Mesh al usuario <strong>{usuarioAsignandoRadio.nombre}</strong>.
            </p>

            <form onSubmit={handleGuardarRadioRapida} className="space-y-4 text-gray-700">
              <div>
                <label className="block text-sm font-medium mb-1">Nodo / Radio Mesh</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white mb-2"
                  value={nodosActivos.includes(usuarioAsignandoRadio.nodoId) ? usuarioAsignandoRadio.nodoId : (usuarioAsignandoRadio.nodoId ? 'custom' : '')}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setUsuarioAsignandoRadio({ ...usuarioAsignandoRadio, nodoId: e.target.value });
                    }
                  }}
                >
                  <option value="">-- Sin radio asignada (Desvincular) --</option>
                  {nodosActivos.map(nodo => (
                    <option key={nodo} value={nodo}>
                      Nodo activo: {nodo}
                    </option>
                  ))}
                  <option value="custom">-- Ingresar ID manualmente --</option>
                </select>

                <input 
                  type="text" 
                  placeholder="ID del nodo (ej: 1234567890 o 3b8a1c)" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" 
                  value={usuarioAsignandoRadio.nodoId} 
                  onChange={e => setUsuarioAsignandoRadio({...usuarioAsignandoRadio, nodoId: e.target.value})} 
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setMostrarModalRadio(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">Guardar Asignación</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
