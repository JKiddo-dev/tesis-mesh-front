'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, Search, X } from 'lucide-react';

interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: 'Admin' | 'Operador';
  estado: 'Activo' | 'Inactivo';
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoUser, setNuevoUser] = useState({ nombre: '', email: '', password: '', rol: 'Operador', estado: 'Activo' });

  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState({ _id: '', nombre: '', email: '', password: '', rol: 'Operador', estado: 'Activo' });

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
        if(res.status === 403) alert("No tienes permisos de Administrador para ver esta sección");
      }
    } catch (error) {
      console.error('Error cargando usuarios', error);
    }
  };

  useEffect(() => {
    cargarUsuarios();
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
      const res = await fetch('http://localhost:4000/auth/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(nuevoUser)
      });
      if (res.ok) {
        setMostrarModal(false);
        setNuevoUser({ nombre: '', email: '', password: '', rol: 'Operador', estado: 'Activo' });
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error creando', error);
    }
  };

  const abrirModalEdicion = (user: Usuario) => {
    setUsuarioEditando({
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      password: '', 
      rol: user.rol,
      estado: user.estado
    });
    setMostrarModalEditar(true);
  };

  const handleEditarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('mesh_token');
      const res = await fetch(`http://localhost:4000/auth/users/${usuarioEditando._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(usuarioEditando)
      });
      if (res.ok) {
        setMostrarModalEditar(false);
        cargarUsuarios();
      } else {
        alert("Error al actualizar usuario");
      }
    } catch (error) {
      console.error('Error editando', error);
    }
  };

  const usuariosFiltrados = usuarios.filter(user => 
    user.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">Administra el acceso a la plataforma Mesh</p>
        </div>
        <button onClick={() => setMostrarModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm shrink-0">
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2 border text-gray-700 border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Nombre y Correo</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{usuario.nombre}</div>
                    <div className="text-gray-500">{usuario.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${usuario.rol === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${usuario.estado === 'Activo' ? 'text-green-600' : 'text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${usuario.estado === 'Activo' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      {usuario.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    
                    <button 
                      onClick={() => abrirModalEdicion(usuario)} 
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="Editar">
                      <Edit2 size={18} />
                    </button>
                    
                    <button onClick={() => eliminarUsuario(usuario._id, usuario.nombre)} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
         <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-gray-800">Nuevo Usuario</h2>
             <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
           </div>
           <form onSubmit={handleCrearUsuario} className="space-y-4 text-gray-700">
             <div>
               <label className="block text-sm font-medium mb-1">Nombre Completo</label>
               <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2" value={nuevoUser.nombre} onChange={e => setNuevoUser({...nuevoUser, nombre: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
               <input type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2" value={nuevoUser.email} onChange={e => setNuevoUser({...nuevoUser, email: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium mb-1">Contraseña</label>
               <input type="password" required className="w-full border border-gray-300 rounded-lg px-3 py-2" value={nuevoUser.password} onChange={e => setNuevoUser({...nuevoUser, password: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Rol</label>
                 <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={nuevoUser.rol} onChange={e => setNuevoUser({...nuevoUser, rol: e.target.value as 'Admin'|'Operador'})}>
                   <option value="Operador">Operador</option>
                   <option value="Admin">Admin</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">Estado</label>
                 <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={nuevoUser.estado} onChange={e => setNuevoUser({...nuevoUser, estado: e.target.value as 'Activo'|'Inactivo'})}>
                   <option value="Activo">Activo</option>
                   <option value="Inactivo">Inactivo</option>
                 </select>
               </div>
             </div>
             <div className="pt-4 flex justify-end gap-2">
               <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
               <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Guardar</button>
             </div>
           </form>
         </div>
       </div>
      )}

      {mostrarModalEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Editar Usuario</h2>
              <button onClick={() => setMostrarModalEditar(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditarUsuario} className="space-y-4 text-gray-700">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2" value={usuarioEditando.nombre} onChange={e => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                <input type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed" value={usuarioEditando.email} disabled title="El correo no se puede cambiar" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nueva Contraseña <span className="text-gray-400 text-xs font-normal">(dejar en blanco para no cambiar)</span></label>
                <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={usuarioEditando.password} onChange={e => setUsuarioEditando({...usuarioEditando, password: e.target.value})} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rol</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={usuarioEditando.rol} onChange={e => setUsuarioEditando({...usuarioEditando, rol: e.target.value as 'Admin'|'Operador'})}>
                    <option value="Operador">Operador</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={usuarioEditando.estado} onChange={e => setUsuarioEditando({...usuarioEditando, estado: e.target.value as 'Activo'|'Inactivo'})}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setMostrarModalEditar(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}