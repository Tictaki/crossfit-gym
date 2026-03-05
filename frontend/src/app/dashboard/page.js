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
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, defs, linearGradient, stop } from 'recharts';
import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';

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
          {payload.length > 1 && (
            <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
              <span className="text-dark-400">Diferença</span>
              <span className={`font-bold ${payload[0].value >= payload[1].value ? 'text-green-500' : 'text-red-500'}`}>
                {payload[0].value >= payload[1].value ? '+' : ''}
                {formatCurrency(payload[0].value - payload[1].value)}
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

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.stats();
      // Format the daily activity data
      const formattedData = response.data;
      if (formattedData.dailyActivity && Array.isArray(formattedData.dailyActivity)) {
        formattedData.dailyActivity = formattedData.dailyActivity.map(d => ({
          date: new Date(d.date).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }),
          checkIns: d.checkIns || 0,
          activeMembersCount: d.activeMembersCount || 0
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
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-dark-900 dark:text-white leading-tight">Dashboard</h1>
        <p className="text-dark-500 dark:text-dark-300 mt-1 md:mt-2 text-sm md:text-base font-medium">Bem-vindo ao painel de controlo do seu ginásio.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Active Members */}
        <div className="stat-card group !p-4 md:!p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="text-[10px] md:text-xs text-dark-400 dark:text-dark-300 font-medium">Membros Ativos</p>
              <p className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mt-1">{stats?.totalMembers || 0}</p>
              <div className={`flex items-center mt-1 md:mt-2 text-[9px] md:text-sm font-bold px-2 py-0.5 md:py-1 rounded-full w-fit ${
                stats?.membersTrend >= 0 
                ? 'text-green-600 bg-green-50 dark:bg-green-900/30' 
                : 'text-red-600 bg-red-50 dark:bg-red-900/30'
              }`}>
                {stats?.membersTrend >= 0 ? <ArrowTrendingUpIcon className="h-3 w-3 mr-1" /> : <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />}
                <span>{stats?.membersTrend > 0 ? `+${stats.membersTrend}%` : `${stats?.membersTrend || 0}%`}</span>
              </div>
            </div>
            <div className="stat-card-icon from-blue-500 to-blue-600 shadow-blue-500/30 h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3">
              <UsersIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="stat-card group !p-4 md:!p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="text-[10px] md:text-xs text-dark-400 dark:text-dark-300 font-medium">Receita (Mês)</p>
              <p className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {formatCurrency(stats?.monthlyRevenue || 0)}
              </p>
              <p className="text-[9px] md:text-xs text-dark-400 dark:text-dark-300 mt-1 md:mt-2">Mensalidades</p>
            </div>
            <div className="stat-card-icon from-green-500 to-green-600 shadow-green-500/30 h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3">
              <BanknotesIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className={`flex items-center text-[9px] md:text-xs font-bold px-2 py-0.5 rounded-full ${
              stats?.revenueTrend >= 0 
              ? 'text-green-600 bg-green-50 dark:bg-green-900/30' 
              : 'text-red-600 bg-red-50 dark:bg-red-900/30'
            }`}>
              {stats?.revenueTrend >= 0 ? <ArrowTrendingUpIcon className="h-2 w-2 mr-1" /> : <ArrowTrendingDownIcon className="h-2 w-2 mr-1" />}
              {stats?.revenueTrend > 0 ? `+${stats.revenueTrend}%` : `${stats?.revenueTrend || 0}%`}
            </div>
            <p className="text-[9px] md:text-xs text-dark-400 dark:text-dark-300">vs Mês Anterior</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="stat-card group !p-4 md:!p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="text-[10px] md:text-xs text-dark-400 dark:text-dark-300 font-medium">Pagamentos Pendentes</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(stats?.pendingPayments || 0)}
              </p>
              <div className="flex items-center mt-1 md:mt-2 text-red-600 text-[9px] md:text-sm font-bold bg-red-50 dark:bg-red-900/30 px-2 py-0.5 md:py-1 rounded-full w-fit">
                <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                <span>Atenção</span>
              </div>
            </div>
            <div className="stat-card-icon from-red-500 to-red-600 shadow-red-500/30 h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3">
              <ExclamationCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        {/* New Members */}
        <div className="stat-card group !p-4 md:!p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="text-[10px] md:text-xs text-dark-400 dark:text-dark-300 font-medium">Novos Membros</p>
              <p className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mt-1">{stats?.newMembersThisMonth || 0}</p>
              <div className={`flex items-center mt-1 md:mt-2 text-[9px] md:text-sm font-bold px-2 py-0.5 md:py-1 rounded-full w-fit ${
                stats?.newMembersTrend >= 0 
                ? 'text-green-600 bg-green-50 dark:bg-green-900/30' 
                : 'text-red-600 bg-red-50 dark:bg-red-900/30'
              }`}>
                {stats?.newMembersTrend >= 0 ? <ArrowTrendingUpIcon className="h-3 w-3 mr-1" /> : <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />}
                <span>{stats?.newMembersTrend > 0 ? `+${stats.newMembersTrend}%` : `${stats?.newMembersTrend || 0}%`}</span>
              </div>
            </div>
            <div className="stat-card-icon from-purple-500 to-purple-600 shadow-purple-500/30 h-10 w-10 md:h-12 md:w-12 !p-2 md:!p-3">
              <UserPlusIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        <Link href="/dashboard/members/new" className="group p-3 md:p-4 rounded-xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 dark:group-hover:bg-blue-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center mx-auto transition-all mb-2">
            <UserPlusIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="text-[10px] md:text-xs font-semibold text-dark-700 dark:text-dark-200">Novo Membro</span>
        </Link>

        <Link href="/dashboard/payments" className="group p-3 md:p-4 rounded-xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50 hover:border-green-500 dark:hover:border-green-500 transition-all duration-200 text-center">
          <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-600 dark:group-hover:bg-green-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center mx-auto transition-all mb-2">
            <BanknotesIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="text-[10px] md:text-xs font-semibold text-dark-700 dark:text-dark-200">Pagamentos</span>
        </Link>

        <Link href="/dashboard/members" className="group p-3 md:p-4 rounded-xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 text-center">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center mx-auto transition-all mb-2">
            <UsersIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="text-[10px] md:text-xs font-semibold text-dark-700 dark:text-dark-200">Membros</span>
        </Link>

        <Link href="/dashboard/products" className="group p-3 md:p-4 rounded-xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50 hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-200 text-center">
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 dark:group-hover:bg-orange-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center mx-auto transition-all mb-2">
            <ShoppingBagIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="text-[10px] md:text-xs font-semibold text-dark-700 dark:text-dark-200">Loja</span>
        </Link>

        <Link href="/dashboard/plans" className="group p-3 md:p-4 rounded-xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all duration-200 text-center">
          <div className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-600 dark:group-hover:bg-cyan-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center mx-auto transition-all mb-2">
            <ChartBarIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="text-[10px] md:text-xs font-semibold text-dark-700 dark:text-dark-200">Planos</span>
        </Link>

        <Link href="/dashboard/reports" className="group p-3 md:p-4 rounded-xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50 hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-200 text-center">
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 dark:group-hover:bg-amber-600 group-hover:text-white h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center mx-auto transition-all mb-2">
            <ArchiveBoxIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <span className="text-[10px] md:text-xs font-semibold text-dark-700 dark:text-dark-200">Relatórios</span>
        </Link>
      </div>

      {/* Financial Comparison Chart */}
      {stats?.revenueComparison && (
        <div className="card-glass p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-dark-900 dark:text-white">Desempenho Financeiro</h3>
              <p className="text-sm text-dark-400 dark:text-dark-300 mt-1">Comparação de receitas ao longo do ano</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-dark-700/50 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setShowYoY(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!showYoY ? 'bg-white dark:bg-dark-600 text-primary-600 shadow-sm' : 'text-dark-500 hover:text-dark-700 dark:hover:text-dark-200'}`}
              >
                Ano Atual
              </button>
              <button 
                onClick={() => setShowYoY(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${showYoY ? 'bg-white dark:bg-dark-600 text-primary-600 shadow-sm' : 'text-dark-500 hover:text-dark-700 dark:hover:text-dark-200'}`}
              >
                vs Ano Anterior
              </button>
            </div>
          </div>

          <div className="h-[400px] w-100%">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f50707" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f50707" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(100, 100, 100, 0.6)', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(100, 100, 100, 0.6)', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(val) => `MZN ${val/1000}k`}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'rgba(245, 7, 7, 0.2)', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#f50707" 
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorCurrent)"
                  name="Ano Atual"
                  animationDuration={1500}
                />
                {showYoY && (
                  <Area 
                    type="monotone" 
                    dataKey="previous" 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorPrevious)"
                    name="Ano Anterior"
                    animationDuration={1500}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Plan Distribution & Secondary Charts */}
      {(stats?.chartData || stats?.planDistribution) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Revenue (Small) */}
          {stats?.chartData && (
            <div className="card-glass lg:col-span-2">
              <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Faturação Recente</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.1)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="rgba(100, 100, 100, 0.6)" />
                  <YAxis axisLine={false} tickLine={false} stroke="rgba(100, 100, 100, 0.6)" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(200, 200, 200, 0.1)' }}
                    contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '10px', color: '#fff' }}
                  />
                  <Bar dataKey="revenue" fill="#f50707" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Plan Distribution */}
          {stats?.planDistribution && (
            <div className="card-glass">
              <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Distribuição de Planos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Modern Dynamic Chart - Daily Activity */}
      {stats?.dailyActivity && (
        <div className="card-glass">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-dark-900 dark:text-white">Atividade Diária</h3>
              <p className="text-sm text-dark-400 dark:text-dark-300 mt-1">Check-ins e Membros Ativos</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <span className="text-xs text-dark-600 dark:text-dark-300">Check-ins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <span className="text-xs text-dark-600 dark:text-dark-300">Ativos</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={stats.dailyActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCheckIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.1)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(100, 100, 100, 0.6)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="rgba(100, 100, 100, 0.6)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
                }}
                cursor={{ stroke: 'rgba(100, 100, 100, 0.2)', strokeWidth: 2 }}
                formatter={(value) => value}
                labelStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="checkIns" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fill="url(#colorCheckIn)"
                isAnimationActive={true}
                animationDuration={800}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6, fill: '#3b82f6' }}
              />
              <Area 
                type="monotone" 
                dataKey="activeMembersCount" 
                stroke="#a855f7" 
                strokeWidth={3}
                fill="url(#colorActive)"
                isAnimationActive={true}
                animationDuration={800}
                dot={{ fill: '#a855f7', r: 4 }}
                activeDot={{ r: 6, fill: '#a855f7' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-xs text-dark-600 dark:text-dark-300 font-medium">Total Check-ins</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stats.dailyActivity?.reduce((sum, d) => sum + (d.checkIns || 0), 0) || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <p className="text-xs text-dark-600 dark:text-dark-300 font-medium">Média Diária</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {Math.round((stats.dailyActivity?.reduce((sum, d) => sum + (d.checkIns || 0), 0) || 0) / (stats.dailyActivity?.length || 1)) || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Extra Info: Expirations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-dark-900 dark:text-white flex items-center gap-2">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
              Expirações Próximas (7 dias)
            </h3>
            <Link href="/dashboard/defaulters" className="text-xs text-primary-500 font-bold hover:underline">Ver Todos</Link>
          </div>
          <div className="space-y-4">
            {stats?.expiringSoon && stats.expiringSoon.length > 0 ? (
              stats.expiringSoon.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-dark-700/30 border border-gray-100 dark:border-dark-700/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-900 dark:text-white">{m.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase font-medium">{m.plan?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-dark-700 dark:text-dark-200">{new Date(m.expirationDate).toLocaleDateString()}</p>
                    <p className="text-[10px] text-red-500 font-bold uppercase mt-0.5">Expira Breve</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-dark-400 text-center py-4 italic">Nenhuma expiração próxima.</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-dark-900 dark:text-white flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
              Atividade Recente (Pagamentos)
            </h3>
            <Link href="/dashboard/payments" className="text-xs text-primary-500 font-bold hover:underline">Histórico</Link>
          </div>
          <div className="space-y-4">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                      <BanknotesIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-900 dark:text-white">{r.member?.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-dark-400">{r.plan?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-green-600">{formatCurrency(r.amount)}</p>
                    <p className="text-[9px] text-gray-400 dark:text-dark-500 mt-0.5">{new Date(r.paymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-dark-400 text-center py-4 italic">Sem atividade recente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
