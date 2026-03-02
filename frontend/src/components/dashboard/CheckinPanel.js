'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  TicketIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { membersAPI, checkinsAPI, UPLOAD_URL } from '@/lib/api';

export default function CheckinPanel({ isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [checkinStatus, setCheckinStatus] = useState(null); // 'success', 'error', 'pending'
  const [message, setMessage] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      setSearch('');
      setMembers([]);
      setSelectedMember(null);
      setCheckinStatus(null);
      setMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.length >= 3) {
        handleSearch();
      } else {
        setMembers([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await membersAPI.list({ search, limit: 5 });
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error searching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setCheckinStatus(null);
    setMessage('');
  };

  const handleCheckin = async () => {
    if (!selectedMember) return;

    setCheckinStatus('pending');
    try {
      const response = await checkinsAPI.create({ memberId: selectedMember.id });
      setCheckinStatus('success');
      setMessage(response.data.message || 'Check-in realizado com sucesso!');
      
      // Auto close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setCheckinStatus('error');
      setMessage(error.response?.data?.message || 'Erro ao realizar check-in.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex md:pl-10">
        <div className="w-screen max-w-md animate-slide-up md:animate-slide-in-right">
          <div className="h-full flex flex-col bg-white dark:bg-dark-900 shadow-2xl border-l border-white/20 dark:border-dark-800">
            {/* Header */}
            <div className="px-6 py-8 border-b border-gray-100 dark:border-dark-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                  <TicketIcon className="h-6 w-6 text-primary-500" />
                  Registar Entrada
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors">
                  <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-dark-300" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-dark-300 dark:text-dark-400 mt-2">Validação em tempo real de membros</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Nome ou Telefone do membro..."
                  className="input pl-12 h-14 text-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {loading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                  </div>
                )}
              </div>

              {/* Members List */}
              {members.length > 0 && !selectedMember && (
                <div className="space-y-2 animate-fade-in">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Resultados</p>
                  {members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectMember(member)}
                      className="w-full flex items-center p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-dark-800 border border-transparent hover:border-gray-200 dark:hover:border-dark-700 transition-all text-left group"
                    >
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 dark:bg-dark-800 mr-4 shadow-inner border border-gray-200 dark:border-dark-700 flex items-center justify-center text-gray-400 font-bold">
                        {member.photo ? (
                          <img 
                            src={`${UPLOAD_URL}${member.photo}`} 
                            alt={member.name} 
                            className="h-full w-full object-cover" 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<span>${member.name.charAt(0)}</span>`;
                            }}
                          />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-dark-900 dark:text-white group-hover:text-primary-600 transition-colors">{member.name}</p>
                        <p className="text-xs text-gray-500 dark:text-dark-300">{member.phone}</p>
                      </div>
                      <div className={`badge ${member.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {member.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Member Detail & Action */}
              {selectedMember && (
                <div className="animate-fade-in space-y-6">
                  <div className="p-6 rounded-3xl bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700 text-center">
                    <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 border-4 border-white dark:border-dark-700 shadow-2xl overflow-hidden relative">
                      {selectedMember.photo ? (
                        <img 
                          src={`${UPLOAD_URL}${selectedMember.photo}`} 
                          alt={selectedMember.name} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<span class="flex items-center justify-center w-full h-full">${selectedMember.name.charAt(0)}</span>`;
                          }}
                        />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full">{selectedMember.name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-dark-900 dark:text-white">{selectedMember.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-dark-300 mb-4">{selectedMember.phone}</p>
                    
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="p-3 bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Estado</p>
                        <div className="flex items-center gap-2">
                           <div className={`h-2 w-2 rounded-full ${selectedMember.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                           <span className="text-sm font-bold text-dark-800 dark:text-white">{selectedMember.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Vencimento</p>
                        <div className="flex items-center gap-2">
                           <CalendarIcon className="h-4 w-4 text-primary-500" />
                           <span className="text-sm font-bold text-dark-800 dark:text-white">
                             {selectedMember.expirationDate ? new Date(selectedMember.expirationDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : 'N/A'}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {checkinStatus === 'success' && (
                    <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 flex items-center gap-3 animate-fade-in shadow-sm shadow-green-500/10">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-500" />
                      <p className="text-green-700 dark:text-green-400 font-bold text-sm">{message}</p>
                    </div>
                  )}

                  {checkinStatus === 'error' && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center gap-3 animate-fade-in shadow-sm shadow-red-500/10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-500" />
                      <div>
                        <p className="text-red-700 dark:text-red-400 font-bold text-sm">Entrada Negada</p>
                        <p className="text-[10px] text-red-600/80 dark:text-red-400/80">{message}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handleCheckin}
                      disabled={checkinStatus === 'pending' || checkinStatus === 'success'}
                      className={`btn-primary w-full h-14 text-lg shadow-glow-primary ${checkinStatus === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : ''}`}
                    >
                      {checkinStatus === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>A validar...</span>
                        </div>
                      ) : checkinStatus === 'success' ? (
                        <div className="flex items-center gap-2">
                           <CheckCircleIcon className="h-6 w-6" />
                           <span>Confirmado</span>
                        </div>
                      ) : (
                        'Confirmar Entrada'
                      )}
                    </button>
                    
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="w-full h-12 text-sm font-bold text-gray-500 dark:text-dark-300 hover:text-dark-900 dark:hover:text-white transition-colors"
                    >
                      Alterar Membro
                    </button>
                  </div>
                </div>
              )}

              {search.length > 0 && search.length < 3 && !selectedMember && (
                <p className="text-center text-sm text-gray-400 py-10">Escreva pelo menos 3 caracteres...</p>
              )}

              {search.length >= 3 && members.length === 0 && !loading && !selectedMember && (
                <div className="text-center py-10 space-y-2">
                  <UserIcon className="h-12 w-12 text-gray-200 mx-auto" />
                  <p className="text-sm text-gray-400">Nenhum membro encontrado.</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 text-center border-t border-gray-100 dark:border-dark-800">
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Gymove Security Check</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
