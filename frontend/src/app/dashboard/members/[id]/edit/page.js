'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { membersAPI, UPLOAD_URL, getImageUrl } from '@/lib/api';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  PhoneIcon, 
  CalendarIcon, 
  PhotoIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

export const runtime = 'edge';

export default function EditMemberPage({ params }) {
  const router = useRouter();
  const toast = useToast();
  const { id } = params;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: 'MALE',
    notes: '',
    enrollmentDate: '',
    startDate: '',
    expirationDate: '',
  });
  
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    loadMember();
  }, [id]);

  const loadMember = async () => {
    try {
      const response = await membersAPI.get(id);
      const member = response.data;
      
      setFormData({
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
        gender: member.gender || 'MALE',
        notes: member.notes || '',
        enrollmentDate: member.enrollmentDate ? new Date(member.enrollmentDate).toISOString().split('T')[0] : '',
        startDate: member.startDate ? new Date(member.startDate).toISOString().split('T')[0] : '',
        expirationDate: member.expirationDate ? new Date(member.expirationDate).toISOString().split('T')[0] : '',
      });
      
      if (member.photo) {
        setPhotoPreview(getImageUrl(member.photo));
      }
    } catch (err) {
      console.error('Error loading member:', err);
      setError('Erro ao carregar os dados do membro.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      if (photo) {
        submitData.append('photo', photo);
      }

      await membersAPI.update(id, submitData);
      setSuccess(true);
      toast.success('Dados atualizados com sucesso!');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/members/${id}`);
      }, 1500);

    } catch (err) {
      console.error('Error updating member:', err);
      const msg = err.response?.data?.error || 'Erro ao atualizar dados do membro.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/dashboard/members/${id}`}
            className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-dark-800/40 transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-dark-500 dark:text-dark-200" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Editar Membro</h1>
            <p className="text-gray-500 dark:text-dark-300 dark:text-dark-400 mt-1">Atualize as informações de {formData.name}</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="card-glass bg-green-500/10 border-green-500/50 p-4 flex items-center gap-3 animate-slide-up">
          <CheckIcon className="h-6 w-6 text-green-500" />
          <p className="text-green-700 dark:text-green-400 font-bold">Dados atualizados com sucesso!</p>
        </div>
      )}

      {error && (
        <div className="card-glass bg-red-500/10 border-red-500/50 p-4 flex items-center gap-3 animate-shake">
          <XMarkIcon className="h-6 w-6 text-red-500" />
          <p className="text-red-700 dark:text-red-400 font-bold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Photo Upload Section */}
        <div className="md:col-span-1 space-y-6">
          <div className="card-glass p-6 flex flex-col items-center">
            <h3 className="text-sm font-bold text-dark-500 dark:text-dark-200 dark:text-dark-400 uppercase tracking-widest mb-6 w-full text-center">Foto de Perfil</h3>
            
            <div 
              onClick={() => fileInputRef.current.click()}
              className="group relative h-40 w-40 rounded-full bg-dark-100 dark:bg-dark-800 border-2 border-dashed border-dark-300 dark:border-dark-700 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary-500 transition-all duration-300"
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PhotoIcon className="h-8 w-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <UserIcon className="h-12 w-12 text-dark-300 dark:text-dark-600 mx-auto" />
                  <span className="text-xs text-dark-400 dark:text-dark-300 mt-2 block font-medium">Trocar Foto</span>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden" 
              accept="image/*"
            />
            
            <p className="text-[10px] text-dark-400 dark:text-dark-300 mt-4 text-center leading-relaxed">
              Resolução recomendada: 400x400.<br/>Formatos: JPG, PNG.
            </p>
          </div>
        </div>

        {/* Form Details Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="card-glass p-8">
            <div className="grid grid-cols-1 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-dark-500 dark:text-dark-200 dark:text-dark-400 uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Nome Completo
                </label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input bg-white/50 dark:bg-dark-800/50"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-dark-500 dark:text-dark-200 uppercase tracking-wider flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4" /> Telefone
                  </label>
                  <input 
                    type="tel" 
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input bg-white/50 dark:bg-dark-800/50"
                    placeholder="8X XXX XXXX"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-dark-500 dark:text-dark-200 uppercase tracking-wider flex items-center gap-2">
                    <CheckIcon className="h-4 w-4" /> E-mail (Contacto)
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input bg-white/50 dark:bg-dark-800/50"
                    placeholder="exemplo@gym.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enrollment Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-dark-500 dark:text-dark-200 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> Data de Inscrição
                  </label>
                  <input 
                    type="date" 
                    name="enrollmentDate"
                    value={formData.enrollmentDate}
                    onChange={handleInputChange}
                    className="input bg-white/50 dark:bg-dark-800/50"
                  />
                </div>

                {/* Birth Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-dark-500 dark:text-dark-200 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> Data de Nascimento
                  </label>
                  <input 
                    type="date" 
                    name="birthDate"
                    required
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="input bg-white/50 dark:bg-dark-800/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subscription Start Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-dark-500 dark:text-dark-200 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary-500" /> Início do Plano
                  </label>
                  <input 
                    type="date" 
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="input bg-white/50 dark:bg-dark-800/50 border-primary-500/20"
                  />
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-dark-500 dark:text-dark-200 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-red-500" /> Vencimento do Plano
                  </label>
                  <input 
                    type="date" 
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleInputChange}
                    className="input bg-white/50 dark:bg-dark-800/50 border-red-500/20"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-dark-500 dark:text-dark-200 dark:text-dark-400 uppercase tracking-wider mb-3 block">Género</label>
                <div className="flex gap-4">
                  {[
                    { label: 'Masculino', value: 'MALE' },
                    { label: 'Feminino', value: 'FEMALE' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gender: option.value }))}
                      className={`flex-1 py-3 px-6 rounded-2xl border-2 transition-all duration-300 font-bold ${
                        formData.gender === option.value 
                          ? 'bg-primary-500 border-primary-500 text-white shadow-glow-sm' 
                          : 'border-white/10 dark:border-dark-700/50 text-dark-500 dark:text-dark-200 dark:text-dark-400 hover:bg-white/40 dark:hover:bg-dark-800/40'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-dark-500 dark:text-dark-200 dark:text-dark-400 uppercase tracking-wider flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" /> Observações (Opcional)
                </label>
                <textarea 
                  name="notes"
                  rows="4"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input bg-white/50 dark:bg-dark-800/50 min-h-[120px]"
                  placeholder="Histórico médico, restrições, etc..."
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <Link 
                href={`/dashboard/members/${id}`}
                className="flex-1 btn-ghost py-4 rounded-2xl text-dark-500 dark:text-dark-200 dark:text-dark-400 hover:bg-white/40 dark:hover:bg-dark-800/40 text-center font-bold"
              >
                Cancelar
              </Link>
              <button 
                type="submit"
                disabled={saving}
                className="flex-[2] btn-primary py-4 rounded-2xl shadow-glow transition-all duration-300 disabled:opacity-50"
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>A guardar...</span>
                  </div>
                ) : (
                  'Guardar Alterações'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
