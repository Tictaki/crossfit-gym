'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ArrowDownTrayIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { reportsAPI, dashboardAPI } from '@/lib/api';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar 
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

const COLORS = ['#f50707', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [revenueData, setRevenueData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const [revRes, growthRes, statsRes] = await Promise.all([
        reportsAPI.revenueByPlan(),
        reportsAPI.memberGrowth(),
        dashboardAPI.stats()
      ]);

      setRevenueData(revRes.data);
      setGrowthData(growthRes.data.map(g => ({
        month: new Date(g.month).toLocaleDateString('pt-PT', { month: 'short' }),
        count: g.count
      })));
      setHourlyData(statsRes.data.hourlyActivity || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-900/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
          <p className="text-white font-bold text-xs mb-1">{label || payload[0].name}</p>
          <p className="text-primary-400 font-bold text-sm">
            {typeof payload[0].value === 'number' && payload[0].name.toLowerCase().includes('receita') 
              ? formatCurrency(payload[0].value) 
              : `${payload[0].value} ${payload[0].name.toLowerCase().includes('membro') ? 'membros' : 'entradas'}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading && !lastUpdated) {
    return (
      <div className="flex items-center justify-center h-screen -mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-dark-900 dark:text-white font-outfit">Relatórios & Analytics</h1>
          <p className="text-gray-500 dark:text-dark-300 mt-1 text-sm md:text-base font-medium">Análise em tempo real do crescimento do ginásio</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] font-bold text-dark-400 uppercase tracking-widest hidden md:block">
              Atualizado: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={loadAllReports}
            className="p-2.5 rounded-xl glass-button text-dark-600 dark:text-dark-300 hover:text-primary-500 transition-colors"
            title="Atualizar Dados"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="btn-primary flex items-center gap-2 shadow-glow-sm">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Financial Distribution */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-xl text-green-600">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">Receita por Plano</h3>
                <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Distribuição Financeira</p>
              </div>
            </div>
          </div>
          <div className="h-[300px] flex items-center">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="planName"
                    animationDuration={1500}
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 pr-4">
              {revenueData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-dark-700 dark:text-dark-200 truncate max-w-[120px]">{item.planName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Member Growth */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">Crescimento de Membros</h3>
                <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Novas Inscrições (12 meses)</p>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(100, 100, 100, 0.6)', fontSize: 10 }} />
                <YAxis hide />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  name="Novos Membros" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fill="url(#colorGrowth)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours (Operational) */}
        <div className="card-glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">Frequência por Horário</h3>
                <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Concentração de entradas</p>
              </div>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.05)" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'rgba(120, 120, 120, 0.7)', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(120, 120, 120, 0.7)', fontSize: 10 }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)', radius: 4 }}
                  content={<CustomTooltip />}
                />
                <Bar name="Entradas" dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] p-8 border border-blue-100 dark:border-blue-800/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="text-center md:text-left">
          <h4 className="font-bold text-blue-900 dark:text-blue-200 text-lg">Precisa de um relatório personalizado?</h4>
          <p className="text-blue-700 dark:text-blue-300 text-sm mt-1 opacity-80">Podemos exportar dados específicos para Excel ou PDF para uma análise offline mais aprofundada.</p>
        </div>
        <button className="btn-secondary bg-white dark:bg-dark-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-white dark:hover:bg-dark-700 w-full md:w-auto justify-center px-8 shadow-sm">
          Solicitar Exportação
        </button>
      </div>
    </div>
  );
}
