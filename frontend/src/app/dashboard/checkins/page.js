'use client';

import { useEffect, useState } from 'react';
import { checkinsAPI, UPLOAD_URL, getImageUrl } from '@/lib/api';
import { 
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function CheckinsPage() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCheckins();
    // Auto-refresh logs every 15 seconds
    const interval = setInterval(loadCheckins, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadCheckins = async () => {
    try {
      if (checkins.length > 0) setIsRefreshing(true);
      const response = await checkinsAPI.list({ limit: 50 });
      setCheckins(response.data.checkins || []);
    } catch (error) {
      console.error('Error loading checkins:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-900">Registo de Presenças</h1>
          <p className="text-gray-500 dark:text-dark-300 mt-1">Monitorização de entradas em tempo real</p>
        </div>
        <button 
          onClick={() => { setLoading(true); loadCheckins(); }} 
          className="btn-secondary"
          disabled={isRefreshing}
        >
          <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="card-glass p-0 overflow-hidden">
        {loading && checkins.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="table-container pt-4">
            <table className="table min-w-full table-responsive-cards">
              <thead className="bg-dark-900 dark:bg-black">
                <tr>
                  <th className="text-white py-5 pl-8 rounded-tl-3xl">Membro</th>
                  <th className="text-white py-5">Horário</th>
                  <th className="text-white py-5">Data</th>
                  <th className="text-white py-5">Método</th>
                  <th className="text-white py-5 pr-8 text-right rounded-tr-3xl">Estado</th>
                </tr>
              </thead>
              <tbody>
                {checkins.length === 0 ? (
                   <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500 dark:text-dark-300">
                      Sem registos de hoje
                    </td>
                  </tr>
                ) : (
                  checkins.map((checkin) => (
                    <tr key={checkin.id} className="hover:bg-white/20 dark:hover:bg-dark-800/10 transition-colors">
                      <td className="py-4 pl-8" data-label="Membro">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                            {checkin.member?.photo ? (
                              <img src={getImageUrl(checkin.member.photo)} alt={checkin.member.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              checkin.member?.name?.charAt(0) || <UserIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-dark-900 dark:text-white leading-tight">{checkin.member?.name || 'Membro Desconhecido'}</p>
                            <p className="text-[10px] text-dark-400 font-bold uppercase tracking-tighter">{checkin.member?.plan?.name || 'Sem plano'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4" data-label="Horário">
                        <div className="flex items-center gap-2 text-dark-700 dark:text-dark-200 font-medium">
                          <ClockIcon className="h-4 w-4 text-primary-500" />
                          {formatTime(checkin.checkinDatetime)}
                        </div>
                      </td>
                      <td className="py-4 text-gray-600 dark:text-dark-400" data-label="Data">
                        <div className="flex items-center gap-2">
                           <CalendarIcon className="h-4 w-4 text-gray-400" />
                           {formatDate(checkin.checkinDatetime)}
                        </div>
                      </td>
                      <td className="py-4" data-label="Método">
                        <span className="text-[10px] px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-lg font-bold border border-blue-500/20 uppercase tracking-tighter">
                          {checkin.method || 'Biometria'}
                        </span>
                      </td>
                      <td className="py-4 pr-8 text-right" data-label="Estado">
                        <div className="flex items-center justify-end">
                          <span className="badge badge-success flex w-fit items-center gap-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            Permitido
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
