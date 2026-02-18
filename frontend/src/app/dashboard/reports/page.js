'use client';

import { 
  ChartBarIcon, 
  ArrowDownTrayIcon, 
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark-900">Relatórios & Analytics</h1>
          <p className="text-gray-500 dark:text-dark-300 mt-1 text-sm">Análise financeira e crescimento do ginásio</p>
        </div>
        <button className="btn-secondary w-full sm:w-auto justify-center">
          <ArrowDownTrayIcon className="h-5 w-5" />
          Exportar Dados
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Financial Report Card */}
        <div className="card-glass group hover:border-primary-200 transition-colors cursor-pointer">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-green-100 rounded-2xl text-green-600">
              <CurrencyDollarIcon className="h-8 w-8" />
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg uppercase tracking-wider">Financeiro</span>
          </div>
          <h3 className="text-xl font-bold text-dark-900 mb-2">Relatório de Receita</h3>
          <p className="text-gray-500 dark:text-dark-300 text-sm mb-6">
            Análise detalhada de pagamentos recebidos, receitas por plano e projeções mensais.
          </p>
          <div className="flex items-center gap-2 text-primary-600 font-bold text-sm group-hover:underline">
            Ver Relatório Completo
          </div>
        </div>

        {/* Growth Report Card */}
        <div className="card-glass group hover:border-blue-200 transition-colors cursor-pointer">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
              <UserGroupIcon className="h-8 w-8" />
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg uppercase tracking-wider">Crescimento</span>
          </div>
          <h3 className="text-xl font-bold text-dark-900 mb-2">Membros & Retenção</h3>
          <p className="text-gray-500 dark:text-dark-300 text-sm mb-6">
            Estatísticas de novos membros, taxas de cancelamento (churn) e frequência de uso.
          </p>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:underline">
            Ver Relatório Completo
          </div>
        </div>

        {/* Attendance Report Card */}
        <div className="card-glass group hover:border-purple-200 transition-colors cursor-pointer">
           <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
              <ChartBarIcon className="h-8 w-8" />
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg uppercase tracking-wider">Operacional</span>
          </div>
          <h3 className="text-xl font-bold text-dark-900 mb-2">Picos de Horário</h3>
          <p className="text-gray-500 dark:text-dark-300 text-sm mb-6">
            Identifique os horários de maior afluência para otimizar a equipa e recursos.
          </p>
           <div className="flex items-center gap-2 text-purple-600 font-bold text-sm group-hover:underline">
            Ver Relatório Completo
          </div>
        </div>

      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h4 className="font-bold text-blue-900 dark:text-blue-200">Precisa de um relatório personalizado?</h4>
          <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">Podemos exportar dados específicos para Excel ou PDF.</p>
        </div>
        <button className="btn-secondary bg-white dark:bg-dark-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full md:w-auto justify-center">
          Solicitar Exportação
        </button>
      </div>
    </div>
  );
}
