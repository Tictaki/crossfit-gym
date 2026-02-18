# PDF Generator Service - Python

Gerador de PDFs para recibos/faturas usando Python com ReportLab.

## ✅ Instalação

### 1. Instalar Python 3.10+
Baixe em https://www.python.org/downloads/

### 2. Instalar dependências

```powershell
# Abra o PowerShell em: d:\crossfit gym
cd "d:\crossfit gym"

# Crie um ambiente virtual (recomendado)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Instale os pacotes
pip install -r requirements.txt
```

## 🚀 Executar o Serviço

```powershell
# Dentro do ambiente virtual
cd "d:\crossfit gym"
python pdf_generator.py
```

O serviço irá rodar em: **http://localhost:3002**

## 📝 API Endpoints

### Health Check
```
GET http://localhost:3002/health
```

Resposta:
```json
{"status": "ok", "service": "PDF Generator"}
```

### Gerar PDF
```
POST http://localhost:3002/generate-pdf?token=YOUR_TOKEN
Content-Type: application/json

{
  "id": "payment-123",
  "amount": 5000.00,
  "member_name": "João Silva",
  "member_phone": "258871234567",
  "plan_name": "Plano Família",
  "payment_method": "CASH",
  "receipt_number": "00000001",
  "payment_date": "2026-02-15T10:30:00"
}
```

Resposta: Arquivo PDF com Content-Type `application/pdf`

## 🔌 Integração com Node.js Backend

Na rota de pagamentos do Node.js, você pode fazer chamadas para este serviço:

```javascript
// Em backend/src/routes/payments.routes.js
const pdfUrl = `http://localhost:3002/generate-pdf?token=${token}`;

// Ou fazer POST para gerar:
const response = await fetch('http://localhost:3002/generate-pdf?token=' + token, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: payment.id,
    amount: payment.amount,
    member_name: payment.member.name,
    member_phone: payment.member.phone,
    plan_name: payment.plan.name,
    payment_method: payment.paymentMethod,
    receipt_number: payment.receiptNumber,
    payment_date: payment.paymentDate
  })
});
```

## ✨ Vantagens vs Node.js PDFKit

1. **ReportLab**: Biblioteca mais robusta para Python
2. **Melhor controle**: Mais flexibilidade em layout
3. **Compatibilidade**: Funciona com iframes sem problemas
4. **Escalabilidade**: Pode ser containerizado com Docker
5. **Alternativa**: Rápido mudar entre Node.js e Python

## 🐛 Troubleshooting

### Porta 3002 já está em uso
```powershell
# Matar processo na porta 3002
$process = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }
```

### ModuleNotFoundError
```powershell
# Certifique-se que o ambiente virtual está ativado
.\venv\Scripts\Activate.ps1

# Reinstale dependências
pip install -r requirements.txt --force-reinstall
```

## 📞 Suporte

Para modificar o layout do PDF, edite a função `generate_pdf_receipt()` em `pdf_generator.py`.
