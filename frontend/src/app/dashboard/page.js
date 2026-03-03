'use client';

import { useEffect, useState } from 'react';
import { dashboardAPI } from '@/lib/api';
import Link from 'next/link';
import {
  UsersIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
  TrophyIcon,
  DocumentPlusIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#f50707', '#3b82f6', '#10b981', '#f59e0b'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.stats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const memberData = useMemo(() => [
    { name: 'Ativos', value: stats?.activeMembers || 0 },
    { name: 'Inativos', value: stats?.inactiveMembers || 0 },
  ], [stats]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-dark-900 dark:text-white leading-tight">Dashboard Overview</h1>
        <p className="text-dark-500 dark:text-dark-300 mt-1 md:mt-2 text-sm md:text-base font-medium">Bem-vindo ao painel de controlo do seu ginásio.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="stat-card group !p-4 md:!p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="stat-card-title text-[10px] md:text-xs text-dark-400 dark:text-dark-300">Membros Ativos</p>
              <p className="stat-card-value text-sm md:text-2xl">{stats?.activeMembers || 0}</p>
              <div className="flex items-center mt-1 md:mt-2 text-green-600 text-[9px] md:text-sm font-bold bg-green-50 px-2 py-0.5 md:py-1 rounded-full w-fit">
                <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                <span>+2.4%</span>
              </div>
            </div>
            <div className="stat-card-icon from-blue-500 to-blue-600 shadow-blue-500/30 h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3">
              <UsersIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card group !p-4 md:!p-6">
           <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="stat-card-title text-[10px] md:text-xs text-dark-400 dark:text-dark-300">Receita Total (Mês)</p>
              <p className="stat-card-value text-sm md:text-2xl text-primary-600">
                {formatCurrency(stats?.revenueThisMonth + (stats?.salesRevenueThisMonth || 0))}
              </p>
               <p className="text-[9px] md:text-xs text-dark-400 dark:text-dark-300 mt-1 md:mt-2 font-medium">Mensalidades + Vendas</p>
            </div>
            <div className="stat-card-icon from-green-500 to-green-600 shadow-green-500/30 h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3">
              <BanknotesIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

         <div className="stat-card group !p-4 md:!p-6">
           <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="stat-card-title text-[10px] md:text-xs text-dark-400 dark:text-dark-300">Vendas Loja</p>
              <p className="stat-card-value text-sm md:text-2xl text-dark-900 dark:text-white">
                {formatCurrency(stats?.salesRevenueThisMonth)}
              </p>
               <div className="flex items-center mt-1 md:mt-2 text-orange-600 text-[9px] md:text-sm font-bold bg-orange-50 px-2 py-0.5 md:py-1 rounded-full w-fit">
                <ShoppingBagIcon className="h-3 w-3 mr-1" />
                <span>{stats?.salesCount || 0} v.</span>
              </div>
            </div>
            <div className="stat-card-icon from-orange-500 to-orange-600 shadow-orange-500/30 h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3">
              <ShoppingBagIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        {stats?.lowStockCount > 0 ? (
          <div className="stat-card group border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/50 !p-4 md:!p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
              <div>
                <p className="stat-card-title text-[10px] md:text-xs text-red-600 dark:text-red-400">Alerta Stock</p>
                <p className="stat-card-value text-sm md:text-2xl text-red-600">{stats?.lowStockCount}</p>
                <div className="flex items-center mt-1 md:mt-2 text-red-600 text-[9px] md:text-sm font-bold bg-red-100 dark:bg-red-900/30 px-2 py-0.5 md:py-1 rounded-full w-fit">
                  <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                  <span>Produtos a acabar</span>
                </div>
              </div>
              <div className="stat-card-icon from-red-500 to-red-600 shadow-red-500/30 h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3">
                <ArchiveBoxIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="stat-card group !p-4 md:!p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
              <div>
                <p className="stat-card-title text-[10px] md:text-xs text-dark-400 dark:text-dark-300">Novos Membros</p>
                <p className="stat-card-value text-sm md:text-2xl">{stats?.newMembersThisMonth || 0}</p>
                <div className="flex items-center mt-1 md:mt-2 text-green-600 text-[9px] md:text-sm font-bold bg-green-50 px-2 py-0.5 md:py-1 rounded-full w-fit">
                  <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                  <span>+12%</span>
                </div>
              </div>
              <div className="stat-card-icon from-purple-500 to-purple-600 shadow-purple-500/30 h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3">
                <UserPlusIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        <Link href="/dashboard/members/new" className="quick-access-btn group">
          <div className="quick-access-icon bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12">
            <UserPlusIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="quick-access-label text-[10px] md:text-xs">Novo Membro</span>
        </Link>
        <Link href="/dashboard/payments" className="quick-access-btn group">
          <div className="quick-access-icon bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12">
            <BanknotesIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="quick-access-label text-[10px] md:text-xs">Pagamentos</span>
        </Link>
        <Link href="/dashboard/members" className="quick-access-btn group">
          <div className="quick-access-icon bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12">
            <UsersIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="quick-access-label text-[10px] md:text-xs">Lista Membros</span>
        </Link>
        <Link href="/dashboard/products" className="quick-access-btn group">
          <div className="quick-access-icon bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12">
            <ShoppingBagIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="quick-access-label text-[10px] md:text-xs">Loja / Vendas</span>
        </Link>
        <Link href="/dashboard/expenses" className="quick-access-btn group">
          <div className="quick-access-icon bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12">
            <ArrowTrendingDownIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="quick-access-label text-[10px] md:text-xs">Despesas</span>
        </Link>
        <Link href="/dashboard/accounting" className="quick-access-btn group">
          <div className="quick-access-icon bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12">
            <ArrowTrendingUpIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="quick-access-label text-[10px] md:text-xs">Contabilidade</span>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card-glass lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-bold text-dark-900 dark:text-white">Evolução de Receita</h3>
             <div className="flex gap-4">
               <div className="flex items-center gap-2 text-xs font-bold text-dark-500 dark:text-dark-300">
                 <span className="w-3 h-3 rounded-full bg-primary-500"></span> Total
               </div>
               <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-dark-500 dark:text-dark-300">
                 <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-orange-500"></span> Vendas
               </div>
             </div>
          </div>
          <div className="h-[220px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.monthlyRevenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f50707" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f50707" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('pt-PT', { month: 'short' })} 
                   axisLine={false}
                  tickLine={false}
                  tick={{fill: '#6b7280', fontSize: 9}}
                  dy={10}
                />
                <YAxis 
                   axisLine={false}
                   tickLine={false}
                   tick={{fill: '#6b7280', fontSize: 9}}
                />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: 'none'}}
                  formatter={(value, name) => [
                    `${parseFloat(value).toFixed(2)} MZN`, 
                    name === 'total' ? 'Total' : name === 'sales' ? 'Vendas Loja' : 'Mensalidades'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#f50707" 
                  strokeWidth={3} 
                  dot={{fill: '#f50707', strokeWidth: 2, r: 4, stroke: '#fff'}}
                  activeDot={{r: 6, strokeWidth: 0}}
                  name="total"
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#f97316" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{r: 6, strokeWidth: 0}}
                  name="sales"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Status Pie */}
        <div className="card-glass">
          <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-6">Membros</h3>
          <div className="h-[220px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memberData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
           <div className="text-center mt-4">
            <p className="text-3xl font-bold text-dark-900 dark:text-white">{stats?.activeMembers + stats?.inactiveMembers || 0}</p>
            <p className="text-sm text-dark-500 dark:text-dark-200 uppercase tracking-wide font-semibold">Total Membros</p>
          </div>
        </div>
      </div>

      {/* Expiring Soon */}
      {stats?.expiringSoon && stats.expiringSoon.length > 0 && (
        <div className="card-glass p-0 overflow-hidden">
          <div className="p-6 pb-0 flex items-center justify-between mb-6">
            <h3 className="text-lg md:text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
              <span className="p-2 bg-yellow-500/10 rounded-xl text-yellow-600">
                <ExclamationCircleIcon className="h-5 w-5" />
              </span>
              Vencimentos Próximos
            </h3>
            <Link href="/dashboard/defaulters" className="text-xs font-bold text-primary-500 hover:underline">Ver Todos</Link>
          </div>
          
          <div className="table-container pt-4">
            <table className="table min-w-full table-responsive-cards">
              <thead className="bg-dark-900 dark:bg-black">
                <tr>
                  <th className="py-4 pl-8 text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Membro</th>
                  <th className="py-4 text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Plano</th>
                  <th className="py-4 text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Data Exp.</th>
                  <th className="py-4 pr-8 text-right text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest ">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-dark-800/50">
                {stats?.expiringSoon.map((member) => (
                  <tr key={member.id} className="hover:bg-white/20 dark:hover:bg-dark-800/10 transition-colors">
                    <td className="py-4 pl-8" data-label="Membro">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-[10px] font-bold text-white shadow-glow-sm">
                          {member.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-dark-900 dark:text-white leading-tight">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-medium text-dark-600 dark:text-dark-300" data-label="Plano">{member.plan?.name}</td>
                    <td className="py-4" data-label="Data Exp.">
                      <span className="text-sm font-bold text-red-500">
                        {new Date(member.expirationDate).toLocaleDateString('pt-PT')}
                      </span>
                    </td>
                    <td className="py-4 pr-8 text-right" data-label="Ações">
                      <Link 
                        href={`/dashboard/members/${member.id}`}
                        className="p-2 rounded-xl bg-primary-500/10 text-primary-600 hover:bg-primary-500 hover:text-white transition-all shadow-sm inline-block"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Products */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <div className="card-glass">
          <div className="flex items-center gap-3 mb-6">
            <TrophyIcon className="h-6 w-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-dark-900 dark:text-white">Top Produtos (Mês)</h3>
          </div>
          <div className="space-y-4">
            {stats.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-dark-800/50 rounded-2xl border border-gray-100 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-500'}
                  `}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-dark-900 dark:text-white">{product.name}</span>
                </div>
                <div className="font-bold text-dark-600 dark:text-dark-300">
                  {product.quantity} <span className="text-xs font-normal">un.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
