"""
PDF Generator Service - Enhanced Version with QR Code
Gera faturas/recibos profissionais em PDF usando ReportLab + QR Code
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from io import BytesIO
import json
import os
from reportlab.pdfgen import canvas
import jwt
import qrcode
import base64

app = FastAPI(
    title="CrossFit Gym PDF Generator Advanced",
    description="Professional PDF generation with QR codes and custom branding"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Custom Colors
BRAND_ORANGE = colors.HexColor("#FF6B00")
DARK_GRAY = colors.HexColor("#2C3E50")
LIGHT_GRAY = colors.HexColor("#ECF0F1")
SUCCESS_GREEN = colors.HexColor("#27AE60")

class PaymentData(BaseModel):
    id: str
    amount: float
    member_name: str
    member_phone: str = ""
    plan_name: str
    payment_method: str
    receipt_number: str = None
    payment_date: str = None

class CompanyInfo(BaseModel):
    name: str = "CROSSTRAINING GYM"
    nuit: str = "123456789"
    address: str = "Avenida Julius Nyerere, Maputo, Moçambique"
    phone: str = "+258 21 300 500"
    email: str = "info@crosstraininggym.co.mz"
    website: str = "www.crosstraininggym.co.mz"

def amount_in_words(num):
    """Converte número para palavras em português"""
    val = float(num)
    
    units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"]
    teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
    tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
    
    if val == 0:
        return "zero meticais"
    
    mzn = int(val)
    cents = int(round((val - mzn) * 100))
    
    def convert_to_words(n):
        if n == 0:
            return ""
        elif n < 10:
            return units[n]
        elif n < 20:
            return teens[n - 10]
        elif n < 100:
            return tens[n // 10] + (" e " + units[n % 10] if n % 10 != 0 else "")
        elif n < 1000:
            return units[n // 100] + " centos" + (" e " + convert_to_words(n % 100) if n % 100 != 0 else "")
        elif n < 1000000:
            return convert_to_words(n // 1000) + " mil" + (" e " + convert_to_words(n % 1000) if n % 1000 != 0 else "")
        return str(n)
    
    words = convert_to_words(mzn) + " meticais"
    if cents > 0:
        words += " e " + convert_to_words(cents) + " centavos"
    
    return words.strip()

def generate_qr_code(data: str) -> BytesIO:
    """Generate QR code image"""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        qr_bytes = BytesIO()
        img.save(qr_bytes, format='PNG')
        qr_bytes.seek(0)
        return qr_bytes
    except Exception as e:
        print(f"QR Code generation failed: {e}")
        return None

def generate_pdf_receipt(payment: PaymentData, company: CompanyInfo) -> BytesIO:
    """Generate professional PDF receipt with QR code"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm,
        title=f"Recibo {payment.receipt_number or payment.id[:8]}"
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    company_style = ParagraphStyle(
        'CompanyName',
        parent=styles['Normal'],
        fontSize=18,
        textColor=BRAND_ORANGE,
        spaceAfter=2,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=9,
        textColor=DARK_GRAY,
        spaceAfter=1,
        alignment=TA_CENTER,
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontSize=16,
        textColor=BRAND_ORANGE,
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=9,
        textColor=DARK_GRAY,
        fontName='Helvetica-Bold',
    )
    
    value_style = ParagraphStyle(
        'Value',
        parent=styles['Normal'],
        fontSize=10,
        textColor=DARK_GRAY,
    )
    
    # Company header
    story.append(Paragraph(company.name, company_style))
    story.append(Paragraph(f"NUIT: {company.nuit}", subtitle_style))
    story.append(Paragraph(company.address, subtitle_style))
    story.append(Paragraph(f"Tel: {company.phone} | Email: {company.email}", subtitle_style))
    story.append(Spacer(1, 8*mm))
    
    # Receipt title with status badge
    title_table = Table([
        [Paragraph("RECIBO DE PAGAMENTO", header_style), Paragraph("✓ PAGO", ParagraphStyle(
            'Paid',
            parent=styles['Normal'],
            fontSize=11,
            textColor=SUCCESS_GREEN,
            fontName='Helvetica-Bold',
            alignment=TA_RIGHT
        ))]
    ], colWidths=[150*mm, 50*mm])
    story.append(title_table)
    story.append(Spacer(1, 5*mm))
    
    # Receipt number and date
    receipt_date = datetime.fromisoformat(payment.payment_date) if payment.payment_date else datetime.now()
    info_data = [
        [Paragraph("Número do Recibo:", label_style), Paragraph(str(payment.receipt_number or payment.id[:8]), value_style)],
        [Paragraph("Data:", label_style), Paragraph(receipt_date.strftime("%d/%m/%Y"), value_style)],
        [Paragraph("Hora:", label_style), Paragraph(receipt_date.strftime("%H:%M:%S"), value_style)],
    ]
    
    info_table = Table(info_data, colWidths=[70*mm, 130*mm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), LIGHT_GRAY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDINGTOP', (0, 0), (-1, -1), 5),
        ('PADDINGBOTTOM', (0, 0), (-1, -1), 5),
        ('PADDINGLEFT', (1, 0), (1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 8*mm))
    
    # Member details
    story.append(Paragraph("DETALHES DO CLIENTE", ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontSize=11,
        textColor=DARK_GRAY,
        fontName='Helvetica-Bold',
        spaceAfter=3,
    )))
    
    member_data = [
        [Paragraph("Nome:", label_style), Paragraph(payment.member_name, value_style)],
        [Paragraph("Telefone:", label_style), Paragraph(payment.member_phone or "—", value_style)],
        [Paragraph("Plano:", label_style), Paragraph(payment.plan_name, value_style)],
    ]
    
    member_table = Table(member_data, colWidths=[70*mm, 130*mm])
    member_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), LIGHT_GRAY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDINGTOP', (0, 0), (-1, -1), 5),
        ('PADDINGBOTTOM', (0, 0), (-1, -1), 5),
        ('PADDINGLEFT', (1, 0), (1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(member_table)
    story.append(Spacer(1, 8*mm))
    
    # Payment details - Amount highlighted
    story.append(Paragraph("DETALHES DO PAGAMENTO", ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontSize=11,
        textColor=DARK_GRAY,
        fontName='Helvetica-Bold',
        spaceAfter=3,
    )))
    
    amount_words = amount_in_words(payment.amount)
    payment_data = [
        [Paragraph("Método de Pagamento:", label_style), Paragraph(payment.payment_method, value_style)],
        [Paragraph("Valor em Palavras:", label_style), Paragraph(amount_words, ParagraphStyle(
            'AmountWords',
            parent=styles['Normal'],
            fontSize=9,
            textColor=BRAND_ORANGE,
            fontName='Helvetica-Bold',
        ))],
    ]
    
    payment_table = Table(payment_data, colWidths=[70*mm, 130*mm])
    payment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), LIGHT_GRAY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDINGTOP', (0, 0), (-1, -1), 5),
        ('PADDINGBOTTOM', (0, 0), (-1, -1), 5),
        ('PADDINGLEFT', (1, 0), (1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(payment_table)
    story.append(Spacer(1, 8*mm))
    
    # Large amount box
    amount_box_data = [[
        Paragraph(f"MZN {payment.amount:,.2f}", ParagraphStyle(
            'AmountValue',
            parent=styles['Normal'],
            fontSize=28,
            textColor=BRAND_ORANGE,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
        ))
    ]]
    amount_box_table = Table(amount_box_data, colWidths=[200*mm])
    amount_box_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDINGTOP', (0, 0), (-1, -1), 15),
        ('PADDINGBOTTOM', (0, 0), (-1, -1), 15),
        ('GRID', (0, 0), (-1, -1), 1, BRAND_ORANGE),
    ]))
    story.append(amount_box_table)
    story.append(Spacer(1, 8*mm))
    
    # QR Code - Link para verificação
    qr_data = json.dumps({
        "id": payment.id,
        "amount": payment.amount,
        "member": payment.member_name,
        "date": payment.payment_date,
        "receipt": payment.receipt_number or payment.id[:8]
    })
    
    qr_img = generate_qr_code(qr_data)
    if qr_img:
        try:
            qr_table = Table([[Image(qr_img, width=30*mm, height=30*mm)]], colWidths=[30*mm])
            qr_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(qr_table)
            story.append(Spacer(1, 3*mm))
            story.append(Paragraph("Leia o código QR para verificar este recibo", ParagraphStyle(
                'QRLabel',
                parent=styles['Normal'],
                fontSize=8,
                textColor=DARK_GRAY,
                alignment=TA_CENTER,
            )))
        except Exception as e:
            print(f"QR code embedding failed: {e}")
    
    story.append(Spacer(1, 8*mm))
    
    # Footer
    story.append(Paragraph("_" * 50, ParagraphStyle(
        'Line',
        parent=styles['Normal'],
        fontSize=6,
        textColor=LIGHT_GRAY,
        alignment=TA_CENTER,
    )))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("Obrigado pela sua confiança!", ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=10,
        textColor=BRAND_ORANGE,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )))
    story.append(Paragraph("Este documento é válido sem assinatura ou carimbo", ParagraphStyle(
        'FooterNote',
        parent=styles['Normal'],
        fontSize=7,
        textColor=DARK_GRAY,
        alignment=TA_CENTER,
        spaceAfter=2,
    )))
    story.append(Paragraph(f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", ParagraphStyle(
        'GeneratedDate',
        parent=styles['Normal'],
        fontSize=7,
        textColor=colors.grey,
        alignment=TA_CENTER,
    )))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer

def verify_token(token: str = None):
    """Verify JWT token"""
    try:
        if not token:
            raise HTTPException(status_code=401, detail="Token required")
        jwt.decode(token, options={"verify_signature": False})  # Verify structure only
        return True
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

@app.get("/health")
async def health_check():
    """Service health check"""
    return {"status": "healthy", "service": "PDF Generator", "version": "2.0"}

@app.post("/generate-pdf")
async def generate_pdf(payment: PaymentData, token: str = None):
    """Generate PDF receipt with optional QR code"""
    try:
        # Optional token verification
        if token:
            verify_token(token)
        
        company = CompanyInfo()
        pdf_buffer = generate_pdf_receipt(payment, company)
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="recibo-{payment.receipt_number or payment.id[:8]}.pdf"',
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle CORS preflight requests"""
    return {"detail": "OPTIONS OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)
