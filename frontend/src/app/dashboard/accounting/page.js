'use client';

import { useEffect, useState } from 'react';
import { accountingAPI, expensesAPI, fixedCostsAPI } from '@/lib/api';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useConfirm } from '@/context/ConfirmModalContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  { value: 'SALARIES', label: 'Salários', color: 'bg-blue-500' },
  { value: 'RENT', label: 'Renda', color: 'bg-indigo-500' },
  { value: 'ELECTRICITY', label: 'Eletricidade', color: 'bg-yellow-500' },
  { value: 'WATER', label: 'Água', color: 'bg-cyan-500' },
  { value: 'EQUIPMENT', label: 'Equipamento', color: 'bg-orange-500' },
  { value: 'MARKETING', label: 'Marketing', color: 'bg-pink-500' },
  { value: 'MAINTENANCE', label: 'Manutenção', color: 'bg-emerald-500' },
  { value: 'TAXES', label: 'Impostos', color: 'bg-red-500' },
  { value: 'OTHER', label: 'Outros', color: 'bg-gray-500' },
];

export default function AccountingPage() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFixedCostModalOpen, setIsFixedCostModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('variable'); // 'variable' or 'fixed'
  
  // Form State
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'OTHER',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceNumber: ''
  });

  const [newFixedCost, setNewFixedCost] = useState({
    description: '',
    amount: '',
    category: 'SALARIES',
    invoiceNumber: '',
    dueDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const { confirm } = useConfirm();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, expensesRes, trendsRes, fixedCostsRes] = await Promise.all([
        accountingAPI.summary(),
        expensesAPI.list(),
        accountingAPI.trends(),
        fixedCostsAPI.list()
      ]);
      setSummary(summaryRes.data);
      setExpenses(expensesRes.data.expenses);
      setTrends(trendsRes.data);
      setFixedCosts(fixedCostsRes.data);
    } catch (err) {
      console.error('Error loading accounting data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await expensesAPI.create({
        ...newExpense,
        category: isCustomCategory ? customCategory : newExpense.category
      });
      setIsModalOpen(false);
      setNewExpense({
        description: '',
        amount: '',
        category: 'OTHER',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        invoiceNumber: ''
      });
      setIsCustomCategory(false);
      setCustomCategory('');
      loadData();
      toast.success('Despesa registada com sucesso!');
    } catch (err) {
      console.error('Error adding expense:', err);
      toast.error('Erro ao registar despesa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFixedCost = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fixedCostsAPI.create(newFixedCost);
      setIsFixedCostModalOpen(false);
      setNewFixedCost({
        description: '',
        amount: '',
        category: 'SALARIES',
        invoiceNumber: '',
        dueDate: ''
      });
      loadData();
      toast.success('Custo fixo registado com sucesso!');
    } catch (err) {
      console.error('Error adding fixed cost:', err);
      toast.error('Erro ao registar custo fixo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (await confirm({
      title: 'Apagar Despesa?',
      message: 'Tem a certeza que deseja apagar este registo? Esta ação não pode ser desfeita.',
      confirmText: 'Apagar',
      cancelText: 'Cancelar',
      variant: 'danger'
    })) {
      try {
        await expensesAPI.delete(id);
        loadData();
        toast.success('Despesa eliminada com sucesso!');
      } catch (err) {
        console.error('Error deleting expense:', err);
        toast.error('Erro ao apagar despesa');
      }
    }
  };

  const handleDeleteFixedCost = async (id) => {
    if (await confirm({
      title: 'Remover Custo Fixo?',
      message: 'Este custo deixará de ser contabilizado nos meses futuros. Continuar?',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      variant: 'danger'
    })) {
      try {
        await fixedCostsAPI.delete(id);
        loadData();
        toast.success('Custo fixo removido com sucesso!');
      } catch (err) {
        console.error('Error deleting fixed cost:', err);
        toast.error('Erro ao remover custo fixo');
      }
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-2">Accounting</h1>
            <p className="premium-label text-dark-400 tracking-[0.3em]">Financial Intelligence Unit</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => activeTab === 'fixed' ? setIsFixedCostModal(true) : setIsModalOpen(true)}
              className="btn-primary shadow-glow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              {activeTab === 'fixed' ? 'New Fixed Cost' : 'Register Expense'}
            </button>
          </div>
      </div>

      {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Card: Receitas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card-aura p-10 group"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="premium-label opacity-60">Revenue Flux</span>
              <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                <ArrowUpIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="text-premium-display text-5xl mb-2">
              {formatCurrency(financialSummary?.totalRevenue)}
            </div>
            <div className="text-premium-meta opacity-40">Active Billing Cyde</div>
          </motion.div>

          {/* Card: Despesas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-aura p-10 group"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="premium-label opacity-60">Burn Rate</span>
              <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                <ArrowDownIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="text-premium-display text-5xl mb-2 text-red-500">
              {formatCurrency(financialSummary?.totalExpenses + financialSummary?.totalFixedCosts)}
            </div>
            <div className="text-premium-meta opacity-40">Operating Expenses</div>
          </motion.div>

          {/* Card: Balanço */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card-aura p-10 group border-primary-500/20"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="premium-label opacity-60">Net Yield</span>
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <BanknotesIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="text-premium-display text-5xl mb-2 text-blue-400">
              {formatCurrency(financialSummary?.totalRevenue - (financialSummary?.totalExpenses + financialSummary?.totalFixedCosts))}
            </div>
            <div className="text-premium-meta opacity-40 italic">Estimated Net Profit</div>
          </motion.div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses List */}
        <div className="card-glass p-0 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex gap-4 mb-10 p-2 bg-white/5 backdrop-blur-xl rounded-[2.5rem] w-fit border border-white/10">
          <button
            onClick={() => setActiveTab('variable')}
            className={`px-8 py-4 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'variable'
                ? 'bg-primary-500 text-white shadow-glow'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            Variable Costs
          </button>
          <button
            onClick={() => setActiveTab('fixed')}
            className={`px-8 py-4 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'fixed'
                ? 'bg-primary-500 text-white shadow-glow'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            Fixed Costs
          </button>
        </div>
            
            {activeTab === 'fixed' && (
              <button 
                onClick={() => setIsFixedCostModalOpen(true)}
                className="btn-primary py-2 px-4 shadow-glow-sm !text-[10px]"
              >
                <PlusIcon className="h-4 w-4" />
                Novo Custo Fixo
              </button>
            )}
          </div>

          {/* Table Sections */}
        <div className="card-aura p-0 overflow-hidden">
          {activeTab === 'variable' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-8 py-6 text-left premium-label opacity-40">Date</th>
                  <th className="px-8 py-6 text-left premium-label opacity-40">Description</th>
                  <th className="px-8 py-6 text-left premium-label opacity-40">Category</th>
                  <th className="px-8 py-6 text-left premium-label opacity-40">Invoice #</th>
                  <th className="px-8 py-6 text-left premium-label opacity-40">Due Date</th>
                  <th className="px-8 py-6 text-left premium-label opacity-40">Value</th>
                  <th className="px-8 py-6 text-right premium-label opacity-40">Actions</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-white/5">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-xs text-dark-500 dark:text-dark-200" data-label="Data">
                        {new Date(expense.date).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="px-6 py-4 font-bold text-dark-900 dark:text-white" data-label="Descrição">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4" data-label="Categoria">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter text-white ${EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.color || 'bg-gray-500'}`}>
                          {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-dark-500 dark:text-dark-300 text-[10px]" data-label="Fatura">
                        {expense.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-[10px] text-dark-500 dark:text-dark-300" data-label="Prazo">
                        {expense.dueDate ? new Date(expense.dueDate).toLocaleDateString('pt-PT') : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-red-500" data-label="Valor">
                        -{formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4" data-label="Ações">
                        <div className="flex items-center justify-center sm:justify-end">
                          <button 
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="flex items-center justify-center p-3 sm:p-2 text-dark-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl sm:rounded-xl transition-all active:scale-95 bg-dark-50 dark:bg-dark-800/50 sm:bg-transparent"
                          >
                            <TrashIcon className="h-6 w-6 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-dark-500 dark:text-dark-400 font-medium">
                        Nenhuma despesa variável registada.
                      </td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>
          ) : (
            <div className="overflow-x-auto table-container">
              <table className="table min-w-full table-responsive-cards border-none mt-0">
                <thead className="bg-dark-50 dark:bg-dark-800/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Descrição</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Categoria</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Fatura</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Prazo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Valor Mensal</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fixedCosts.map((cost) => (
                    <tr key={cost.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-dark-900 dark:text-white" data-label="Descrição">
                        {cost.description}
                      </td>
                      <td className="px-6 py-4" data-label="Categoria">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter text-white ${EXPENSE_CATEGORIES.find(c => c.value === cost.category)?.color || 'bg-amber-500'}`}>
                          {EXPENSE_CATEGORIES.find(c => c.value === cost.category)?.label || cost.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-dark-500 dark:text-dark-300 text-[10px]" data-label="Fatura">
                        {cost.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-[10px] text-dark-500 dark:text-dark-300" data-label="Prazo">
                        {cost.dueDate ? new Date(cost.dueDate).toLocaleDateString('pt-PT') : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-amber-500" data-label="Valor">
                        -{formatCurrency(cost.amount)}
                      </td>
                      <td className="px-6 py-4" data-label="Ações">
                        <div className="flex items-center justify-center sm:justify-end">
                          <button 
                            onClick={() => handleDeleteFixedCost(cost.id)}
                            className="flex items-center justify-center p-3 sm:p-2 text-dark-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl sm:rounded-xl transition-all active:scale-95 bg-dark-50 dark:bg-dark-800/50 sm:bg-transparent"
                          >
                            <TrashIcon className="h-6 w-6 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fixedCosts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-dark-500 dark:text-dark-400 font-medium">
                        Nenhum custo fixo registado. Adicione salários, renda, etc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="p-4 bg-primary-500/5 border-t border-white/10">
                <p className="text-[10px] text-dark-400 dark:text-dark-300 font-medium italic">
                  * Os custos fixos são subtraídos automaticamente da receita todos os meses.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Trends Chart Placeholder & Summary */}
        <div className="space-y-6">
          <div className="card-glass p-8 bg-dark-900 border-none text-white shadow-glow">
            <h3 className="text-lg font-bold uppercase tracking-tight mb-8 flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-primary-500" />
              Tendências Mensais
            </h3>
            
            <div className="space-y-6">
              {trends.map((t, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-dark-400 dark:text-dark-300">
                    <span>{new Date(t.month).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</span>
                    <span className="text-white">Saldo: {(t.revenue - t.expenses).toLocaleString()} MZN</span>
                  </div>
                  <div className="relative h-4 bg-white/5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-green-500 h-full transition-all duration-500" 
                      style={{ width: `${(t.revenue / (t.revenue + t.expenses || 1)) * 100}%` }}
                    />
                    <div 
                      className="bg-red-500 h-full transition-all duration-500" 
                      style={{ width: `${(t.expenses / (t.revenue + t.expenses || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter opacity-50">
                    <span>RECEITA: {t.revenue.toLocaleString()}</span>
                    <span>DESPESA: {t.expenses.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              
              {trends.length === 0 && (
                <div className="py-20 text-center text-dark-500 dark:text-dark-200 font-bold italic">
                  A processar dados financeiros...
                </div>
              )}
            </div>
          </div>

          <div className="card-glass p-8">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white uppercase tracking-tight mb-4">
              Dica Financeira
            </h3>
            <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/20 text-sm font-medium text-dark-600 dark:text-dark-300">
              Mantenha as suas despesas operacionais abaixo de 40% da receita para garantir uma expansão saudável do negócio. 🚀
            </div>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-xl animate-fade-in transition-all" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up border border-white/20 dark:border-dark-700/50 max-h-[90dvh] overflow-y-auto">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Nova Despesa</h2>
                <p className="text-dark-400 dark:text-dark-300 font-medium">Registe um gasto administrativo</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 rounded-2xl bg-dark-100 dark:bg-dark-800 text-dark-500 dark:text-dark-200 hover:scale-110 transition-transform"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Descrição</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Pagamento de Renda - Março"
                  className="input-glass"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Valor (MZN)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="input-glass"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Data Registo</label>
                  <input
                    required
                    type="date"
                    className="input-glass uppercase"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Nº Fatura (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: FT-2024-001"
                    className="input-glass"
                    value={newExpense.invoiceNumber}
                    onChange={(e) => setNewExpense({ ...newExpense, invoiceNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Prazo de Pagamento</label>
                  <input
                    type="date"
                    className="input-glass uppercase"
                    value={newExpense.dueDate}
                    onChange={(e) => setNewExpense({ ...newExpense, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Categoria</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="input-glass w-full flex items-center justify-between text-left"
                  >
                    <span className={isCustomCategory ? 'text-primary-500 font-bold' : 'text-dark-900 dark:text-white'}>
                       {isCustomCategory ? '✨ Personalizada' : (EXPENSE_CATEGORIES.find(c => c.value === newExpense.category)?.label || 'Selecione...')}
                    </span>
                    <ChevronDownIcon className={`w-5 h-5 text-dark-400 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryOpen && (
                    <div className="absolute z-50 w-full mt-2 p-1 overflow-hidden bg-white/80 dark:bg-dark-900/90 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 rounded-2xl shadow-xl animate-fade-in max-h-60 overflow-y-auto ring-1 ring-black/5">
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(false);
                            setNewExpense({ ...newExpense, category: cat.value });
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full p-3 text-left rounded-xl transition-all duration-200 text-sm font-medium mb-1 ${
                            newExpense.category === cat.value && !isCustomCategory 
                              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                              : 'hover:bg-white/50 dark:hover:bg-white/5 text-dark-700 dark:text-dark-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                      <div className="h-px bg-gradient-to-r from-transparent via-dark-200 dark:via-dark-700 to-transparent my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(true);
                          setNewExpense({ ...newExpense, category: 'OTHER' });
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full p-3 text-left rounded-xl transition-all duration-200 text-sm font-bold flex items-center gap-2 ${
                          isCustomCategory 
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                            : 'text-primary-500 hover:bg-primary-500/10'
                        }`}
                      >
                       <PlusIcon className="w-4 h-4" />
                       Nova Categoria...
                      </button>
                    </div>
                  )}
                </div>
                
                {isCustomCategory && (
                  <div className="mt-2 animate-fade-in">
                    <input
                      required
                      type="text"
                      placeholder="Digite o nome da categoria..."
                      className="input-glass border-primary-500/50 ring-2 ring-primary-500/20"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <button 
                disabled={isSubmitting}
                className="w-full py-6 bg-dark-900 dark:bg-white text-white dark:text-dark-900 rounded-[2rem] font-bold uppercase tracking-[0.2em] text-sm transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mt-4"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <CurrencyDollarIcon className="h-5 w-5" />
                    Registar Pagamento
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Fixed Cost Modal */}
      {isFixedCostModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-xl animate-fade-in" onClick={() => setIsFixedCostModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-2xl animate-slide-up border border-white/20 dark:border-dark-700/50 overflow-hidden">
            <div className="p-8 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Novo Custo Fixo</h2>
                <p className="text-dark-400 dark:text-dark-300 font-medium">Salários, Renda e contas mensais</p>
              </div>
              <button 
                onClick={() => setIsFixedCostModalOpen(false)}
                className="p-3 rounded-2xl bg-dark-100 dark:bg-dark-800 text-dark-500 dark:text-dark-200 hover:scale-110 transition-transform"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddFixedCost} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Descrição</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Salário Treinador X"
                  className="input-glass"
                  value={newFixedCost.description}
                  onChange={(e) => setNewFixedCost({ ...newFixedCost, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Valor Mensal (MZN)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="input-glass"
                    value={newFixedCost.amount}
                    onChange={(e) => setNewFixedCost({ ...newFixedCost, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest px-2">Categoria</label>
                  <select
                    className="input-glass"
                    value={newFixedCost.category}
                    onChange={(e) => setNewFixedCost({ ...newFixedCost, category: e.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
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
                    <BanknotesIcon className="h-5 w-5" />
                    Register Fixed Cost
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
