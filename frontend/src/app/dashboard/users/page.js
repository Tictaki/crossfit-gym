'use client';

import { useEffect, useState } from 'react';
import { usersAPI } from '@/lib/api';
import { 
  UserPlusIcon, 
  ShieldCheckIcon,
  UserIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  KeyIcon,
  EnvelopeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmModalContext';

export default function UsersPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.list();
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('❌ Error loading users:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        full: error
      });
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Erro ao carregar utilizadores';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setIsEditMode(true);
      setEditingId(user.id);
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Don't show hashed password
        role: user.role
      });
    } else {
      setIsEditMode(false);
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'RECEPTIONIST'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'STAFF'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        // Only include password if it's changed
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        
        await usersAPI.update(editingId, updateData);
        toast.success('Utilizador atualizado com sucesso!');
      } else {
        if (!formData.password) {
          toast.error('A palavra-passe é obrigatória para novos utilizadores');
          setIsSubmitting(false);
          return;
        }
        await usersAPI.create(formData);
        toast.success('Utilizador criado com sucesso!');
      }
      handleCloseModal();
      loadUsers();
    } catch (error) {
      console.error('❌ Error saving user:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        full: error
      });
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Erro ao guardar utilizador';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (await confirm({
      title: 'Eliminar Utilizador?',
      message: `Tem a certeza que deseja eliminar ${name}? Esta ação não pode ser desfeita e removerá o acesso deste utilizador ao sistema.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })) {
      try {
        await usersAPI.delete(id);
        toast.success('Utilizador eliminado com sucesso!');
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Erro ao eliminar utilizador. Pode haver registos vinculados a este utilizador.');
      }
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
          onClick={() => handleOpenModal()} 
          className="btn-primary shadow-glow-sm"
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
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

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-xl animate-fade-in" onClick={handleCloseModal} />
          
          <div className="relative w-full max-w-lg glass-strong rounded-[2.5rem] shadow-2xl animate-slide-up">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
                  {isEditMode ? 'Editar Utilizador' : 'Novo Utilizador'}
                </h2>
                <p className="text-dark-400 dark:text-dark-300 font-medium">
                  {isEditMode ? 'Atualize as permissões e dados do utilizador' : 'Crie um novo acesso para o staff'}
                </p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-3 rounded-2xl glass-button text-dark-500 dark:text-dark-200 hover:bg-white/40 dark:hover:bg-dark-800/60 transition-all"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Nome Completo</label>
                <div className="relative">
                  <IdentificationIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                  <input
                    required
                    type="text"
                    placeholder="Ex: João Silva"
                    className="input-glass pl-12"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Endereço de Email</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                  <input
                    required
                    type="email"
                    placeholder="exemplo@email.com"
                    className="input-glass pl-12"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">
                  {isEditMode ? 'Palavra-passe (deixe em branco para não alterar)' : 'Palavra-passe'}
                </label>
                <div className="relative">
                  <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                  <input
                    required={!isEditMode}
                    type="password"
                    placeholder="••••••••"
                    className="input-glass pl-12"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Função / Permissões</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'RECEPTIONIST' })}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.role === 'RECEPTIONIST'
                        ? 'border-primary-500 bg-primary-500/5 text-primary-600'
                        : 'border-transparent bg-dark-50 dark:bg-dark-800 text-dark-400'
                    }`}
                  >
                    <UserIcon className="h-6 w-6" />
                    <span className="font-bold text-xs">STAFF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.role === 'ADMIN'
                        ? 'border-purple-500 bg-purple-500/5 text-purple-600'
                        : 'border-transparent bg-dark-50 dark:bg-dark-800 text-dark-400'
                    }`}
                  >
                    <ShieldCheckIcon className="h-6 w-6" />
                    <span className="font-bold text-xs">ADMIN</span>
                  </button>
                </div>
              </div>

              <button 
                disabled={isSubmitting}
                className="w-full py-6 bg-dark-900 dark:bg-white text-white dark:text-dark-900 rounded-[2rem] font-bold uppercase tracking-[0.2em] text-sm transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mt-4"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                ) : (
                  <>
                    {isEditMode ? <PencilSquareIcon className="h-5 w-5" /> : <UserPlusIcon className="h-5 w-5" />}
                    {isEditMode ? 'Atualizar Utilizador' : 'Criar Utilizador'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
