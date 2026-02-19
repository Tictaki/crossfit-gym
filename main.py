"""
Professional Invoice Generator - ReportLab Enhanced
Sistema profissional de geração de faturas com ReportLab
Versão 3.0 com design melhorado, validações e funcionalidades avançadas
"""

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib import colors
from reportlab.lib.units import mm, cm, inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak,
    Image, KeepTogether, HRFlowable, Flowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle, StyleSheet1
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from io import BytesIO
import qrcode
import jwt
from fastapi.middleware.cors import CORSMiddleware
import base64
import json
import logging
from decimal import Decimal
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CrossFit Gym - Professional Invoice System",
    description="Sistema profissional de geração de faturas com suporte a múltiplas funcionalidades",
    version="3.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================================
# ENUMS & MODELS
# ============================================================

class Currency(str, Enum):
    MZN = "MZN"
    USD = "USD"
    EUR = "EUR"

class PaymentStatus(str, Enum):
    PAID = "PAGO"
    PENDING = "PENDENTE"
    CANCELLED = "CANCELADA"
    REFUNDED = "REEMBOLSADO"

class PaymentMethod(str, Enum):
    CASH = "Dinheiro"
    CARD = "Cartão"
    MOBILE = "Dinheiro Móvel"
    BANK = "Transferência Bancária"
    CHECK = "Cheque"

class LineItem(BaseModel):
    """Item individual na fatura"""
    description: str = Field(..., min_length=1, description="Descrição do serviço")
    quantity: float = Field(default=1.0, gt=0, description="Quantidade")
    unit_price: float = Field(..., gt=0, description="Preço unitário")
    
    @property
    def total(self) -> float:
        return round(self.quantity * self.unit_price, 2)

class InvoiceData(BaseModel):
    """Modelo principal da fatura"""
    # Identificação
    invoice_number: str = Field(..., min_length=1, description="Número único da fatura")
    invoice_date: Optional[str] = Field(default_factory=lambda: datetime.now().isoformat())
    due_date: Optional[str] = None
    
    # Cliente
    client_name: str = Field(..., min_length=1, description="Nome do cliente")
    client_email: Optional[str] = None
    client_phone: str = Field(default="", description="Telefone do cliente")
    client_address: Optional[str] = None
    client_nuit: Optional[str] = None  # Tax ID
    
    # Produtos/Serviços
    items: List[LineItem] = Field(..., min_items=1, description="Lista de itens")
    
    # Valores
    currency: Currency = Field(default=Currency.MZN)
    discount: Optional[float] = Field(default=0.0, ge=0, le=100, description="Desconto em %")
    tax_percentage: Optional[float] = Field(default=0.0, ge=0, le=50, description="Impostos em %")
    
    # Pagamento
    payment_method: Optional[PaymentMethod] = None
    payment_status: PaymentStatus = Field(default=PaymentStatus.PAID)
    payment_reference: Optional[str] = None
    
    # Observações
    notes: Optional[str] = None
    terms: Optional[str] = None
    
    @validator('invoice_date', 'due_date', pre=True)
    def parse_dates(cls, v):
        """Parse date strings or keep as is"""
        if isinstance(v, str):
            try:
                return v  # Keep as string for model
            except:
                pass
        return v

class CompanyData(BaseModel):
    """Dados da empresa"""
    name: str = Field(default="CROSSTRAINING GYM")
    nuit: str = Field(default="123456789")
    address: str = Field(default="Avenida Julius Nyerere, Maputo, Moçambique")
    phone: str = Field(default="+258 21 300 500")
    email: str = Field(default="info@crosstraininggym.co.mz")
    website: str = Field(default="www.crosstraininggym.co.mz")

# ============================================================
# COLOR SCHEME & STYLES
# ============================================================

class ColorScheme:
    PRIMARY = colors.HexColor("#FF6B00")      # Orange
    SECONDARY = colors.HexColor("#2C3E50")    # Dark blue
    ACCENT = colors.HexColor("#1ABC9C")       # Teal
    LIGHT_BG = colors.HexColor("#ECF0F1")     # Light gray
    DARK_TEXT = colors.HexColor("#2C3E50")
    GREEN = colors.HexColor("#27AE60")
    RED = colors.HexColor("#E74C3C")
    BORDER = colors.HexColor("#BDC3C7")

def get_custom_styles() -> StyleSheet1:
    """Retorna estilos customizados para a fatura"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=ColorScheme.PRIMARY,
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    ))
    
    # Company name
    styles.add(ParagraphStyle(
        name='CompanyName',
        parent=styles['Normal'],
        fontSize=14,
        textColor=ColorScheme.SECONDARY,
        spaceAfter=2,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    ))
    
    # Section header
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=10,
        textColor=ColorScheme.PRIMARY,
        textTransform='uppercase',
        spaceAfter=8,
        spaceBefore=8,
        fontName='Helvetica-Bold',
        borderColor=ColorScheme.PRIMARY,
        borderWidth=1,
        borderPadding=4,
    ))
    
    # Label style
    styles.add(ParagraphStyle(
        name='Label',
        parent=styles['Normal'],
        fontSize=8,
        textColor=ColorScheme.SECONDARY,
        fontName='Helvetica-Bold',
        spaceAfter=2,
    ))
    
    # Value style
    styles.add(ParagraphStyle(
        name='Value',
        parent=styles['Normal'],
        fontSize=9,
        textColor=ColorScheme.DARK_TEXT,
        spaceAfter=2,
    ))
    
    # Amount style
    styles.add(ParagraphStyle(
        name='AmountValue',
        parent=styles['Normal'],
        fontSize=28,
        textColor=ColorScheme.PRIMARY,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    ))
    
    # Status style
    styles.add(ParagraphStyle(
        name='StatusPaid',
        parent=styles['Normal'],
        fontSize=11,
        textColor=ColorScheme.GREEN,
        fontName='Helvetica-Bold',
        alignment=TA_RIGHT,
    ))
    
    # Subtitle
    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=ColorScheme.BORDER,
        alignment=TA_CENTER,
        spaceAfter=2,
    ))
    
    # Footer
    styles.add(ParagraphStyle(
        name='Footer',
        parent=styles['Normal'],
        fontSize=7,
        textColor=ColorScheme.BORDER,
        alignment=TA_CENTER,
        spaceAfter=1,
    ))
    
    return styles

# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def amount_in_portuguese(num: float) -> str:
    """Converte número para palavras em português"""
    try:
        val = float(num)
        if val == 0:
            return "zero meticais"
        
        units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"]
        teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
        tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
        
        mzn = int(val)
        cents = int(round((val - mzn) * 100))
        
        def convert_three_digits(n):
            if n == 0:
                return ""
            elif n < 10:
                return units[n]
            elif n < 20:
                return teens[n - 10]
            elif n < 100:
                return tens[n // 10] + (" e " + units[n % 10] if n % 10 != 0 else "")
            elif n < 1000:
                if n == 100:
                    return "cem"
                result = units[n // 100] + " centos"
                remainder = n % 100
                if remainder > 0:
                    result += " e " + convert_three_digits(remainder)
                return result
            return str(n)
        
        def convert_full(n):
            if n == 0:
                return ""
            
            billions = n // 1000000000
            millions = (n % 1000000000) // 1000000
            thousands = (n % 1000000) // 1000
            remainder = n % 1000
            
            result = ""
            if billions > 0:
                result += convert_three_digits(billions) + " mil milhões"
            if millions > 0:
                if result: result += " "
                result += convert_three_digits(millions) + " milhões"
            if thousands > 0:
                if result: result += " "
                result += convert_three_digits(thousands) + " mil"
            if remainder > 0:
                if result: result += " "
                result += convert_three_digits(remainder)
            
            return result.strip() or "zero"
        
        words = convert_full(mzn) + " meticais"
        if cents > 0:
            words += " e " + convert_three_digits(cents) + " centavos"
        
        return words
    except Exception as e:
        logger.warning(f"Error converting amount to words: {e}")
        return f"{num:.2f} meticais"

def generate_qr_code(data: dict) -> BytesIO:
    """Gera QR code com dados da fatura"""
    try:
        qr_json = json.dumps(data, ensure_ascii=False)
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(qr_json)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        qr_bytes = BytesIO()
        img.save(qr_bytes, format='PNG')
        qr_bytes.seek(0)
        return qr_bytes
    except Exception as e:
        logger.error(f"QR code generation error: {e}")
        return None

def calculate_totals(items: List[LineItem], discount: float = 0, tax: float = 0):
    """Calcula subtotal, desconto, impostos e total"""
    subtotal = sum(item.total for item in items)
    discount_amount = subtotal * (discount / 100) if discount > 0 else 0
    taxable = subtotal - discount_amount
    tax_amount = taxable * (tax / 100) if tax > 0 else 0
    total = taxable + tax_amount
    
    return {
        'subtotal': round(subtotal, 2),
        'discount': round(discount_amount, 2),
        'tax': round(tax_amount, 2),
        'total': round(total, 2),
    }

# ============================================================
# PDF GENERATION
# ============================================================

def generate_professional_invoice(invoice: InvoiceData, company: CompanyData) -> BytesIO:
    """Gera fatura profissional em PDF"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=12*mm,
        leftMargin=12*mm,
        topMargin=15*mm,
        bottomMargin=10*mm,
        title=f"Fatura {invoice.invoice_number}"
    )
    
    story = []
    styles = get_custom_styles()
    
    # ========== HEADER SECTION ==========
    
    # Company header
    company_header = Table([[
        Paragraph(company.name, styles['CompanyName']),
        Paragraph(f"NUIT: {company.nuit}", styles['Subtitle']),
    ]], colWidths=[160*mm, 28*mm])
    company_header.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(company_header)
    
    # Company contact info
    contact_text = f"{company.address} | Tel: {company.phone} | {company.email}"
    story.append(Paragraph(contact_text, styles['Subtitle']))
    story.append(Spacer(1, 12*mm))
    
    # ========== INVOICE TITLE & STATUS ==========
    
    # Title with status badge
    title_table = Table([[
        Paragraph("FATURA DE SERVIÇOS", styles['InvoiceTitle']),
        Paragraph(
            f"✓ {invoice.payment_status.value}",
            styles['StatusPaid'] if invoice.payment_status == PaymentStatus.PAID else styles['Label']
        )
    ]], colWidths=[140*mm, 48*mm])
    title_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 12*mm))
    
    # ========== INVOICE INFO ==========
    
    try:
        invoice_date = datetime.fromisoformat(invoice.invoice_date) if isinstance(invoice.invoice_date, str) else invoice.invoice_date
    except:
        invoice_date = datetime.now()
    
    try:
        due_date = datetime.fromisoformat(invoice.due_date) if invoice.due_date and isinstance(invoice.due_date, str) else invoice.due_date
    except:
        due_date = None
    
    info_data = [
        [Paragraph("Número da Fatura:", styles['Label']), Paragraph(str(invoice.invoice_number), styles['Value'])],
        [Paragraph("Data de Emissão:", styles['Label']), Paragraph(invoice_date.strftime("%d/%m/%Y"), styles['Value'])],
        [Paragraph("Data de Vencimento:", styles['Label']), Paragraph(due_date.strftime("%d/%m/%Y") if due_date else "N/A", styles['Value'])],
    ]
    
    info_table = Table(info_data, colWidths=[60*mm, 128*mm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), ColorScheme.LIGHT_BG),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('PADDINGTOP', (0, 0), (-1, -1), 4),
        ('PADDINGBOTTOM', (0, 0), (-1, -1), 4),
        ('PADDINGLEFT', (1, 0), (1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, ColorScheme.BORDER),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 6*mm))
    
    # ========== CLIENT SECTION ==========
    
    story.append(Paragraph("CLIENTE", styles['SectionHeader']))
    
    client_data = [
        [Paragraph("Nome:", styles['Label']), Paragraph(invoice.client_name, styles['Value'])],
        [Paragraph("Telefone:", styles['Label']), Paragraph(invoice.client_phone or "—", styles['Value'])],
        [Paragraph("Email:", styles['Label']), Paragraph(invoice.client_email or "—", styles['Value'])],
        [Paragraph("Endereço:", styles['Label']), Paragraph(invoice.client_address or "—", styles['Value'])],
    ]
    if invoice.client_nuit:
        client_data.append([Paragraph("NUIT:", styles['Label']), Paragraph(invoice.client_nuit, styles['Value'])])
    
    client_table = Table(client_data, colWidths=[50*mm, 138*mm])
    client_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), ColorScheme.LIGHT_BG),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('PADDINGTOP', (0, 0), (-1, -1), 3),
        ('PADDINGBOTTOM', (0, 0), (-1, -1), 3),
        ('PADDINGLEFT', (1, 0), (1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, ColorScheme.BORDER),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 10*mm))
    
    # ========== ITEMS TABLE ==========
    
    story.append(Paragraph("DETALHES DOS SERVIÇOS", styles['SectionHeader']))
    
    items_data = [['Descrição', 'Qtd.', 'Preço Unit.', 'Total']]
    for item in invoice.items:
        items_data.append([
            item.description,
            f"{item.quantity:.2f}",
            f"{item.unit_price:,.2f}",
            f"{item.total:,.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[90*mm, 20*mm, 35*mm, 33*mm])
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), ColorScheme.PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('PADDINGTOP', (0, 0), (-1, 0), 5),
        ('PADDINGBOTTOM', (0, 0), (-1, 0), 5),
        
        # Body
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),
        ('PADDINGTOP', (0, 1), (-1, -1), 4),
        ('PADDINGBOTTOM', (0, 1), (-1, -1), 4),
        ('PADDINGLEFT', (0, 1), (0, -1), 6),
        ('PADDINGRIGHT', (3, 1), (3, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, ColorScheme.BORDER),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 10*mm))
    
    # ========== TOTALS SECTION ==========
    
    totals = calculate_totals(invoice.items, invoice.discount or 0, invoice.tax_percentage or 0)
    
    totals_data = [
        ['Subtotal:', f"{totals['subtotal']:,.2f} {invoice.currency.value}"],
    ]
    
    if totals['discount'] > 0:
        totals_data.append(['Desconto:', f"-{totals['discount']:,.2f} {invoice.currency.value}"])
    
    if totals['tax'] > 0:
        totals_data.append(['Impostos:', f"{totals['tax']:,.2f} {invoice.currency.value}"])
    
    totals_table = Table(totals_data, colWidths=[130*mm, 48*mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('PADDINGTOP', (0, 0), (-1, -1), 3),
        ('PADDINGBOTTOM', (0, 0), (-1, -1), 3),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 4*mm))
    
    # Grand Total
    total_box_data = [[
        Paragraph("TOTAL", ParagraphStyle(
            'TotalLabel',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.whitesmoke,
            fontName='Helvetica-Bold',
        )),
        Paragraph(f"{totals['total']:,.2f}", styles['AmountValue'])
    ]]
    
    total_box = Table(total_box_data, colWidths=[80*mm, 98*mm])
    total_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ColorScheme.PRIMARY),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDINGTOP', (0, 0), (-1, -1), 10),
        ('PADDINGBOTTOM', (0, 0), (-1, -1), 10),
    ]))
    story.append(total_box)
    story.append(Spacer(1, 6*mm))
    
    # ========== AMOUNT IN WORDS ==========
    
    amount_words = amount_in_portuguese(totals['total'])
    story.append(Paragraph(f"<b>Por Extenso:</b> {amount_words.capitalize()}", styles['Value']))
    story.append(Spacer(1, 4*mm))
    
    # ========== PAYMENT INFO ==========
    
    if invoice.payment_method or invoice.payment_reference:
        story.append(Paragraph("INFORMAÇÕES DE PAGAMENTO", styles['SectionHeader']))
        
        payment_data = []
        if invoice.payment_method:
            payment_data.append([
                Paragraph("Método:", styles['Label']),
                Paragraph(invoice.payment_method.value, styles['Value'])
            ])
        if invoice.payment_reference:
            payment_data.append([
                Paragraph("Referência:", styles['Label']),
                Paragraph(invoice.payment_reference, styles['Value'])
            ])
        
        payment_table = Table(payment_data, colWidths=[50*mm, 138*mm])
        payment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), ColorScheme.LIGHT_BG),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('PADDINGTOP', (0, 0), (-1, -1), 3),
            ('PADDINGBOTTOM', (0, 0), (-1, -1), 3),
            ('PADDINGLEFT', (1, 0), (1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, ColorScheme.BORDER),
        ]))
        story.append(payment_table)
        story.append(Spacer(1, 4*mm))
    
    # ========== QR CODE & NOTES ==========
    
    # QR Code
    qr_data = {
        "invoice": invoice.invoice_number,
        "total": totals['total'],
        "date": invoice_date.isoformat(),
        "client": invoice.client_name,
        "reference": invoice.payment_reference or ""
    }
    
    qr_img = generate_qr_code(qr_data)
    if qr_img:
        try:
            qr_table = Table([[Image(qr_img, width=25*mm, height=25*mm)]], colWidths=[25*mm])
            qr_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(qr_table)
            story.append(Spacer(1, 2*mm))
            story.append(Paragraph("Escaneie para verificar", styles['Footer']))
        except Exception as e:
            logger.warning(f"Could not embed QR code: {e}")
    
    story.append(Spacer(1, 4*mm))
    
    # Notes
    if invoice.notes:
        story.append(Paragraph("OBSERVAÇÕES", styles['SectionHeader']))
        story.append(Paragraph(invoice.notes, styles['Value']))
        story.append(Spacer(1, 4*mm))
    
    # Terms
    if invoice.terms:
        story.append(Paragraph("TERMOS & CONDIÇÕES", styles['SectionHeader']))
        story.append(Paragraph(invoice.terms, styles['Value']))
        story.append(Spacer(1, 4*mm))
    
    # ========== FOOTER ==========
    
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("_" * 80, ParagraphStyle(
        'Line',
        parent=styles['Normal'],
        fontSize=6,
        textColor=ColorScheme.BORDER,
        alignment=TA_CENTER,
    )))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(company.website, styles['Footer']))
    story.append(Paragraph("Obrigado pela sua confiança!", ParagraphStyle(
        'ThankYou',
        parent=styles['Normal'],
        fontSize=9,
        textColor=ColorScheme.PRIMARY,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )))
    story.append(Paragraph(
        f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')} | "
        f"Documento válido sem assinatura ou carimbo",
        styles['Footer']
    ))
    
    # Build PDF
    try:
        doc.build(story)
        buffer.seek(0)
        logger.info(f"Invoice {invoice.invoice_number} generated successfully")
        return buffer
    except Exception as e:
        logger.error(f"Error building PDF: {e}")
        raise

# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/health")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "service": "Professional Invoice Generator",
        "version": "3.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/generate-invoice")
async def generate_invoice(
    invoice: InvoiceData,
    token: Optional[str] = Query(None, description="JWT token for authentication")
):
    """
    Gera fatura profissional em PDF
    
    Retorna um arquivo PDF pronto para download
    """
    try:
        # Optional token verification
        if token:
            try:
                jwt.decode(token, options={"verify_signature": False})
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        
        company = CompanyData()
        pdf_buffer = generate_professional_invoice(invoice, company)
        
        filename = f"Fatura_{invoice.invoice_number}_{datetime.now().strftime('%d%m%Y')}.pdf"
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Content-Description": "File Transfer",
                "Content-Transfer-Encoding": "binary",
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Invoice generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar fatura: {str(e)}"
        )

@app.post("/generate-receipt")
async def generate_receipt(invoice: InvoiceData):
    """Alias para gerar recibo (usar /generate-invoice)"""
    return await generate_invoice(invoice)

@app.get("/docs")
async def custom_docs():
    """OpenAPI documentation"""
    return {
        "title": "Professional Invoice System API",
        "version": "3.0",
        "endpoints": {
            "POST /generate-invoice": "Gera fatura profissional em PDF",
            "GET /health": "Verifica status do serviço",
        }
    }

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle CORS preflight requests"""
    return {"detail": "OK"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Professional Invoice Generator Service v3.0")
    uvicorn.run(app, host="0.0.0.0", port=3002, log_level="info")
