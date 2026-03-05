'use client';

import { useState, useEffect, useRef, useDeferredValue } from 'react';
import { paymentsAPI, UPLOAD_URL } from '@/lib/api';
import { useDebounce, formatCurrency } from '@/lib/utils';
import { 
  BanknotesIcon, 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  MagnifyingGlassIcon, 
  CalendarIcon, 
  ArrowDownTrayIcon,
  ShareIcon,
  EyeIcon,
  FunnelIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

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

  const deferredMemberId = useDeferredValue(memberId);
  const debouncedMemberId = useDebounce(deferredMemberId, 500);

  useEffect(() => {
    loadData();
  }, [debouncedMemberId, startDate, endDate, paymentMethod]);

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
        paymentsAPI.list({ memberId: debouncedMemberId, startDate, endDate, paymentMethod }),
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

  /* Removed local formatCurrency to use shared utility */

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">Pagamentos</h1>
          <p className="text-dark-500 dark:text-dark-300 mt-1 text-sm md:text-base">Relatórios financeiros</p>
        </div>
        <button 
          onClick={handleExportExcel}
          className="btn-secondary !py-2.5 !px-4 md:!py-3 md:!px-6 group active:scale-95"
        >
          <ArrowDownTrayIcon className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-sm">Exportar Excel</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        <div className="stat-card group !p-4 md:!p-6">
          <div className="flex md:items-start justify-between gap-2">
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">Receita Hoje</p>
              <h3 className="text-lg md:text-2xl font-bold text-dark-900 dark:text-white mt-1">{formatCurrency(dailyStats?.total)}</h3>
              <p className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-bold mt-1">+{dailyStats?.count || 0} transaç.</p>
            </div>
            <div className="stat-card-icon h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3 shrink-0">
              <BanknotesIcon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>
        </div>

        <div className="stat-card group !p-4 md:!p-6">
          <div className="flex md:items-start justify-between gap-2">
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">Mês Actual</p>
              <h3 className="text-lg md:text-2xl font-bold text-dark-900 dark:text-white mt-1">{formatCurrency(monthlyStats?.total)}</h3>
              <p className="text-[10px] md:text-xs text-dark-400 dark:text-dark-300 mt-1">{monthlyStats?.count || 0} transaç.</p>
            </div>
            <div className="stat-card-icon h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3 bg-blue-500 shadow-blue-500/30 shrink-0">
              <CurrencyDollarIcon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>
        </div>

        <div className="stat-card group !p-4 md:!p-6 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex md:items-start justify-between gap-2">
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">Ticket Médio</p>
              <h3 className="text-lg md:text-2xl font-bold text-dark-900 dark:text-white mt-1">
                {formatCurrency(monthlyStats?.total / Math.max(1, monthlyStats?.count))}
              </h3>
              <p className="text-[10px] md:text-xs text-dark-400 dark:text-dark-300 mt-1">Média mensal</p>
            </div>
            <div className="stat-card-icon h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3 bg-purple-500 shadow-purple-500/30 shrink-0">
              <CreditCardIcon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-glass !p-4 md:!p-6 relative z-30">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar por membro..." 
              className="input pl-11 bg-white/50 dark:bg-dark-800/50 text-sm h-11 rounded-2xl border-none focus:ring-2 focus:ring-primary-500/30"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 flex-[2]">
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300 pointer-events-none" />
              <input 
                type="date" 
                className="input pl-11 text-sm bg-white/50 dark:bg-dark-800/50 h-11 rounded-2xl border-none w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300 pointer-events-none" />
              <input 
                type="date" 
                className="input pl-11 text-sm bg-white/50 dark:bg-dark-800/50 h-11 rounded-2xl border-none w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {/* Custom Glassy Dropdown for Payment Methods */}
            <div className="relative" id="payment-method-dropdown" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="input text-xs sm:text-sm bg-white/50 dark:bg-dark-800/50 flex items-center justify-between group h-11 rounded-2xl border-none w-full active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4 text-dark-300" />
                  <span className={paymentMethod ? 'text-dark-900 dark:text-white font-bold' : 'text-dark-300'}>
                    {paymentMethod ? paymentMethod : 'Método'}
                  </span>
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-dark-300 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 dropdown-glass z-50 animate-fade-in overflow-hidden shadow-glass-premium">
                  <div className="p-1 max-h-60 overflow-y-auto no-scrollbar">
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
                        className={`w-full text-left px-4 py-3 text-xs sm:text-sm rounded-xl transition-all duration-200 ${
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
              className="btn-secondary !p-0 h-11 flex items-center justify-center rounded-2xl border-none bg-dark-500/10 text-dark-600 dark:text-dark-300 active:scale-95 group sm:col-span-2 lg:col-span-1"
            >
              <span className="text-xs font-bold group-hover:scale-110 transition-transform">Limpar Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card-glass p-0 overflow-hidden relative border-none sm:border-solid">
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
                    <td colSpan="6" className="text-center py-12 text-gray-500 dark:text-dark-300">
                      Nenhum pagamento encontrado para os filtros selecionados
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="group hover:bg-white/40 dark:hover:bg-dark-700/30 transition-all duration-300">
                      <td className="px-6 py-4" data-label="Membro">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <p className="font-bold text-dark-900 dark:text-white leading-tight">{payment.member?.name}</p>
                            <span className="text-[10px] text-dark-400 font-bold uppercase tracking-tighter bg-secondary-100 dark:bg-dark-800 px-1.5 py-0.5 rounded-md w-fit mt-0.5">{payment.member?.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4" data-label="Plano">
                        <span className="text-xs font-bold px-2 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg">{payment.plan?.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right" data-label="Valor">
                        <span className="text-sm md:text-base font-bold text-dark-900 dark:text-white">{formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="px-6 py-4 text-dark-600 dark:text-dark-200" data-label="Data">
                        <div className="flex flex-col items-end sm:items-start">
                          <span className="text-xs font-bold">{format(new Date(payment.paymentDate), 'dd/MM/yyyy', { locale: pt })}</span>
                          <span className="text-[10px] opacity-60 uppercase">{format(new Date(payment.paymentDate), 'HH:mm', { locale: pt })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4" data-label="Método">
                        <span className="text-[10px] px-2.5 py-1 bg-white/50 dark:bg-dark-800/50 text-dark-600 dark:text-dark-200 rounded-lg font-bold border border-white/40 dark:border-dark-700/50 uppercase tracking-tighter shrink-0">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center" data-label="Ações">
                        <div className="flex items-center justify-center gap-4 sm:gap-2">
                          <button
                            onClick={() => {
                              const token = localStorage.getItem('token');
                              const pdfUrl = `${UPLOAD_URL}/api/payments/${payment.id}/receipt?token=${token}`;
                              const message = `Olá *${payment.member?.name}*! 💪\n\nAqui está o recibo do seu pagamento na *Crosstraining Gym*. Obrigado pela preferência e bons treinos! 🏋️‍♀️\n\n📄 *Aceda à sua fatura aqui:*\n${pdfUrl}`;
                              const phone = (payment.member?.phone || '').replace(/[^0-9]/g, '');
                              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="flex items-center justify-center p-3 sm:p-2 bg-green-500 text-white rounded-2xl sm:bg-green-500/10 sm:text-green-600 sm:hover:bg-green-500 sm:hover:text-white transition-all shadow-md sm:shadow-sm active:scale-90"
                            title="Partilhar WhatsApp"
                          >
                            <ShareIcon className="h-6 w-6 sm:h-5 sm:w-5" />
                          </button>
                          <button 
                            onClick={() => handleDownloadReceipt(payment)}
                            className="flex items-center justify-center p-3 sm:p-2 bg-primary-500 text-white rounded-2xl sm:bg-primary-500/10 sm:text-primary-600 sm:hover:bg-primary-500 sm:hover:text-white transition-all shadow-md sm:shadow-sm active:scale-90"
                            title="Ver Fatura"
                          >
                            <EyeIcon className="h-6 w-6 sm:h-5 sm:w-5" />
                          </button>
                        </div>
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
