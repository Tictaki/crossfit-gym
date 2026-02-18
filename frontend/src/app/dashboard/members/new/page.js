'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { membersAPI } from '@/lib/api';

export default function NewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthDate: '',
    gender: 'MALE',
    notes: '',
  });
  const [photo, setPhoto] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (photo) {
        data.append('photo', photo);
      }

      await membersAPI.create(data);
      router.push('/dashboard/members');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-dark-900">Novo Membro</h1>
        <p className="text-gray-500 dark:text-dark-300 mt-1">Cadastrar novo membro do ginásio</p>
      </div>

      {error && (
        <div className="card bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Nome Completo *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Telefone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input"
            placeholder="+258 XX XXX XXXX"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Data de Nascimento *</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Sexo *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Feminino</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Foto (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            className="input"
          />
          <p className="text-xs text-gray-500 dark:text-dark-300 mt-1">Formatos: JPG, PNG (máx. 5MB)</p>
        </div>

        <div>
          <label className="label">Observações (opcional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input"
            rows="3"
            placeholder="Notas adicionais sobre o membro..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'A criar...' : 'Criar Membro'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-700">
          <p className="font-semibold">ℹ️ Próximos Passos:</p>
          <p className="mt-1">Após criar o membro, você poderá associar um plano e registrar o primeiro pagamento na página de detalhes.</p>
        </div>
      </form>
    </div>
  );
}
