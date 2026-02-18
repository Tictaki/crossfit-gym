'use client';

import { useEffect, useState } from 'react';
import { reportsAPI, UPLOAD_URL } from '@/lib/api';
import { 
  ExclamationTriangleIcon, 
  ChatBubbleLeftRightIcon, 
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  UserIcon,
  CalendarDaysIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DefaultersPage() {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDefaulters();
  }, []);

  const loadDefaulters = async () => {
    try {
      const response = await reportsAPI.defaulters();
      setDefaulters(response.data);
    } catch (error) {
      console.error('Error loading defaulters:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysOverdue = (expirationDate) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = Math.abs(today - expDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalOverdueRevenue = () => {
    return defaulters.reduce((acc, curr) => acc + (curr.plan?.price || 0), 0);
  };

  const sendWhatsAppMessage = (member) => {
    const message = `Olá *${member.name.split(' ')[0]}*! 💪\n\nAqui é da *Crosstraining Gym*. 🏋️‍♂️\n\nNotamos que o seu plano (*${member.plan?.name}*) expirou há *${getDaysOverdue(member.expirationDate)} dias*. ⚠️\n\nPara continuar a treinar connosco e manter o seu foco, por favor passe pela recepção para regularizar a sua situação. 🚀\n\nEstamos à sua espera! 👊`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white leading-tight">Gestão de Inadimplentes</h1>
        <p className="text-dark-500 dark:text-dark-300 mt-1 text-sm font-medium">Membros com planos expirados e pagamentos pendentes.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-card-title text-dark-400 dark:text-dark-300">Total Inadimplentes</p>
              <p className="stat-card-value text-red-600">{defaulters.length}</p>
            </div>
            <div className="stat-card-icon from-red-500 to-red-600 shadow-red-500/30">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-card-title text-dark-400 dark:text-dark-300">Receita Retida (Est.)</p>
              <p className="stat-card-value text-primary-600">
                {calculateTotalOverdueRevenue().toLocaleString('pt-PT', { minimumFractionDigits: 2 })} <span className="text-sm text-dark-400 dark:text-dark-300 font-normal">MZN</span>
              </p>
            </div>
            <div className="stat-card-icon from-blue-500 to-blue-600 shadow-blue-500/30">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Defaulters Table */}
      <div className="card-glass p-0 overflow-hidden">
        <div className="p-6 pb-2 flex items-center justify-between mb-2">
           <h3 className="text-xl font-bold text-dark-900 dark:text-white">Lista de Inadimplentes</h3>
           <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 border border-red-500/20">{defaulters.length} pendentes</span>
        </div>

        <div className="table-container border-none shadow-none bg-transparent">
          {defaulters.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-bold text-dark-900 dark:text-white">Sem dívidas pendentes!</h4>
              <p className="text-dark-500 dark:text-dark-300 font-medium">Excelente! Atualmente não existem membros com planos expirados.</p>
            </div>
          ) : (
          <div className="table-container pt-4">
            <table className="table min-w-full table-responsive-cards">
              <thead className="bg-dark-900 dark:bg-black">
                <tr>
                  <th className="text-white py-5 pl-8 rounded-tl-3xl">Membro</th>
                  <th className="text-white py-5">Plano</th>
                  <th className="text-white py-5">Vencimento</th>
                  <th className="text-white py-5">Atraso</th>
                  <th className="text-white py-5 pr-8 text-right rounded-tr-3xl">Ações</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map((member) => (
                  <tr key={member.id} className="hover:bg-white/20 dark:hover:bg-dark-800/10 transition-colors">
                    <td className="py-4 pl-8" data-label="Membro">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full flex-shrink-0 bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-glow-sm mr-3 border-2 border-white dark:border-dark-800">
                          {member.photo ? (
                            <img src={`${UPLOAD_URL}${member.photo}`} alt={member.name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            member.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-dark-900 dark:text-white leading-tight">{member.name}</p>
                          <p className="text-[10px] text-dark-400 font-bold uppercase tracking-tighter">{member.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4" data-label="Plano">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-dark-800 dark:text-dark-200">{member.plan?.name}</span>
                        <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">{member.plan?.price?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN</span>
                      </div>
                    </td>
                    <td className="py-4" data-label="Vencimento">
                      <div className="flex items-center gap-2 text-dark-700 dark:text-dark-300 font-bold text-sm">
                        <CalendarDaysIcon className="h-4 w-4 text-red-500" />
                        {new Date(member.expirationDate).toLocaleDateString('pt-PT')}
                      </div>
                    </td>
                    <td className="py-4" data-label="Atraso">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 border border-red-500/20 shadow-sm shadow-red-500/5">
                        {getDaysOverdue(member.expirationDate)} dias
                      </span>
                    </td>
                    <td className="py-4 pr-8 text-right" data-label="Ações">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => sendWhatsAppMessage(member)}
                          className="p-2 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-sm group/btn"
                          title="Enviar Cobrança WhatsApp"
                        >
                          <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        </button>
                        <Link 
                          href={`/dashboard/members/${member.id}`}
                          className="p-2 bg-primary-500/10 text-primary-600 hover:bg-primary-500 hover:text-white rounded-xl transition-all shadow-sm"
                          title="Ver Perfil"
                        >
                          <UserIcon className="h-5 w-5" />
                        </Link>
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

      {/* Helpful Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
          <h4 className="flex items-center gap-2 text-blue-800 dark:text-blue-400 font-bold mb-3">
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            Estratégia de Recuperação
          </h4>
          <ul className="space-y-2 text-sm text-blue-700/80 dark:text-blue-400/80">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
              Utilize o botão de WhatsApp para enviar lembretes personalizados.
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
              Ofereça descontos ou isenção de taxa de reinscrição para membros ausentes há mais de 30 dias.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
