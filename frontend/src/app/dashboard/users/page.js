'use client';

import { useEffect, useState } from 'react';
import { usersAPI } from '@/lib/api';
import { 
  UserPlusIcon, 
  ShieldCheckIcon,
  UserIcon,
  TrashIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.list();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') {
      return (
        <span className="badge bg-purple-100 text-purple-700 border-purple-200 flex items-center gap-1">
          <ShieldCheckIcon className="h-3 w-3" /> Admin
        </span>
      );
    }
    return (
      <span className="badge bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
        <UserIcon className="h-3 w-3" /> Staff
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark-900">Utilizadores do Sistema</h1>
          <p className="text-gray-500 dark:text-dark-300 mt-1 text-sm">Gestão de acesso para administradores e staff</p>
        </div>
        <button 
          onClick={() => toast.info('Funcionalidade em desenvolvimento')} 
          className="btn-primary w-full sm:w-auto justify-center"
        >
          <UserPlusIcon className="h-5 w-5" />
          Novo Utilizador
        </button>
      </div>

      <div className="card-glass p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto table-container">
            <table className="table min-w-[700px]">
              <thead>
                <tr>
                  <th className="pl-8">Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Data Criação</th>
                  <th className="pr-8 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50/50">
                    <td className="pl-8 pb-4 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-md">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-bold text-dark-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td className="text-gray-500 dark:text-dark-300 text-sm">
                      {new Date(user.createdAt).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="pr-8 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
