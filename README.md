# CrossFit Gym Management System

Sistema completo de gestão para ginásio CrossFit em Moçambique.

---

### 📊 Estado do Projeto

✅ **Core Services running** (Frontend: 3000, Backend: 3001, PDF Service: 3002)  
✅ **Database Migrations Complete**  
✅ **Auth & RBAC Active**

---

## 🚀 Tecnologias

### Backend

- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- PDF Generation (PDFKit)
- Excel Export (xlsx)
- QR Code Generation

### Frontend

- Next.js 14 (App Router)
- React
- Tailwind CSS
- Axios
- Recharts (gráficos)

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env com as credenciais do PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/crosstraininggym?schema=public"
# JWT_SECRET="your-secret-key-change-this"

# Criar diretório de uploads
mkdir uploads
mkdir uploads/members

# Executar migrations
npm run migrate

# Seed inicial (cria admin e planos)
npm run seed

# Iniciar servidor
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# IMPORTANTE: Instalar heroicons para os ícones
npm install @heroicons/react

# Copiar variáveis de ambiente
cp .env.example .env.local

# Iniciar aplicação
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 🔐 Credenciais Padrão

Após executar o seed:

**Administrador:**

- Email: `admin@crossfitgym.com`
- Password: `admin123`

**Recepcionista:**

- Email: `recepcao@crossfitgym.com`
- Password: `recepcao123`

## 📁 Estrutura do Projeto

```
crossfit-gym/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
└── README.md
```

## 🎯 Funcionalidades

### Gestão de Membros

- ✅ Cadastro completo com foto
- ✅ Edição e suspensão
- ✅ Histórico de pagamentos
- ✅ Histórico de presenças
- ✅ Geração de QR Code
- ✅ Status automático (Ativo/Inativo)

### Gestão de Planos

- ✅ Criação e edição (admin)
- ✅ Planos pré-configurados

### Pagamentos

- ✅ Registro rápido
- ✅ Múltiplos métodos (Dinheiro, M-Pesa, e-Mola, Transferência)
- ✅ Geração de recibo PDF
- ✅ Relatórios diários e mensais
- ✅ Exportação para Excel
- ✅ Atualização automática de vencimento

### Presenças (Check-in)

- ✅ Check-in manual
- ✅ Scanner QR Code (preparado)
- ✅ Bloqueio para inadimplentes
- ✅ Relatório de frequência

### Dashboard

- ✅ Métricas em tempo real
- ✅ Gráficos de receita
- ✅ Membros que vencem em breve
- ✅ Alertas de inadimplência

### Relatórios

- ✅ Receita por plano
- ✅ Lista de inadimplentes
- ✅ Crescimento de membros
- ✅ Membros com baixa frequência

## 🔄 Próximos Passos

1. **Configurar PostgreSQL** localmente
2. **Executar migrations** no backend
3. **Executar seed** para dados iniciais
4. **Instalar heroicons** no frontend
5. **Testar login** com credenciais padrão
6. **Cadastrar primeiro membro real**
7. **Registrar primeiro pagamento**

## 📝 Notas

- O sistema atualiza automaticamente o status dos membros quando o vencimento expira
- Check-in é bloqueado para membros inativos ou suspensos
- Todas as rotas (exceto login) requerem autenticação JWT
- Rotas de admin (criar planos, gerir utilizadores) requerem role ADMIN

## 🐛 Troubleshooting

**Erro de conexão com PostgreSQL:**

- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`

**Erro ao fazer login:**

- Execute o seed: `npm run seed`
- Verifique se o JWT_SECRET está definido

**Heroicons não encontrado:**

```bash
cd frontend
npm install @heroicons/react
```

## 📞 Suporte

Para questões técnicas ou bugs, contacte o administrador do sistema.

---

**Desenvolvido para CrossFit Gym - Moçambique 🇲🇿**
