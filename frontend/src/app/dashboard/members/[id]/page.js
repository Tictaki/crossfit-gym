'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { membersAPI, plansAPI, paymentsAPI, UPLOAD_URL } from '@/lib/api';
import PlanCard from '@/components/dashboard/PlanCard';
import {
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  QrCodeIcon,
  BanknotesIcon,
  PrinterIcon,
  ShareIcon,
  EyeIcon,
  DocumentMagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmModalContext';

export const runtime = 'edge';

export default function MemberDetailsPage({ params }) {
  const toast = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const { id } = params;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  useEffect(() => {
    loadMember();
    loadPlans();
  }, [id]);

  const loadMember = async () => {
    try {
      const response = await membersAPI.get(id);
      setMember(response.data);
    } catch (err) {
      console.error('Error loading member:', err);
      setError('Erro ao carregar os dados do membro.');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await plansAPI.list();
      setPlans(response.data);
    } catch (err) {
      console.error('Error loading plans:', err);
    }
  };

  const handleSuspend = async () => {
    if (await confirm({
      title: 'Suspender Membro?',
      message: 'Tem a certeza que deseja suspender este membro? O acesso será bloqueado.',
      confirmText: 'Suspender',
      variant: 'warning'
    })) {
    try {
      await membersAPI.suspend(id);
      loadMember(); // Reload to update status
      toast.success('Membro suspenso com sucesso!');
    } catch (err) {
      toast.error('Erro ao suspender membro');
    }
  }
  };

  const handleActivate = async () => {
    if (await confirm({
      title: 'Reativar Membro?',
      message: 'Deseja reativar este membro? O acesso será restaurado imediatamente.',
      confirmText: 'Reativar',
      variant: 'info'
    })) {
    try {
      await membersAPI.activate(id);
      loadMember(); // Reload to update status
      toast.success('Membro reativado com sucesso!');
    } catch (err) {
      toast.error('Erro ao reativar membro');
    }
  }
  };

  const handleAssignPlan = async () => {
    if (!selectedPlan) return;
    
    setIsSubmitting(true);
    try {
      await paymentsAPI.create({
        memberId: id,
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        paymentMethod
      });
      
      setIsModalOpen(false);
      setSelectedPlan(null);
      loadMember(); // Refresh member data
      toast.success('Plano atribuído com sucesso!');
    } catch (err) {
      console.error('Error assigning plan:', err);
      toast.error(err.response?.data?.error || 'Erro ao atribuir plano');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = (paymentId) => {
    // Get token from localStorage and add to URL for iframe authentication
    const token = localStorage.getItem('token');
    const pdfUrl = `${UPLOAD_URL}/api/payments/${paymentId}/receipt?token=${token}`;
    
    console.log('Opening Invoice URL:', pdfUrl);
    window.open(pdfUrl, '_blank');
  };
  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">{error || 'Membro não encontrado'}</p>
        <Link href="/dashboard/members" className="text-primary-600 hover:underline mt-4 inline-block">
          Voltar para Lista
        </Link>
      </div>
    );
  }

  const statusColors = {
    ACTIVE: 'text-green-600 bg-green-100 border-green-200',
    INACTIVE: 'text-red-600 bg-red-100 border-red-200',
    SUSPENDED: 'text-yellow-600 bg-yellow-100 border-yellow-200',
  };

  const statusLabels = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    SUSPENDED: 'Suspenso',
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/members" className="p-2 rounded-full hover:bg-white/50 transition-colors">
            <ArrowLeftIcon className="h-6 w-6 text-dark-500 dark:text-dark-200" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
              {member.name}
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${statusColors[member.status] || 'text-gray-600 bg-gray-100'}`}>
                {statusLabels[member.status] || member.status}
              </span>
            </h1>
            <p className="text-gray-500 dark:text-dark-300 dark:text-dark-400 mt-1 flex items-center gap-2">
              <PhoneIcon className="h-4 w-4" /> {member.phone}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()} 
            className="btn-secondary"
          >
            <QrCodeIcon className="h-5 w-5" />
            QR Code
          </button>
          <Link href={`/dashboard/members/${id}/edit`} className="btn-secondary text-blue-600 hover:bg-blue-50 border-blue-100">
            <PencilSquareIcon className="h-5 w-5" />
            Editar
          </Link>
          {member.status === 'SUSPENDED' ? (
            <button onClick={handleActivate} className="btn-secondary text-green-600 hover:bg-green-50 border-green-100">
              <CheckCircleIcon className="h-5 w-5" />
              Reativar
            </button>
          ) : (
            <button onClick={handleSuspend} className="btn-secondary text-yellow-600 hover:bg-yellow-50 border-yellow-100">
              <NoSymbolIcon className="h-5 w-5" />
              Suspender
            </button>
          )}
          <button 
            onClick={async () => {
              if (await confirm({
                title: 'Eliminar Membro?',
                message: 'Tem a certeza que deseja eliminar este membro permanentemente? Esta ação não pode ser desfeita.',
                confirmText: 'Eliminar',
                variant: 'danger'
              })) {
                try {
                  await membersAPI.delete(id);
                  toast.success('Membro eliminado com sucesso');
                  router.push('/dashboard/members');
                } catch (err) {
                  toast.error('Erro ao eliminar membro');
                }
              }
            }}
            className="btn-secondary text-red-600 hover:bg-red-50 border-red-100"
          >
            <TrashIcon className="h-5 w-5" />
            Apagar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Plan */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="card-glass overflow-hidden">
            <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-primary-500/5 to-transparent">
              <div className="h-40 w-40 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-6xl font-bold mb-4 shadow-2xl shadow-primary-500/20 border-4 border-white dark:border-dark-700 overflow-hidden relative">
                {member.photo ? (
                  <img 
                    src={`${UPLOAD_URL}${member.photo}`} 
                    alt={member.name} 
                    className="h-full w-full object-cover" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span class="flex items-center justify-center w-full h-full">${member.name.charAt(0)}</span>`;
                    }}
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full">{member.name.charAt(0)}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">{member.name}</h2>
              <p className="text-gray-500 dark:text-dark-300 dark:text-dark-300">{member.email || 'Sem email registado'}</p>
            </div>
            
            <div className="p-6 pt-0 space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-white/10 dark:border-dark-700/50 pb-3">
                <span className="text-dark-400 dark:text-dark-300 dark:text-dark-300">Género</span>
                <span className="font-bold text-dark-700 dark:text-dark-300">{member.gender === 'M' ? 'Masculino' : member.gender === 'F' ? 'Feminino' : 'MALE' ? 'Masculino' : 'FEMALE' ? 'Feminino' : member.gender}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 dark:border-dark-700/50 pb-3">
                <span className="text-dark-400 dark:text-dark-300 dark:text-dark-300">Nascimento</span>
                <span className="font-bold text-dark-700 dark:text-dark-300">
                  {member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-PT') : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400 dark:text-dark-300 dark:text-dark-300">Membro desde</span>
                <span className="font-bold text-dark-700 dark:text-dark-300">
                  {new Date(member.createdAt).toLocaleDateString('pt-PT')}
                </span>
              </div>
            </div>
          </div>

          {/* Plan Status Card */}
          <div className="card-glass bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white border-none shadow-glow-sm overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,7,7,0.15),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10 p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-primary-500">
                <CreditCardIcon className="h-5 w-5" />
                Plano Atual
              </h3>
              
              {member.plan ? (
                <>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-3xl font-bold tracking-tight">{member.plan.name}</span>
                    <span className="text-primary-500 font-bold mb-1">{member.plan.price?.toLocaleString()} MZN</span>
                  </div>
                  
                  <div className="space-y-6 mt-8">
                    <div>
                      <div className="flex justify-between text-[10px] mb-2 text-dark-400 dark:text-dark-300 dark:text-dark-300 uppercase font-bold tracking-widest">
                        <span>Validade do Plano</span>
                        <span className="text-white">{new Date(member.expirationDate).toLocaleDateString('pt-PT')}</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full rounded-full shadow-glow-sm" 
                          style={{ width: '60%' }} // Placeholder logic
                        ></div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all duration-300 shadow-lg shadow-primary-900/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                      Renovar Plano
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                    <CreditCardIcon className="h-8 w-8 text-dark-400 dark:text-dark-300 dark:text-dark-300" />
                  </div>
                  <p className="text-dark-400 dark:text-dark-300 dark:text-dark-300 font-medium mb-6">Nenhum plano ativo encontrado</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-4 bg-white text-dark-900 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all duration-300 hover:bg-primary-500 hover:text-white"
                  >
                    Atribuir Plano
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Check-ins History */}
          <div className="card-glass p-0">
            <div className="p-6 border-b border-white/10 dark:border-dark-700/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-primary-500" />
                Histórico de Presenças
              </h3>
            </div>
            
            <div className="p-6">
              {member.checkins && member.checkins.length > 0 ? (
                <div className="space-y-4">
                  {member.checkins.slice(0, 5).map((checkin) => (
                    <div key={checkin.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/30 dark:bg-dark-800/20 border border-white/20 dark:border-dark-700/50 hover:bg-white/50 dark:hover:bg-dark-800/40 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 text-green-500 rounded-xl group-hover:scale-110 transition-transform">
                          <CheckCircleIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-dark-900 dark:text-white">Check-in Realizado</p>
                          <p className="text-xs text-dark-400 dark:text-dark-300 mt-0.5 font-medium uppercase tracking-wider">Acesso: {checkin.method || 'Biometria'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-dark-500 dark:text-dark-200 dark:text-dark-400 bg-white/50 dark:bg-dark-900/50 px-3 py-1.5 rounded-lg border border-white/50 dark:border-dark-700/50 shadow-sm">
                        {new Date(checkin.checkinDatetime).toLocaleString('pt-PT')}
                      </span>
                    </div>
                  ))}
                  {member.checkins.length > 5 && (
                    <button className="w-full text-center text-xs text-primary-500 font-bold uppercase tracking-widest hover:text-primary-400 py-3 mt-2">
                      Ver tudo o histórico
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/10 dark:bg-dark-800/10 rounded-3xl border border-dashed border-white/20 dark:border-dark-700/50">
                  <p className="text-dark-400 dark:text-dark-300 font-medium">Sem registos de presença</p>
                </div>
              )}
            </div>
          </div>

          {/* Payments History */}
          <div className="card-glass p-0 overflow-hidden">
            <div className="p-6 border-b border-white/10 dark:border-dark-700/50">
              <h3 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-green-500" />
                Histórico de Pagamentos
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              {member.payments && member.payments.length > 0 ? (
                <table className="table text-left">
                  <thead className="bg-white/30 dark:bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Plano</th>
                      <th className="px-6 py-4 text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Valor</th>
                      <th className="px-6 py-4 text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Método</th>
                      <th className="px-6 py-4 text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 dark:divide-dark-800/50">
                    {member.payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-white/20 dark:hover:bg-dark-800/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-dark-700 dark:text-dark-300">
                          {new Date(payment.paymentDate).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-dark-500 dark:text-dark-200 dark:text-dark-400">{payment.plan?.name}</td>
                        <td className="px-6 py-4 font-bold text-dark-900 dark:text-white">
                          {payment.amount?.toLocaleString()} MZN
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-tighter px-2.5 py-1 bg-white/50 dark:bg-dark-800/50 rounded-lg border border-white/50 dark:border-dark-700/50 text-dark-500 dark:text-dark-200">
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const token = localStorage.getItem('token');
                                const pdfUrl = `${UPLOAD_URL}/api/payments/${payment.id}/receipt?token=${token}`;
                                const message = `Olá *${member.name}*! 💪\n\nAqui está o recibo do seu pagamento na *Crosstraining Gym*. Obrigado pela preferência e bons treinos! 🏋️‍♀️\n\n📄 *Aceda à sua fatura aqui:*\n${pdfUrl}`;
                                const phone = member.phone.replace(/[^0-9]/g, '');
                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              className="p-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all group"
                              title="Partilhar WhatsApp"
                            >
                              <ShareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDownloadInvoice(payment.id);
                              }}
                              className="p-2 rounded-xl bg-primary-500/10 text-primary-600 hover:bg-primary-500 hover:text-white transition-all group"
                              title="Ver Fatura"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-dark-400 dark:text-dark-300 font-medium">
                  <p>Sem registos de pagamento</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-md animate-fade-in" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-white/20 dark:border-dark-700/50">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Atribuir Novo Plano</h2>
                <p className="text-dark-400 dark:text-dark-300 font-medium mt-1">Selecione um plano para {member.name}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 rounded-2xl bg-dark-100 dark:bg-dark-800 text-dark-500 dark:text-dark-200 hover:scale-110 transition-transform"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Plan Selection */}
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin">
                <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-[0.2em] px-2">Disponíveis</label>
                <div className="grid grid-cols-1 gap-3">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      mode="select"
                      isSelected={selectedPlan?.id === plan.id}
                      onSelect={setSelectedPlan}
                    />
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-[0.2em] px-2">Método de Pagamento</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Dinheiro', value: 'CASH' },
                    { label: 'M-Pesa', value: 'MPESA' },
                    { label: 'E-mola', value: 'EMOLA' },
                    { label: 'Transferência', value: 'TRANSFER' }
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`py-3.5 rounded-2xl border-2 transition-all duration-300 text-[10px] font-bold uppercase tracking-widest ${
                        paymentMethod === method.value 
                          ? 'bg-dark-900 dark:bg-white border-dark-900 dark:border-white text-white dark:text-dark-900' 
                          : 'border-white/10 dark:border-dark-800 text-dark-400 dark:text-dark-300 hover:border-white/30 dark:hover:border-dark-700'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action */}
              <button 
                disabled={!selectedPlan || isSubmitting}
                onClick={handleAssignPlan}
                className="w-full py-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:scale-100 text-white rounded-[2rem] font-bold uppercase tracking-[0.2em] text-sm transition-all duration-300 shadow-glow hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mt-4"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <BanknotesIcon className="h-5 w-5" />
                    Confirmar Pagamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}


