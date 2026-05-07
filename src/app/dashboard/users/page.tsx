'use client';

import { useState } from 'react';
import { UserPlus, Trash2, Edit2, Search } from 'lucide-react';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'Admin' | 'Operador';
  estado: 'Activo' | 'Inactivo';
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: '1', nombre: 'Victor Escobar', email: 'vescobar@utem.cl', rol: 'Admin', estado: 'Activo' },
    { id: '2', nombre: 'Matías Aguilar', email: 'maguilarb@utem.cl', rol: 'Admin', estado: 'Activo' },
    { id: '3', nombre: 'Operador Terreno', email: 'operador@utem.cl', rol: 'Operador', estado: 'Inactivo' },
  ]);

  const [busqueda, setBusqueda] = useState('');

  const eliminarUsuario = (id: string, nombre: string) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar a ${nombre}?`);
    if (confirmar) {
      setUsuarios(usuarios.filter(user => user.id !== id));
    }
  };

  const usuariosFiltrados = usuarios.filter(user => 
    user.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">Administra el acceso a la plataforma Mesh</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
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
                <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                  
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{usuario.nombre}</div>
                    <div className="text-gray-500">{usuario.email}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      usuario.rol === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {usuario.rol}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${
                      usuario.estado === 'Activo' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        usuario.estado === 'Activo' ? 'bg-green-600' : 'bg-red-600'
                      }`}></span>
                      {usuario.estado}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="Editar">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => eliminarUsuario(usuario.id, usuario.nombre)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1" 
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          
          {usuariosFiltrados.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No se encontraron usuarios con ese nombre.
            </div>
          )}

        </div>
      </div>

    </div>
  );
}