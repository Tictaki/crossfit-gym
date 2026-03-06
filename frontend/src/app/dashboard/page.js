'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadialBarChart, RadialBar, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const COLORS = ['#f50707', '#3b82f6', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
        <p className="text-white font-bold mb-3 border-b border-white/10 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs text-dark-300 font-medium">{entry.name}</span>
              </div>
              <span className="text-xs font-bold text-white">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          {payload.length >= 2 && (
            <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
              <span className="text-dark-400">Total Acumulado</span>
              <span className="font-bold text-white">
                {formatCurrency(payload.reduce((acc, entry) => acc + (entry.value || 0), 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showYoY, setShowYoY] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === 'RECEPTIONIST') {
        router.push('/dashboard/members');
      }
    }
  }, [router]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.stats();
      const formattedData = response.data;
      if (formattedData.dailyActivity && Array.isArray(formattedData.dailyActivity)) {
        formattedData.dailyActivity = formattedData.dailyActivity.map(d => ({
          date: new Date(d.date).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }),
          checkIns: d.checkIns || 0,
          activeMembersCount: d.activeMembersCount || 0,
          revenue: d.revenue || 0,
          payments: d.payments || 0,
          sales: d.sales || 0
        }));
      }
      setStats(formattedData);
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-10"
    >
      <motion.div variants={itemVariants} className="mb-12">
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase mb-2">Painel de Controlo</h1>
        <p className="text-dark-400 font-medium tracking-wide">Monitorização de performance em tempo real</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Active Members Card */}
        <motion.div whileHover={{ x: 5 }} className="brutal-border hover:bg-dark-900/60 transition-all">
          <div className="flex flex-col gap-1">
            <span className="premium-label">Membros Ativos</span>
            <div className="text-premium-display text-5xl mb-2">{stats?.activeMembers || 0}</div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center text-[9px] font-black px-1.5 py-0.5 rounded-sm ${stats?.membersTrend >= 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                {stats?.membersTrend >= 0 ? '▲' : '▼'} {Math.abs(stats?.membersTrend || 0)}%
              </div>
              <span className="text-premium-meta opacity-60">Total: {stats?.totalMembers || 0}</span>
            </div>
          </div>
        </motion.div>

        {/* Monthly Revenue Card */}
        <motion.div whileHover={{ x: 5 }} className="brutal-border border-green-500 hover:bg-dark-900/60 transition-all">
          <div className="flex flex-col gap-1">
            <span className="premium-label">Receita Mensal</span>
            <div className="text-premium-display text-4xl mb-2 text-green-500">{formatCurrency(stats?.monthlyRevenue || 0)}</div>
            <div className={`flex items-center text-[9px] font-black px-1.5 py-0.5 rounded-sm w-fit ${stats?.revenueTrend >= 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                {stats?.revenueTrend >= 0 ? '▲' : '▼'} {Math.abs(stats?.revenueTrend || 0)}% <span className="ml-1 opacity-70">VS ANTERIOR</span>
            </div>
          </div>
        </motion.div>

        {/* Pending Payments Card */}
        <motion.div whileHover={{ x: 5 }} className="brutal-border border-red-500 hover:bg-dark-900/60 transition-all">
          <div className="flex flex-col gap-1">
            <span className="premium-label">Pendentes</span>
            <div className="text-premium-display text-4xl mb-2 text-red-500">{formatCurrency(stats?.pendingPayments || 0)}</div>
            <div className="text-premium-meta text-red-500/60">Ação Requerida</div>
          </div>
        </motion.div>

        {/* Low Stock Card */}
        <motion.div whileHover={{ x: 5 }} className="brutal-border border-amber-500 hover:bg-dark-900/60 transition-all">
          <div className="flex flex-col gap-1">
            <span className="premium-label">Stock Alerta</span>
            <div className={`text-premium-display text-5xl mb-2 ${stats?.lowStockCount > 0 ? 'text-amber-500' : 'text-white'}`}>
              {stats?.lowStockCount || 0}
            </div>
            <div className="text-premium-meta opacity-60">Produtos p/ Repor</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Access Buttons */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
        {[
          { icon: UserPlusIcon, label: 'Novo Membro', href: '/dashboard/members/new', color: 'blue' },
          { icon: BanknotesIcon, label: 'Pagamentos', href: '/dashboard/payments', color: 'green' },
          { icon: UsersIcon, label: 'Membros', href: '/dashboard/members', color: 'indigo' },
          { icon: ShoppingBagIcon, label: 'Loja', href: '/dashboard/products', color: 'orange' },
          { icon: ChartBarIcon, label: 'Planos', href: '/dashboard/plans', color: 'cyan' },
          { icon: ArchiveBoxIcon, label: 'Relatórios', href: '/dashboard/reports', color: 'amber' },
        ].map((item, idx) => (
          <Link key={idx} href={item.href} className="block">
            <motion.div 
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group p-3 md:p-4 rounded-xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50 hover:border-${item.color}-500 transition-all text-center`}
            >
              <div className={`bg-${item.color}-100 dark:bg-${item.color}-900/30 text-${item.color}-600 dark:text-${item.color}-400 group-hover:bg-${item.color}-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center mx-auto transition-all mb-2`}>
                <item.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="text-[10px] md:text-xs font-semibold text-dark-700 dark:text-dark-200">{item.label}</span>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Main Income Chart */}
      {stats?.revenueComparison && (
        <motion.div variants={itemVariants} className="card-glass p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Performance Financeira</h2>
              <p className="premium-label text-dark-400 mt-1">Metas vs Realidade</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-700/50 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setShowYoY(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!showYoY ? 'bg-white dark:bg-dark-600 text-primary-600 shadow-sm' : 'text-dark-500'}`}
              >
                Ano Atual
              </button>
              <button 
                onClick={() => setShowYoY(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${showYoY ? 'bg-white dark:bg-dark-600 text-primary-600 shadow-sm' : 'text-dark-500'}`}
              >
                vs Anterior
              </button>
            </div>
          </div>
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f50707" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f50707" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(100, 100, 100, 0.6)', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(100, 100, 100, 0.6)', fontSize: 10 }} tickFormatter={(val) => `MZN ${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="Serviços (Planos)" dataKey="currentPayments" stroke="#f50707" strokeWidth={3} fill="url(#colorCurrent)" fillOpacity={1} animationDuration={1000} />
                <Area type="monotone" name="Loja (Produtos)" dataKey="currentSales" stroke="#3b82f6" strokeWidth={3} fill="url(#colorStore)" fillOpacity={1} animationDuration={1000} />
                <Area type="monotone" name="Faturação Total" dataKey="current" stroke="#ffffff" strokeWidth={2} strokeDasharray="5 5" fill="none" animationDuration={1000} />
                {showYoY && <Area type="monotone" name="Ano Anterior" dataKey="previous" stroke="#94a3b8" strokeWidth={2} fill="url(#colorPrev)" fillOpacity={0.5} animationDuration={1000} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Grid for Charts & Lists */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-glass lg:col-span-2 relative overflow-hidden h-auto min-h-[360px] p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Mix de Faturação</h2>
              <p className="premium-label text-dark-400 mt-1">Segmentação por Categoria</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-600 shadow-sm shadow-primary-500/20"></div>
                <span className="text-[11px] font-bold text-dark-500 dark:text-dark-300">Serviços</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20"></div>
                <span className="text-[11px] font-bold text-dark-500 dark:text-dark-300">Loja</span>
              </div>
            </div>
          </div>
          
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats?.chartData || []} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(120, 120, 120, 0.7)', fontSize: 11, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(120, 120, 120, 0.7)', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(val) => `MZN ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)', radius: 8 }} 
                  content={<CustomTooltip />} 
                />
                <Bar 
                  name="Serviços" 
                  dataKey="payments" 
                  stackId="a" 
                  fill="#f50707" 
                  radius={[0, 0, 0, 0]} 
                  animationDuration={1500}
                />
                <Bar 
                  name="Loja" 
                  dataKey="sales" 
                  stackId="a" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-glass">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Produtos Mais Vendidos</h2>
          <div className="space-y-4 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {(stats?.topProducts || []).map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-dark-700/30 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center font-bold text-xs">#{i+1}</div>
                  <span className="text-sm font-bold text-dark-800 dark:text-dark-200">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-dark-900 dark:text-white">{p.quantity} unid.</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Vendas</p>
                </div>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <p className="text-sm text-dark-400 text-center py-10 italic">Sem vendas este mês.</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Daily & Hourly Activity Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        {stats?.dailyActivity && (
          <div className="card-glass p-6">
            <h2 className="text-lg font-bold mb-4 font-outfit text-dark-900 dark:text-white">Atividade Diária (14 Dias)</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyActivity}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" name="Faturação Produtos" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" name="Faturação Serviços" dataKey="payments" stroke="#f50707" fill="#f50707" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Hourly Peak Activity Chart */}
        {stats?.hourlyActivity && (
          <div className="card-glass p-6">
            <h2 className="text-lg font-bold mb-4 font-outfit text-dark-900 dark:text-white">Horas de Pico</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourlyActivity} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(120, 120, 120, 0.7)', fontSize: 10 }}
                    interval={3}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(120, 120, 120, 0.7)', fontSize: 10 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)', radius: 4 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-dark-900/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
                            <p className="text-white font-bold text-xs mb-1">{label}</p>
                            <p className="text-primary-400 font-bold text-sm">{payload[0].value} entradas</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#f50707" radius={[4, 4, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <div className="brutal-border hover:bg-dark-900/60 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black uppercase tracking-tighter">Expirações Próximas</h2>
            <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
          </div>
          <div className="space-y-4">
            {(stats?.expiringSoon || []).map((m, i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-sm">{m.name.charAt(0)}</div>
                   <div>
                     <p className="text-sm font-black text-white font-display tracking-tight">{m.name}</p>
                     <p className="text-premium-meta opacity-50">{m.plan?.name}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-black text-white font-display">{new Date(m.expirationDate).toLocaleDateString('pt-PT')}</p>
                   <p className="text-premium-meta text-amber-500/60">PRAZO</p>
                 </div>
               </div>
            ))}
            {(!stats?.expiringSoon || stats.expiringSoon.length === 0) && (
              <p className="text-xs text-dark-500 italic text-center py-6">Sem expirações iminentes.</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="brutal-border border-blue-500 hover:bg-dark-900/60 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black uppercase tracking-tighter">Fluxo Recente</h2>
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {(stats?.recentActivity || []).map((r, i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center"><BanknotesIcon className="h-5 w-5" /></div>
                   <div>
                     <p className="text-sm font-black text-white font-display tracking-tight">{r.member?.name}</p>
                     <p className="text-premium-meta opacity-50">{r.plan?.name}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-black text-blue-400 font-display">{formatCurrency(r.amount)}</p>
                   <p className="text-premium-meta text-blue-500/60">VALOR</p>
                 </div>
               </div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <p className="text-xs text-dark-500 italic text-center py-6">Sem atividade recente.</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
