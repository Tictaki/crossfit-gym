"""
PDF Generator Service - Python Backend
Gera faturas/recibos em PDF usando ReportLab
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
import json
import os
from fastapi.responses import StreamingResponse
import jwt
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CrossFit Gym PDF Generator")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class PaymentData(BaseModel):
    id: str
    amount: float
    member_name: str
    member_phone: str
    plan_name: str
    payment_method: str
    receipt_number: str
    payment_date: str = None


def amount_in_words(num):
    """Converte número para palavras em português"""
    val = float(num)
    if val < 1000:
        return f"{val:.2f} meticais"
    elif val < 10000:
        return f"{val/1000:.1f} mil meticais"
    elif val < 1000000:
        return f"{val/1000:.0f} mil meticais"
    else:
        return f"{val/1000000:.1f} milhões de meticais"


def generate_pdf_receipt(payment: PaymentData) -> BytesIO:
    """Gera PDF de recibo/fatura"""
    
    buffer = BytesIO()
    
    # Configuração do documento
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    company_style = ParagraphStyle(
        'CompanyStyle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1A1A1A'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    title_style = ParagraphStyle(
        'TitleStyle',
        fontSize=36,
        textColor=colors.HexColor('#FF6B00'),
        spaceAfter=24,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        fontName='Helvetica'
    )
    
    value_style = ParagraphStyle(
        'ValueStyle',
        fontSize=11,
        textColor=colors.HexColor('#000000'),
        fontName='Helvetica-Bold'
    )
    
    footer_style = ParagraphStyle(
        'FooterStyle',
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    # Data for PDF
    elements = []
    
    # Company Header
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("CROSSTRAINING GYM", company_style))
    elements.append(Paragraph("NUIT: 401996397", styles['Normal']))
    elements.append(Paragraph("Morada: Cuamba, Moçambique", styles['Normal']))
    elements.append(Paragraph("Telefone: +258 87 123 4567", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Title
    elements.append(Paragraph("RECIBO", title_style))
    
    # Receipt Details Table
    payment_date = datetime.fromisoformat(payment.payment_date).strftime('%d/%m/%Y') if payment.payment_date else datetime.now().strftime('%d/%m/%Y')
    
    data = [
        ['Nº Recibo:', payment.receipt_number],
        ['Membro:', payment.member_name],
        ['Contacto:', payment.member_phone],
        ['Plano:', payment.plan_name],
        ['Importância:', f"{payment.amount:.2f} MZN"],
        ['Em Palavras:', amount_in_words(payment.amount)],
        ['Forma de Pagamento:', payment.payment_method],
        ['Data de Pagamento:', payment_date],
    ]
    
    details_table = Table(data, colWidths=[4*cm, 12*cm])
    details_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica', 10),
        ('FONT', (1, 0), (1, -1), 'Helvetica-Bold', 11),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#000000')),
        ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#E5E5E5')),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(details_table)
    elements.append(Spacer(1, 24))
    
    # Signature Line
    elements.append(Paragraph("Assinatura do Recebedor", label_style))
    elements.append(Spacer(1, 2))
    elements.append(Paragraph("_" * 80, styles['Normal']))
    elements.append(Spacer(1, 24))
    
    # Footer
    elements.append(Paragraph("Obrigado pela sua preferência!", footer_style))
    elements.append(Paragraph("Contacte-nos: +258 87 123 4567 | www.crosstraininggym.mz", footer_style))
    elements.append(Spacer(1, 12))
    
    # Status Badge
    status_style = ParagraphStyle(
        'StatusStyle',
        fontSize=14,
        textColor=colors.white,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        textTransform='uppercase'
    )
    
    status_table = Table([['✓ PAGO']], colWidths=[16*cm])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FF6B00')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONT', (0, 0), (-1, -1), 'Helvetica-Bold', 14),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    
    elements.append(status_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "PDF Generator"}


@app.post("/generate-pdf")
async def generate_pdf(payment: PaymentData, token: str = Query(None)):
    """Generate PDF receipt"""
    
    try:
        if not token:
            raise HTTPException(status_code=401, detail="Token required")
        
        print(f"[PDF] Generating receipt for payment: {payment.id}")
        
        # Generate PDF
        pdf_buffer = generate_pdf_receipt(payment)
        
        print(f"[PDF] Receipt generated: {len(pdf_buffer.getvalue())} bytes")
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=recibo-{payment.receipt_number}.pdf",
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            }
        )
    
    except Exception as e:
        print(f"[PDF] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pdf/{payment_id}")
async def get_pdf(payment_id: str, token: str = Query(None)):
    """Compatibilidade com endpoint Node.js"""
    
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Este endpoint pode ser expandido para buscar dados do banco de dados
    # Por enquanto retorna um erro de simplicidade
    raise HTTPException(status_code=501, detail="Direct PDF generation not implemented. Use POST /generate-pdf")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)
