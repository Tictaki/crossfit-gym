'use client';

import { useEffect, useState } from 'react';
import PlanCard from '@/components/dashboard/PlanCard';
import { plansAPI } from '@/lib/api';
import { 
  PlusIcon,
  XMarkIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmModalContext';

export default function PlansPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationDays: '',
    description: '',
    status: true
  });
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadPlans();
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
  }, []);

  const loadPlans = async () => {
    try {
      const response = await plansAPI.list({ includeInactive: 'true' });
      setPlans(response.data);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price.toString(),
        durationDays: plan.durationDays.toString(),
        description: plan.description || '',
        status: plan.status
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price: '',
        durationDays: '30',
        description: '',
        status: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await plansAPI.update(editingPlan.id, formData);
      } else {
        await plansAPI.create(formData);
      }
      handleCloseModal();
      loadPlans();
      toast.success(editingPlan ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error(error.response?.data?.error || 'Erro ao guardar plano. Verifique os dados introduzidos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (await confirm({
      title: 'Apagar Plano?',
      message: 'Tem a certeza que deseja apagar este plano permanentemente?',
      confirmText: 'Apagar',
      variant: 'danger'
    })) {
    try {
      await plansAPI.delete(id);
      loadPlans();
      toast.success('Plano eliminado com sucesso!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao apagar plano.';
      toast.error(errorMessage);
    }
  }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Planos de Membros</h1>
          <p className="text-gray-500 dark:text-dark-300 dark:text-dark-400 mt-1">Gerir os pacotes de subscrição do ginásio</p>
        </div>
        {userRole === 'ADMIN' && (
          <button 
            onClick={() => handleOpenModal()} 
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5" />
            Novo Plano
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-white/50 dark:bg-dark-900/40 rounded-3xl border border-dashed border-gray-300 dark:border-dark-700">
          <p className="text-gray-500 dark:text-dark-300 dark:text-dark-400">Não existem planos criados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.id}
              plan={plan}
              onEdit={userRole === 'ADMIN' ? () => handleOpenModal(plan) : null}
              onDelete={userRole === 'ADMIN' ? handleDelete : null}
            />
          ))}
        </div>
      )}

      {/* Plan Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-md animate-fade-in" onClick={handleCloseModal} />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-white/20 dark:border-dark-700/50">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
                  {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                </h2>
                <p className="text-dark-400 dark:text-dark-300 font-medium mt-1">Configure os detalhes do pacote de subscrição.</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-3 rounded-2xl bg-dark-100 dark:bg-dark-800 text-dark-500 dark:text-dark-200 hover:scale-110 transition-transform"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="label">Nome do Plano *</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400 dark:text-dark-300 group-focus-within:text-primary-500 transition-colors">
                        <CreditCardIcon className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input pl-11"
                        placeholder="Ex: Plano Mensal VIP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Preço (MZN) *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400 dark:text-dark-300 group-focus-within:text-primary-500 transition-colors">
                          <BanknotesIcon className="h-5 w-5" />
                        </div>
                        <input
                          type="number"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="input pl-11"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Duração (Dias) *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400 dark:text-dark-300 group-focus-within:text-primary-500 transition-colors">
                          <CalendarDaysIcon className="h-5 w-5" />
                        </div>
                        <input
                          type="number"
                          required
                          value={formData.durationDays}
                          onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                          className="input pl-11"
                          placeholder="30"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label">Descrição</label>
                    <div className="relative group">
                      <div className="absolute top-4 left-0 pl-4 flex pointer-events-none text-dark-400 dark:text-dark-300 group-focus-within:text-primary-500 transition-colors">
                        <DocumentTextIcon className="h-5 w-5" />
                      </div>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input pl-11 pt-3 min-h-[100px] resize-none"
                        placeholder="Detalhes sobre o que o plano oferece..."
                      />
                    </div>
                  </div>

                  {editingPlan && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-800/50 rounded-2xl border border-gray-100 dark:border-dark-700/50">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-dark-900 dark:text-white">Estado do Plano</p>
                        <p className="text-xs text-dark-400 dark:text-dark-300">Planos inativos não podem ser atribuídos a novos membros.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: !formData.status })}
                        className={`w-14 h-8 rounded-full transition-all relative ${formData.status ? 'bg-green-500' : 'bg-dark-600'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.status ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    editingPlan ? 'Guardar Alterações' : 'Criar Plano'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
