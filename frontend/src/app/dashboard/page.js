'use client';

import { useEffect, useState } from 'react';
import { dashboardAPI } from '@/lib/api';
import Link from 'next/link';
import {
  UsersIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#f50707', '#3b82f6', '#10b981', '#f59e0b'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
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

  const statsData = useMemo(() => {
    if (!stats) return null;
    return [
      {
        title: 'Membros Ativos',
        value: stats.totalMembers || 0,
        change: '+2.5%',
        isPositive: true,
        icon: UsersIcon,
        color: 'from-blue-500 to-blue-600',
        href: '/dashboard/members'
      },
      {
        title: 'Receita Mensal',
        value: formatCurrency(stats.monthlyRevenue || 0),
        change: '+12.4%',
        isPositive: true,
        icon: BanknotesIcon,
        color: 'from-green-500 to-green-600',
        href: '/dashboard/payments'
      },
      {
        title: 'Pagamentos Pendentes',
        value: formatCurrency(stats.pendingPayments || 0),
        change: '-5.2%',
        isPositive: false,
        icon: ExclamationCircleIcon,
        color: 'from-red-500 to-red-600',
        href: '/dashboard/defaulters'
      },
      {
        title: 'Novos Membros (30 dias)',
        value: stats.newMembersThisMonth || 0,
        change: '+8.1%',
        isPositive: true,
        icon: UserPlusIcon,
        color: 'from-purple-500 to-purple-600',
        href: '/dashboard/members'
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-dark-900 dark:text-white">Dashboard</h1>
          <p className="text-dark-400 dark:text-dark-300 mt-1 font-medium">
            Bem-vindo de volta! Aqui está a visão geral do seu ginásio.
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/dashboard/members/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-primary-500/30"
          >
            <UserPlusIcon className="h-5 w-5" />
            Novo Membro
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Link 
                key={idx}
                href={stat.href}
                className="group p-6 rounded-2xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50 hover:border-gray-200 dark:hover:border-dark-600 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-sm font-semibold ${
                    stat.isPositive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {stat.isPositive ? '↑' : '↓'} {stat.change}
                  </div>
                </div>
                <h3 className="text-dark-600 dark:text-dark-300 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Charts Section */}
      {stats?.chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Tendência de Receita</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.1)" />
                <XAxis dataKey="name" stroke="rgba(100, 100, 100, 0.6)" />
                <YAxis stroke="rgba(100, 100, 100, 0.6)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  cursor={{ stroke: 'rgba(100, 100, 100, 0.3)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#f50707" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Plans Distribution */}
          {stats?.planDistribution && (
            <div className="p-6 rounded-2xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Membros', href: '/dashboard/members', icon: '👥' },
          { name: 'Pagamentos', href: '/dashboard/payments', icon: '💰' },
          { name: 'Planos', href: '/dashboard/plans', icon: '📋' },
          { name: 'Relatórios', href: '/dashboard/reports', icon: '📊' },
        ].map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="p-4 rounded-xl bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700/50 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 text-center group"
          >
            <div className="text-3xl mb-2">{action.icon}</div>
            <p className="text-sm font-semibold text-dark-700 dark:text-dark-200 group-hover:text-primary-500 transition-colors">{action.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
