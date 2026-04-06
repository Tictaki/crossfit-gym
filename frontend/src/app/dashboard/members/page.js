'use client';

import { useEffect, useState, useDeferredValue } from 'react';
import Link from 'next/link';
import { membersAPI } from '@/lib/api';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { getImageUrl } from '@/lib/api';
import { useDebounce } from '@/lib/utils';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const deferredSearch = useDeferredValue(search);
  const debouncedSearch = useDebounce(deferredSearch, 500);

  useEffect(() => {
    loadMembers();
  }, [debouncedSearch, status]);

  const loadMembers = async () => {
    try {
      setError(null);
      const response = await membersAPI.list({ search: debouncedSearch, status, limit: 50 });
      if (response.data && response.data.members) {
        setMembers(response.data.members);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setError('Falha ao carregar membros. Verifique a sua conexão ou tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
      INACTIVE: 'bg-red-500/10 text-red-600 border-red-500/20',
      SUSPENDED: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    };
    
    const labels = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      SUSPENDED: 'Suspenso',
    };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white leading-tight">Membros</h1>
          <p className="text-dark-500 dark:text-dark-300 mt-1 text-sm font-medium">Gestão de membros do ginásio</p>
        </div>
        <Link href="/dashboard/members/new" className="btn-primary w-full sm:w-auto justify-center">
          <PlusIcon className="h-5 w-5" />
          Novo Membro
        </Link>
      </div>

      <div className="card-glass p-3 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="relative group">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400 dark:text-dark-300 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-11 text-sm h-11 bg-white/50 dark:bg-dark-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="relative z-[1] w-full text-sm h-11 pl-4 pr-10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-xl border border-white/40 dark:border-white/[0.08] rounded-2xl font-bold text-dark-800 dark:text-white/90 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.06)] hover:border-primary-500/30 dark:hover:border-primary-400/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/40 appearance-none"
            >
              <option value="" className="bg-white dark:bg-dark-900">Status: Todos</option>
              <option value="ACTIVE" className="bg-white dark:bg-dark-900">Ativos</option>
              <option value="INACTIVE" className="bg-white dark:bg-dark-900">Inativos</option>
              <option value="SUSPENDED" className="bg-white dark:bg-dark-900">Suspensos</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-dark-400 dark:text-dark-300 z-10 group-hover:text-primary-500 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="card-glass p-0 overflow-hidden border-none sm:border-solid">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <div className="bg-red-500/10 text-red-600 p-4 rounded-2xl border border-red-500/20 max-w-md mx-auto mb-4">
              <p className="font-bold">{error}</p>
            </div>
            <button 
              onClick={loadMembers}
              className="btn bg-primary-500 text-white hover:bg-primary-600 px-6 py-2"
            >
              Tentar Novamente
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 bg-dark-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 text-dark-300">
              <MagnifyingGlassIcon className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 dark:text-white">Nenhum membro encontrado</h3>
            <p className="text-dark-500 dark:text-dark-300 mt-2 max-w-xs mx-auto">
              Não encontramos nenhum membro com os filtros aplicados.
            </p>
            {(search || status) && (
              <button 
                onClick={() => {
                  setSearch('');
                  setStatus('');
                }}
                className="mt-6 text-primary-600 font-bold hover:underline"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        ) : (
          <div className="table-container pt-0">
            <table className="table min-w-full table-responsive-cards">
              <thead className="bg-dark-900 dark:bg-black">
                <tr>
                  <th className="text-white py-5 pl-8">Membro</th>
                  <th className="text-white py-5">Contatos</th>
                  <th className="text-white py-5">Plano & Vencimento</th>
                  <th className="text-white py-5">Status</th>
                  <th className="text-white py-5 pr-8 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="group hover:bg-white/20 dark:hover:bg-dark-800/10 transition-colors">
                    <td className="py-4 pl-8" data-label="Membro">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-premium flex-shrink-0 border-2 border-white dark:border-dark-700 overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                          {member.photo ? (
                            <img 
                              src={getImageUrl(member.photo)} 
                              alt={member.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.parentElement.innerHTML = `<span class="flex items-center justify-center w-full h-full">${member.name.charAt(0)}</span>`;
                              }}
                            />
                          ) : (
                            <span className="flex items-center justify-center text-lg">{member.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-dark-900 dark:text-white leading-tight">{member.name}</p>
                          <p className="text-[10px] text-dark-400 dark:text-dark-400 font-bold uppercase tracking-widest mt-0.5">ID: #{member.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4" data-label="Contatos">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-dark-700 dark:text-dark-200">{member.phone}</p>
                        <p className="text-[10px] text-dark-400 dark:text-dark-400 truncate max-w-[150px]">{member.email || 'Sem email'}</p>
                      </div>
                    </td>
                    <td className="py-4" data-label="Plano & Vencimento">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-500">{member.plan?.name || 'Sem Plano'}</span>
                        <span className="text-[10px] font-bold text-dark-400 dark:text-dark-400 italic">
                          Vence: {member.expirationDate ? new Date(member.expirationDate).toLocaleDateString('pt-PT') : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4" data-label="Status">{getStatusBadge(member.status)}</td>
                    <td className="py-4 pr-8 text-right" data-label="Ações">
                      <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-2">
                        <button
                          onClick={() => {
                            const message = `Olá *${member.name}*! 💪\n\nAqui é da *Crosstraining Gym*. Gostaríamos de entrar em contacto.`;
                            const phone = (member.whatsapp || member.phone).replace(/[^0-9]/g, '');
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex items-center justify-center p-3.5 sm:p-2.5 rounded-2xl bg-green-500 text-white sm:bg-green-500/10 sm:text-green-600 sm:hover:bg-green-500 sm:hover:text-white transition-all shadow-lg sm:shadow-sm active:scale-95 group/btn"
                          title="WhatsApp"
                        >
                          <svg className="h-6 w-6 sm:h-5 sm:w-5 group-hover/btn:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.085.005.213.005.324.249l.454 1.109c.045.11.076.223.008.355-.077.15-.115.247-.231.38-.116.133-.242.297-.346.399-.113.111-.23.232-.1.455.13.223.578.953 1.24 1.541.856.762 1.577 1.001 1.808 1.112.23.111.364.093.5-.06.136-.153.579-.673.733-.903.154-.23.308-.192.52-.115.212.077 1.341.633 1.572.748.23.115.385.173.442.271.058.099.058.569-.086.974z"/>
                          </svg>
                        </button>
                        <Link 
                          href={`/dashboard/members/${member.id}`}
                          className="flex items-center justify-center p-3.5 sm:p-2.5 rounded-2xl bg-primary-500 text-white sm:bg-primary-500/10 sm:text-primary-600 sm:hover:bg-primary-500 sm:hover:text-white transition-all shadow-lg sm:shadow-sm active:scale-95 group/btn"
                          title="Ver Detalhes"
                        >
                          <EyeIcon className="h-6 w-6 sm:h-5 sm:w-5 group-hover/btn:scale-110 transition-transform" />
                        </Link>
                        <Link 
                          href={`/dashboard/members/${member.id}/edit`}
                          className="flex items-center justify-center p-3.5 sm:p-2.5 rounded-2xl bg-dark-600 text-white sm:bg-dark-500/10 sm:text-dark-600 dark:sm:text-dark-400 dark:sm:hover:bg-dark-700 sm:hover:bg-dark-600 sm:hover:text-white transition-all shadow-lg sm:shadow-sm active:scale-95 group/btn"
                          title="Editar"
                        >
                          <PencilSquareIcon className="h-6 w-6 sm:h-5 sm:w-5 group-hover/btn:-rotate-12 transition-transform" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
