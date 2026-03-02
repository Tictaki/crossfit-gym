'use client';

import { useEffect, useState } from 'react';
import { 
  BuildingOfficeIcon, 
  CloudArrowUpIcon,
  SwatchIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { settingsAPI, usersAPI, UPLOAD_URL, getImageUrl } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmModalContext';

export default function SettingsPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const toast = useToast();
  const { confirm } = useConfirm();
  
  // App settings state
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  // User profile state
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [photo, setPhoto] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadSettings();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);
      setProfileData({
        ...profileData,
        name: parsedUser.name || '',
        email: parsedUser.email || '',
      });
    }
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (profileData.password !== profileData.confirmPassword) {
      toast.error('As palavras-passe não coincidem!');
      return;
    }

    setUpdatingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      if (profileData.password) {
        formData.append('password', profileData.password);
      }
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await usersAPI.updateProfile(formData);
      const updatedUser = response.data;
      
      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setProfilePreview(null);
      setPhoto(null);
      setProfileData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      
      // Notify other parts of the app (DashboardLayout)
      window.dispatchEvent(new Event('userUpdate'));
      
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      if (response.data.background_image) {
        setBackgroundPreview(getImageUrl(response.data.background_image));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBackground(true);
    try {
      const formData = new FormData();
      formData.append('background', file);
      formData.append('key', 'background_image');
      const response = await settingsAPI.updateBackground(formData);
      
      const newPath = getImageUrl(response.data.backgroundImage);
      setBackgroundPreview(newPath);
      
      // Notify other parts of the app
      window.dispatchEvent(new CustomEvent('backgroundUpdate', { 
        detail: { path: newPath, theme: 'light' } 
      }));
      
      toast.success('Imagem de fundo atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading background:', error);
      toast.error('Erro ao carregar imagem de fundo.');
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (await confirm({
      title: 'Remover Fundo?',
      message: 'Realmente deseja remover a imagem de fundo?',
      confirmText: 'Remover',
      variant: 'warning'
    })) {

    try {
      await settingsAPI.removeBackground('background_image');
      setBackgroundPreview(null);
      
      window.dispatchEvent(new CustomEvent('backgroundUpdate', { 
        detail: { path: null, theme: 'light' } 
      }));
      
      toast.success('Imagem removida com sucesso!');
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('Erro ao remover imagem.');
    }
  }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-dark-300 dark:text-dark-400 mt-1">Gerir preferências da aplicação e informações do ginásio</p>
      </div>

      {/* Gym Info Section */}
      <div className="card-glass">
        {/* ... (keep existing gym info) */}
      </div>

      {/* Profile Section */}
      <div className="card-glass">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-dark-700 pb-4">
          <UserCircleIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-bold text-dark-900 dark:text-white">Meu Perfil</h2>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-4">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-dark-100 dark:bg-dark-800 border-4 border-white dark:border-dark-700 shadow-premium relative group">
                {profilePreview || userData?.photo ? (
                  <img 
                    src={profilePreview || getImageUrl(userData.photo)} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <UserCircleIcon className="h-full w-full text-dark-300 dark:text-dark-600" />
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <span className="text-white text-xs font-bold uppercase">Alterar</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                  />
                </label>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-dark-300 dark:text-dark-500 uppercase font-bold tracking-widest">Foto de Perfil</p>
            </div>

            {/* Personal Details */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label className="label dark:text-dark-300">Nome Completo</label>
                <input 
                  type="text" 
                  className="input" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <label className="label dark:text-dark-300">Email</label>
                <input 
                  type="email" 
                  className="input" 
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="label dark:text-dark-300">Nova Palavra-passe</label>
                <input 
                  type="password" 
                  className="input" 
                  value={profileData.password}
                  onChange={(e) => setProfileData({...profileData, password: e.target.value})}
                  placeholder="Deixe em branco para manter"
                />
              </div>
              <div className="space-y-2">
                <label className="label dark:text-dark-300">Confirmar Palavra-passe</label>
                <input 
                  type="password" 
                  className="input" 
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                  placeholder="Confirme a nova senha"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={updatingProfile}
              className="btn-primary"
            >
              {updatingProfile ? 'A atualizar...' : 'Atualizar Perfil'}
            </button>
          </div>
        </form>
      </div>

      {/* Appearance Section */}
      <div className="card-glass">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-dark-700 pb-4">
          <SwatchIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-dark-900 dark:text-white">Design e Aparência</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
            <div>
              <p className="font-bold text-dark-900 dark:text-white">Tema Escuro</p>
              <p className="text-sm text-gray-500 dark:text-dark-300 dark:text-dark-400">Ativar modo noturno na interface</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isDarkMode}
                onChange={toggleTheme}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700">
            <p className="font-bold text-dark-900 dark:text-white mb-2">Imagem de Fundo (Modo Claro)</p>
            <p className="text-sm text-gray-500 dark:text-dark-300 dark:text-dark-400">Personalize o fundo do dashboard para o modo claro. No modo escuro, o sistema utilizará automaticamente o fundo preto profundo.</p>
            
            <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
              <div className="w-full md:w-48 h-24 rounded-xl bg-dark-200 dark:bg-dark-700 overflow-hidden border-2 border-dashed border-dark-300 dark:border-dark-600 flex items-center justify-center relative group shadow-inner">
                {backgroundPreview ? (
                  <img src={backgroundPreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <SwatchIcon className="h-8 w-8 text-dark-400 dark:text-dark-300" />
                )}
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <span className="text-white text-xs font-bold uppercase">Alterar</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <p className="text-xs text-dark-400 dark:text-dark-300 leading-relaxed">
                  Recomendamos imagens de alta resolução (Full HD ou 4K). O sistema aplicará efeitos de desfoque.
                </p>
                <div className="flex items-center gap-4">
                  {uploadingBackground && (
                    <div className="flex items-center gap-2 text-primary-500 text-xs font-bold animate-pulse">
                      <CloudArrowUpIcon className="h-4 w-4" />
                      <span>A processar...</span>
                    </div>
                  )}
                  {backgroundPreview && !uploadingBackground && (
                    <button 
                      onClick={handleRemoveBackground}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700 text-xs font-bold transition-colors group/del"
                    >
                      <TrashIcon className="h-4 w-4 transition-transform group-hover/del:scale-125" />
                      <span>Remover fundo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Section */}
      <div className="card-glass">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-dark-700 pb-4">
          <CloudArrowUpIcon className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold text-dark-900 dark:text-white">Dados e Backup</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-dark-900 dark:text-white">Exportar Base de Dados</p>
              <p className="text-sm text-gray-500 dark:text-dark-300 dark:text-dark-400">Baixar cópia de segurança de todos os dados</p>
            </div>
            {userRole === 'ADMIN' && (
              <button className="btn-secondary text-sm">Download Backup</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
