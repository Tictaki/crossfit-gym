"""
Test suite for Professional Invoice Generator v3.0
"""

import json
from pdf_generator_v3 import (
    InvoiceData, LineItem, CompanyData, generate_professional_invoice,
    calculate_totals, amount_in_portuguese
)
from datetime import datetime, timedelta

def test_amount_conversion():
    """Test amount to Portuguese words conversion"""
    print("🧪 Testing amount conversion...")
    assert amount_in_portuguese(0) == "zero meticais"
    assert amount_in_portuguese(1) == "um meticais"
    assert amount_in_portuguese(100) == "cem meticais"
    assert "mil" in amount_in_portuguese(1500)
    print("✓ Amount conversion tests passed")

def test_totals_calculation():
    """Test totals calculation with discount and tax"""
    print("🧪 Testing totals calculation...")
    
    items = [
        LineItem(description="Serviço A", quantity=2, unit_price=1000),
        LineItem(description="Serviço B", quantity=1, unit_price=500),
    ]
    
    totals = calculate_totals(items, discount=10, tax=5)
    
    assert totals['subtotal'] == 2500  # 2000 + 500
    assert totals['discount'] == 250   # 10% de 2500
    assert totals['tax'] == 112.5      # 5% de 2250
    assert totals['total'] == 2362.5   # 2250 + 112.5
    
    print("✓ Totals calculation tests passed")

def test_invoice_generation():
    """Test PDF invoice generation"""
    print("🧪 Testing invoice generation...")
    
    # Create test invoice
    invoice = InvoiceData(
        invoice_number="INV-20260216-001",
        invoice_date=datetime.now().isoformat(),
        due_date=(datetime.now() + timedelta(days=15)).isoformat(),
        client_name="João Silva",
        client_phone="+258 84 123 4567",
        client_email="joao@example.com",
        client_address="Maputo, Moçambique",
        items=[
            LineItem(description="Mensalidade Premium", quantity=1, unit_price=2500),
            LineItem(description="Taxa de Inscrição", quantity=1, unit_price=500),
            LineItem(description="Treinamento Especial", quantity=2, unit_price=800),
        ],
        discount=5,
        tax_percentage=10,
        payment_method="Dinheiro Móvel",
        payment_reference="MTN123456789",
        notes="Agradecemos sua confiança e frequência!",
        terms="Pagamento até a data de vencimento indica aceitação dos termos."
    )
    
    # Generate PDF
    company = CompanyData()
    pdf_buffer = generate_professional_invoice(invoice, company)
    
    # Save test file
    with open('test_invoice_v3.pdf', 'wb') as f:
        f.write(pdf_buffer.getvalue())
    
    print(f"✓ Invoice generated: test_invoice_v3.pdf ({len(pdf_buffer.getvalue())} bytes)")

def test_complex_invoice():
    """Test invoice with many items"""
    print("🧪 Testing complex invoice...")
    
    items = [
        LineItem(description="Acesso Mensal - Básico", quantity=1, unit_price=1500),
        LineItem(description="Aulas de Crossfit", quantity=4, unit_price=300),
        LineItem(description="Nutrição Consultoria", quantity=1, unit_price=2000),
        LineItem(description="Aparelhos Premium", quantity=2, unit_price=500),
    ]
    
    invoice = InvoiceData(
        invoice_number="INV-20260216-COMPLEX",
        client_name="Academia XYZ",
        client_phone="+258 21 490 490",
        client_nuit="987654321",
        items=items,
        discount=15,
        tax_percentage=17,
        payment_method="Transferência Bancária",
    )
    
    company = CompanyData()
    pdf_buffer = generate_professional_invoice(invoice, company)
    
    with open('test_invoice_complex_v3.pdf', 'wb') as f:
        f.write(pdf_buffer.getvalue())
    
    print(f"✓ Complex invoice generated: test_invoice_complex_v3.pdf")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Professional Invoice Generator v3.0 - Test Suite")
    print("="*60 + "\n")
    
    try:
        test_amount_conversion()
        test_totals_calculation()
        test_invoice_generation()
        test_complex_invoice()
        
        print("\n" + "="*60)
        print("✅ All tests passed!")
        print("="*60 + "\n")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
