'use client';

import { useEffect, useState, useRef } from 'react';
import { paymentsAPI } from '@/lib/api';
import { 
  BanknotesIcon, 
  ArrowDownTrayIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ChevronDownIcon,
  ShareIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { UPLOAD_URL } from '@/lib/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  
  // Filters
  const [memberId, setMemberId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');


  useEffect(() => {
    loadData();
  }, [memberId, startDate, endDate, paymentMethod]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, dailyRes, monthlyRes] = await Promise.all([
        paymentsAPI.list({ memberId, startDate, endDate, paymentMethod }),
        paymentsAPI.dailyReport(),
        paymentsAPI.monthlyReport()
      ]);

      setPayments(paymentsRes.data.payments || []);
      setDailyStats(dailyRes.data.summary);
      setMonthlyStats(monthlyRes.data.summary);
    } catch (error) {
      console.error('Error loading payments data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (payment) => {
    const token = localStorage.getItem('token');
    const pdfUrl = `${UPLOAD_URL}/api/payments/${payment.id}/receipt?token=${token}`;
    window.open(pdfUrl, '_blank');
  };


  const handleExportExcel = async () => {
    try {
      const response = await paymentsAPI.export({ startDate, endDate });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pagamentos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting payments:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(value || 0);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Pagamentos</h1>
          <p className="text-gray-500 dark:text-dark-300 dark:text-dark-400 mt-1">Histórico de transações e relatórios financeiros</p>
        </div>
        <button 
          onClick={handleExportExcel}
          className="btn-secondary"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Exportar Excel
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="stat-card group p-4 md:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-3 md:gap-4 relative z-10">
            <div className="stat-card-icon h-10 w-10 md:h-12 md:w-12">
              <BanknotesIcon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-dark-500 dark:text-dark-200 dark:text-dark-400 uppercase tracking-wider">Receita Hoje</p>
              <h3 className="text-xl md:text-2xl font-bold text-dark-900 dark:text-white">{formatCurrency(dailyStats?.total)}</h3>
              <p className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-bold mt-1">+{dailyStats?.count || 0} transações</p>
            </div>
          </div>
        </div>

        <div className="stat-card group p-4 md:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-3 md:gap-4 relative z-10">
            <div className="stat-card-icon h-10 w-10 md:h-12 md:w-12 bg-blue-500 shadow-blue-500/30">
              <CurrencyDollarIcon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-dark-500 dark:text-dark-200 dark:text-dark-400 uppercase tracking-wider">Mês Actual</p>
              <h3 className="text-xl md:text-2xl font-bold text-dark-900 dark:text-white">{formatCurrency(monthlyStats?.total)}</h3>
              <p className="text-[10px] md:text-xs text-dark-400 dark:text-dark-300 mt-1">{monthlyStats?.count || 0} transações</p>
            </div>
          </div>
        </div>

        <div className="stat-card group p-4 md:p-6 sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-3 md:gap-4 relative z-10">
            <div className="stat-card-icon h-10 w-10 md:h-12 md:w-12 bg-purple-500 shadow-purple-500/30">
              <CreditCardIcon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-dark-500 dark:text-dark-200 dark:text-dark-300 uppercase tracking-wider">Ticket Médio</p>
              <h3 className="text-xl md:text-2xl font-bold text-dark-900 dark:text-white">
                {formatCurrency(monthlyStats?.total / Math.max(1, monthlyStats?.count))}
              </h3>
              <p className="text-[10px] md:text-xs text-dark-300 mt-1">Estimativa mensal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-glass p-4 md:p-6 relative z-30">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300" />
            <input 
              type="text" 
              placeholder="Pesquisar por membro..." 
              className="input pl-12 bg-white/50 dark:bg-dark-800/50 text-sm h-11"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300 pointer-events-none" />
              <input 
                type="date" 
                className="input pl-12 text-sm bg-white/50 dark:bg-dark-800/50 h-11"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300 pointer-events-none" />
              <input 
                type="date" 
                className="input pl-12 text-sm bg-white/50 dark:bg-dark-800/50 h-11"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {/* Custom Glassy Dropdown for Payment Methods */}
            <div className="relative" id="payment-method-dropdown" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="input text-sm bg-white/50 dark:bg-dark-800/50 flex items-center justify-between group h-11"
              >
                <span className={paymentMethod ? 'text-dark-900 dark:text-white' : 'text-dark-300'}>
                  {paymentMethod ? paymentMethod.charAt(0) + paymentMethod.slice(1).toLowerCase() : 'Todos Métodos'}
                </span>
                <ChevronDownIcon className={`h-4 w-4 text-dark-300 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 dropdown-glass z-50 animate-fade-in overflow-hidden">
                  <div className="p-1">
                    {[
                      { label: 'Todos Métodos', value: '' },
                      { label: 'Dinheiro', value: 'CASH' },
                      { label: 'M-Pesa', value: 'MPESA' },
                      { label: 'E-mola', value: 'EMOLA' },
                      { label: 'M-Kesh', value: 'MKESH' },
                      { label: 'Conta Móvel', value: 'CONTAMOVEL' },
                      { label: 'POS/Cartão', value: 'POS' },
                      { label: 'Transferência', value: 'TRANSFER' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPaymentMethod(option.value);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm rounded-xl transition-all duration-200 ${
                          paymentMethod === option.value 
                            ? 'bg-primary-500 text-white font-bold' 
                            : 'text-dark-600 dark:text-dark-300 hover:bg-white/40 dark:hover:bg-dark-700/40'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setMemberId('');
                setStartDate('');
                setEndDate('');
                setPaymentMethod('');
              }}
              className="btn-secondary text-sm md:btn-ghost h-11 justify-center"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card-glass p-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-white/5 dark:bg-dark-900/5 pointer-events-none" />
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10 table-container">
            <table className="table min-w-full table-responsive-cards">
              <thead>
                <tr className="bg-white/30 dark:bg-white/5 border-b border-white/20 dark:border-dark-700/50">
                  <th className="px-6 py-4">Membro</th>
                  <th className="px-6 py-4">Plano</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Método</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-dark-800/50">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500 dark:text-dark-300 dark:text-dark-300">
                      Nenhum pagamento encontrado para os filtros selecionados
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="group hover:bg-white/40 dark:hover:bg-dark-700/30 transition-all duration-300">
                      <td className="px-6 py-4" data-label="Membro">
                        <p className="font-bold text-dark-900 dark:text-white leading-tight">{payment.member?.name}</p>
                        <p className="text-[10px] text-dark-400 font-bold uppercase tracking-tighter">{payment.member?.phone}</p>
                      </td>
                      <td className="px-6 py-4 text-dark-700 dark:text-dark-300" data-label="Plano">
                        <span className="text-xs font-medium">{payment.plan?.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-dark-900 dark:text-white" data-label="Valor">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-dark-600 dark:text-dark-200" data-label="Data">
                        <span className="text-xs">{format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm', { locale: pt })}</span>
                      </td>
                      <td className="px-6 py-4" data-label="Método">
                        <span className="text-[10px] px-2.5 py-1 bg-white/50 dark:bg-dark-800/50 text-dark-600 dark:text-dark-200 rounded-lg font-bold border border-white/40 dark:border-dark-700/50 uppercase tracking-tighter">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center" data-label="Ações">
                          <button
                            onClick={() => {
                              const token = localStorage.getItem('token');
                              const pdfUrl = `${UPLOAD_URL}/api/payments/${payment.id}/receipt?token=${token}`;
                              const message = `Olá *${payment.member?.name}*! 💪\n\nAqui está o recibo do seu pagamento na *Crosstraining Gym*. Obrigado pela preferência e bons treinos! 🏋️‍♀️\n\n📄 *Aceda à sua fatura aqui:*\n${pdfUrl}`;
                              const phone = (payment.member?.phone || '').replace(/[^0-9]/g, '');
                              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="p-2 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-sm group"
                            title="Partilhar WhatsApp"
                          >
                            <ShareIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDownloadReceipt(payment)}
                            className="p-2 bg-primary-500/10 text-primary-600 hover:bg-primary-500 hover:text-white rounded-xl transition-all shadow-sm group"
                            title="Ver Fatura"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
