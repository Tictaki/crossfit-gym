import sys
import json
import os
from fpdf import FPDF
from datetime import datetime
from num2words import num2words

def amount_in_words(num):
    """
    Converts a number to a Portuguese word representation using num2words.
    Example: 3000.00 -> "três mil meticais"
    """
    try:
        val = float(num)
        inteiro = int(val)
        centavos = int(round((val - inteiro) * 100))
        
        words = num2words(inteiro, lang='pt')
        
        # In Portuguese, for round millions/billions, we use "de [currency]"
        # e.g., "um milhão de meticais"
        if inteiro >= 1000000 and inteiro % 1000000 == 0:
            result = f"{words} de meticais"
        else:
            result = f"{words} meticais"
        
        if centavos > 0:
            centavos_words = num2words(centavos, lang='pt')
            result += f" e {centavos_words} centavos"
            
        return result.lower()
    except Exception as e:
        return str(num)

class ReceiptPDF(FPDF):
    def __init__(self, primary_color=(255, 107, 0)):
        super().__init__()
        self.primary_color = primary_color
        self.set_margins(15, 15, 15)
        self.add_page()
        
    def header(self):
        pass # Custom header handled in generate_receipt

    def footer(self):
        pass # Custom footer handled in generate_receipt

def generate_receipt(data):
    # Extract data
    member_name = data.get('memberName', 'Cliente')
    member_phone = data.get('memberPhone', '---')
    plan_name = data.get('planName', 'Plano de Treino')
    amount = float(data.get('amount', 0))
    payment_date = data.get('paymentDate', datetime.now().strftime('%d/%m/%Y'))
    receipt_no = data.get('receiptNo', '00000000')
    payment_method = data.get('paymentMethod', 'Não especificado')
    logo_path = data.get('logoPath', '')

    pdf = ReceiptPDF()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Colors
    primary_orange = (255, 107, 0)
    text_black = (0, 0, 0)
    text_gray = (102, 102, 102)
    border_gray = (229, 229, 229)
    light_bg = (249, 249, 249)

    # Logo and Company Details
    if logo_path and os.path.exists(logo_path):
        pdf.image(logo_path, 15, 15, 20)
    
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_xy(40, 15)
    pdf.set_text_color(*text_black)
    pdf.cell(0, 7, 'CROSSTRAINING GYM', ln=True)
    
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(*text_gray)
    pdf.set_x(40)
    pdf.cell(0, 5, 'NUIT: 401996397', ln=True)
    pdf.set_x(40)
    pdf.cell(0, 5, 'Morada: Cuamba, Moçambique', ln=True)
    pdf.set_x(40)
    pdf.cell(0, 5, 'Telefone: +258 87 123 4567', ln=True)

    # Divider
    pdf.set_draw_color(204, 204, 204)
    pdf.line(15, 45, 195, 45)

    # Title
    pdf.set_font('Helvetica', 'B', 32)
    pdf.set_text_color(*primary_orange)
    pdf.ln(15)
    pdf.cell(0, 20, 'RECIBO', align='C', ln=True)

    # Receipt Details Table-like layout
    pdf.ln(5)
    start_y = pdf.get_y()
    
    def draw_row(label, value, y_offset, is_amount=False):
        pdf.set_y(start_y + y_offset)
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(*text_gray)
        pdf.cell(50, 10, label)
        
        pdf.set_font('Helvetica', 'B', 16 if is_amount else 11)
        pdf.set_text_color(*(primary_orange if is_amount else text_black))
        pdf.cell(0, 10, value)
        
        # Bottom border for row
        pdf.set_draw_color(*border_gray)
        pdf.line(65, pdf.get_y() + 8, 195, pdf.get_y() + 8)

    draw_row('Nº Recibo:', receipt_no, 0)
    draw_row('Membro:', member_name, 12)
    draw_row('Contacto:', member_phone, 24)
    draw_row('Plano:', plan_name, 36)
    
    # Amount specific rendering
    draw_row('Importância:', f"{amount:.2f} MZN", 48, is_amount=True)
    
    # Amount in words
    pdf.set_y(start_y + 48 + 8)
    pdf.set_x(65)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(136, 136, 136)
    pdf.cell(0, 5, f"({amount_in_words(amount)})")

    draw_row('Forma de Pagamento:', payment_method, 68)
    draw_row('Data de Pagamento:', payment_date, 80)

    # Signature section
    footer_y = start_y + 110
    pdf.set_y(footer_y)
    pdf.set_draw_color(0, 0, 0)
    pdf.line(15, footer_y + 10, 85, footer_y + 10)
    
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(153, 153, 153)
    pdf.set_y(footer_y + 12)
    pdf.cell(70, 5, 'Assinatura do Recebedor', align='L')

    # Status Badge / Footer Box
    box_y = 250
    pdf.set_fill_color(*light_bg)
    pdf.rect(15, box_y, 180, 25, 'F')
    pdf.set_draw_color(221, 221, 221)
    pdf.rect(15, box_y, 180, 25, 'D')
    
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 51, 51)
    pdf.set_xy(20, box_y + 5)
    pdf.cell(0, 5, 'Obrigado pela sua preferência!', ln=True)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*text_gray)
    pdf.set_x(20)
    pdf.cell(0, 5, 'Contacte-nos: +258 87 123 4567 | www.crosstraininggym.mz')

    # Status Badge
    pdf.set_fill_color(*primary_orange)
    pdf.rect(170, box_y, 25, 25, 'F')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 12)
    # Rotating text for vertical "PAGO" or just horizontal centered
    pdf.set_xy(170, box_y + 10)
    pdf.cell(25, 5, 'PAGO', align='C')

    # Output to stdout as binary
    pdf_bytes = pdf.output(dest='S')
    sys.stdout.buffer.write(pdf_bytes)

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
            generate_receipt(input_data)
        else:
            # For testing purposes if no args
            print("No data provided", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
