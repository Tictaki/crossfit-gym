'use client';

import { 
  CheckIcon, 
  XMarkIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  CreditCardIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

export default function PlanCard({ 
  plan, 
  onEdit, 
  onDelete, 
  onSelect, 
  isSelected, 
  mode = 'view' // 'view' or 'select'
}) {
  if (mode === 'select') {
    return (
      <button
        onClick={() => onSelect(plan)}
        className={`p-5 rounded-3xl border-2 transition-all duration-300 flex items-center justify-between group w-full ${
          isSelected 
            ? 'border-primary-500 bg-primary-500/5 shadow-glow-sm' 
            : 'border-white/10 dark:border-dark-800 hover:border-white/30 dark:hover:border-dark-700'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-primary-500 text-white' : 'bg-dark-100 dark:bg-dark-800 text-dark-400 dark:text-dark-300'}`}>
            <CreditCardIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className={`font-bold tracking-tight ${isSelected ? 'text-dark-900 dark:text-white' : 'text-dark-600 dark:text-dark-300'}`}>{plan.name}</p>
            <p className="text-xs text-dark-400 dark:text-dark-300 font-bold">{plan.durationDays} Dias de Acesso</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary-500">{plan.price?.toLocaleString()} MZN</p>
          {isSelected && <ChevronRightIcon className="h-5 w-5 text-primary-500 ml-auto mt-1" />}
        </div>
      </button>
    );
  }

  return (
    <div className="card-glass group relative overflow-hidden hover:scale-[1.02] transition-transform duration-300 bg-white/40 dark:bg-dark-900/60 transition-all border border-white/40 dark:border-dark-800/50">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <div className="text-9xl font-bold text-primary-500 leading-none select-none">
          {plan.durationDays}
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-dark-900 dark:text-white tracking-tight">{plan.name}</h3>
            <p className="text-sm text-dark-500 dark:text-dark-200 dark:text-dark-400 font-bold uppercase tracking-wider">{plan.durationDays} dias de acesso</p>
          </div>
          {plan.status ? (
            <span className="badge badge-success flex items-center gap-1">
              <CheckIcon className="h-3 w-3" /> Ativo
            </span>
          ) : (
            <span className="badge badge-danger flex items-center gap-1">
              <XMarkIcon className="h-3 w-3" /> Inativo
            </span>
          )}
        </div>

        <div className="mb-6">
          <span className="text-3xl font-bold text-primary-600 dark:text-primary-500 tracking-tighter">{plan.price?.toLocaleString()}</span>
          <span className="text-sm text-dark-400 dark:text-dark-300 font-bold ml-1 uppercase">MZN</span>
        </div>

        <div className="bg-white/50 dark:bg-dark-950/40 backdrop-blur-sm rounded-2xl p-4 mb-6 min-h-[80px] border border-white/20 dark:border-dark-800/50">
          <p className="text-dark-600 dark:text-dark-300 text-sm font-medium leading-relaxed">{plan.description || 'Sem descrição definida.'}</p>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100/50 dark:border-dark-700/50">
            {onEdit && (
              <button 
                onClick={() => onEdit(plan)}
                className="btn-secondary flex-1 text-sm py-3 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-200 font-bold uppercase tracking-widest"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Editar
              </button>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete(plan.id)}
                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-2xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                title="Eliminar Plano"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
