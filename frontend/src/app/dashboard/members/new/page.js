'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { membersAPI, plansAPI } from '@/lib/api';
import PlanCard from '@/components/dashboard/PlanCard';
import { 
  UserPlusIcon, 
  ArrowLeftIcon, 
  CheckCircleIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';

export default function NewMemberPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    birthDate: '',
    gender: 'MALE',
    notes: '',
    planId: '',
    paymentMethod: 'CASH',
    enrollmentDate: todayStr,
    startDate: todayStr,
  });
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await plansAPI.list();
      setPlans(response.data.filter(p => p.status) || []);
    } catch (err) {
      console.error('Error loading plans:', err);
      toast.error('Erro ao carregar planos disponíveis');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });
      if (photo) {
        data.append('photo', photo);
      }

      const response = await membersAPI.create(data);
      toast.success('Membro criado com sucesso!');
      router.push(`/dashboard/members/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar membro');
      toast.error(err.response?.data?.error || 'Erro ao criar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectPlan = (plan) => {
    setFormData({
      ...formData,
      planId: formData.planId === plan.id ? '' : plan.id
    });
  };

  const selectedPlanDetails = plans.find(p => p.id === formData.planId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
            <UserPlusIcon className="h-8 w-8 text-primary-500" />
            Novo Membro
          </h1>
          <p className="text-gray-500 dark:text-dark-300 mt-1">Registe um novo atleta e atribua um plano</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="p-3 rounded-2xl bg-white/50 dark:bg-dark-800/50 text-dark-600 dark:text-dark-300 hover:bg-white dark:hover:bg-dark-700 transition-all shadow-sm"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 font-bold animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Personal Info */}
        <div className="space-y-6">
          <div className="card-glass p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white border-b border-white/10 dark:border-dark-700 pb-4">Dados Pessoais</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label text-[10px] uppercase tracking-widest font-bold">Nome Completo *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-glass h-14"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-[10px] uppercase tracking-widest font-bold">Telefone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-glass h-14"
                    placeholder="+258 XX XXX XXXX"
                    required
                  />
                </div>
                <div>
                  <label className="label text-[10px] uppercase tracking-widest font-bold text-green-500">WhatsApp (Opcional)</label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="input-glass h-14 border-green-500/20"
                    placeholder="+258 XX XXX XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="label text-[10px] uppercase tracking-widest font-bold">E-mail (Contacto)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-glass h-14"
                  placeholder="exemplo@gym.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-[10px] uppercase tracking-widest font-bold">Inscrição *</label>
                  <input
                    type="date"
                    name="enrollmentDate"
                    value={formData.enrollmentDate}
                    onChange={handleChange}
                    className="input-glass h-14"
                    required
                  />
                </div>
                <div>
                  <label className="label text-[10px] uppercase tracking-widest font-bold">Nascimento *</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="input-glass h-14"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label text-[10px] uppercase tracking-widest font-bold">Sexo *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-glass h-14 appearance-none"
                  required
                >
                  <option value="MALE" className="bg-dark-900">Masculino</option>
                  <option value="FEMALE" className="bg-dark-900">Feminino</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-glass p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white border-b border-white/10 dark:border-dark-700 pb-4">Media e Notas</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label text-[10px] uppercase tracking-widest font-bold">Foto de Perfil</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label 
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center h-32 w-full rounded-2xl border-2 border-dashed border-white/20 dark:border-dark-700 hover:border-primary-500 hover:bg-primary-500/5 transition-all cursor-pointer group"
                  >
                    {photo ? (
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                        <span className="text-sm font-bold text-dark-600 dark:text-dark-300">{photo.name}</span>
                      </div>
                    ) : (
                      <>
                        <ShoppingBagIcon className="h-8 w-8 text-dark-300 dark:text-dark-600 group-hover:text-primary-500 transition-colors" />
                        <span className="text-xs text-dark-400 dark:text-dark-500 mt-2">Clique para carregar foto</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="label text-[10px] uppercase tracking-widest font-bold">Observações</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="input-glass min-h-[100px] py-4"
                  placeholder="Alguma condição médica ou detalhe importante..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Plan & Payment */}
        <div className="space-y-6">
          <div className="card-glass p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white border-b border-white/10 dark:border-dark-700 pb-4">Escolher Plano</h3>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingPlans ? (
                <div className="flex justify-center py-10">
                  <div className="h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : plans.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      mode="select"
                      isSelected={formData.planId === plan.id}
                      onSelect={() => handleSelectPlan(plan)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-dark-500 py-10">Nenhum plano ativo disponível.</p>
              )}
            </div>
          </div>

          {formData.planId && (
            <div className="card-glass p-6 md:p-8 space-y-6 animate-slide-up">
              <h3 className="text-lg font-bold text-dark-900 dark:text-white border-b border-white/10 dark:border-dark-700 pb-4">Pagamento Inicial</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="label text-[10px] uppercase tracking-widest font-bold mb-3 block">Data de Início do Plano *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="input-glass h-14 mb-6"
                    required
                  />
                </div>

                <div>
                  <label className="label text-[10px] uppercase tracking-widest font-bold mb-3 block">Método de Pagamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Dinheiro', value: 'CASH', icon: BanknotesIcon },
                      { label: 'M-Pesa', value: 'MPESA', icon: CreditCardIcon },
                      { label: 'E-mola', value: 'EMOLA', icon: CreditCardIcon },
                      { label: 'Transferência', value: 'TRANSFER', icon: BanknotesIcon }
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                          formData.paymentMethod === method.value 
                            ? 'bg-dark-900 dark:bg-white border-dark-900 dark:border-white text-white dark:text-dark-900 shadow-lg' 
                            : 'border-white/10 dark:border-dark-800 text-dark-400 dark:text-dark-300 hover:border-white/30 dark:hover:border-dark-700'
                        }`}
                      >
                        <method.icon className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-gradient-primary text-white shadow-glow-primary">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80 mb-1">Total a Pagar</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter">{selectedPlanDetails?.price?.toLocaleString()}</span>
                    <span className="text-sm font-bold opacity-80 uppercase">MZN</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary h-16 flex-1 text-base uppercase tracking-[0.2em] font-black group shadow-glow-primary"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A Processar...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircleIcon className="h-6 w-6" />
                  <span>Concluir Registo</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
