#!/usr/bin/env python
"""
Script para testar o PDF Generator Service
"""

import requests
import json
from datetime import datetime

# Configuração
PDF_SERVICE_URL = "http://localhost:3002"
TEST_TOKEN = "test-token-123"

# Dados de teste
test_payment = {
    "id": "test-payment-001",
    "amount": 5000.00,
    "member_name": "manildo",
    "member_phone": "258871234567",
    "plan_name": "Plano Família",
    "payment_method": "CASH",
    "receipt_number": "00000001",
    "payment_date": datetime.now().isoformat()
}


def test_health():
    """Testa health check"""
    print("[TEST] Verificando saúde do serviço...")
    try:
        response = requests.get(f"{PDF_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check OK")
            print(f"   Resposta: {response.json()}")
            return True
        else:
            print(f"❌ Health check falhou: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return False


def test_generate_pdf():
    """Testa geração de PDF"""
    print("\n[TEST] Gerando PDF...")
    try:
        response = requests.post(
            f"{PDF_SERVICE_URL}/generate-pdf",
            json=test_payment,
            params={"token": TEST_TOKEN},
            timeout=10
        )
        
        if response.status_code == 200:
            # Salvar PDF
            pdf_size = len(response.content)
            filename = f"test_receipt_{test_payment['receipt_number']}.pdf"
            with open(filename, "wb") as f:
                f.write(response.content)
            
            print(f"✅ PDF gerado com sucesso!")
            print(f"   Tamanho: {pdf_size} bytes")
            print(f"   Salvo em: {filename}")
            print(f"   Content-Type: {response.headers.get('Content-Type')}")
            return True
        else:
            print(f"❌ Erro ao gerar PDF: {response.status_code}")
            print(f"   Resposta: {response.text}")
            return False
    
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False


def test_multiple_pdfs():
    """Testa múltiplos PDFs"""
    print("\n[TEST] Gerando múltiplos PDFs...")
    
    members = [
        "manildo",
        "josé silva",
        "maria santos"
    ]
    
    for i, member in enumerate(members, 1):
        payment = test_payment.copy()
        payment["id"] = f"payment-{i:03d}"
        payment["member_name"] = member
        payment["receipt_number"] = f"{i:08d}"
        payment["amount"] = 1000 * i
        
        try:
            response = requests.post(
                f"{PDF_SERVICE_URL}/generate-pdf",
                json=payment,
                params={"token": TEST_TOKEN},
                timeout=10
            )
            
            if response.status_code == 200:
                filename = f"receipt_{member}_{payment['receipt_number']}.pdf"
                with open(filename, "wb") as f:
                    f.write(response.content)
                print(f"✅ {member.upper()}: {len(response.content)} bytes → {filename}")
            else:
                print(f"❌ {member}: Erro {response.status_code}")
        
        except Exception as e:
            print(f"❌ {member}: {str(e)}")


def main():
    print("=" * 60)
    print("🧪 PDF Generator Service - Test Suite")
    print("=" * 60)
    
    # Teste 1: Health Check
    if not test_health():
        print("\n⚠️  Serviço não está acessível!")
        print("   Certifique-se que pdf_generator.py está rodando em localhost:3002")
        return
    
    # Teste 2: Gerar PDF simples
    test_generate_pdf()
    
    # Teste 3: Múltiplos PDFs
    test_multiple_pdfs()
    
    print("\n" + "=" * 60)
    print("✅ Testes concluídos!")
    print("=" * 60)


if __name__ == "__main__":
    main()
