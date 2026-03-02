import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

/**
 * Converts a number to Portuguese word representation.
 * Example: 3000.00 -> "três mil meticais"
 */
const amountInWords = (num) => {
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const convertThreeDigits = (n) => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    let res = hundreds[Math.floor(n / 100)];
    let remainder = n % 100;
    if (remainder > 0) {
      if (res) res += ' e ';
      if (remainder < 10) res += units[remainder];
      else if (remainder < 20) res += teens[remainder - 10];
      else {
        res += tens[Math.floor(remainder / 10)];
        if (remainder % 10 > 0) res += ' e ' + units[remainder % 10];
      }
    }
    return res;
  };

  const integer = Math.floor(num);
  const cents = Math.round((num * 100) % 100);

  let result = '';
  if (integer === 0) result = 'zero';
  else {
    const millions = Math.floor(integer / 1000000);
    const thousands = Math.floor((integer % 1000000) / 1000);
    const remainder = integer % 1000;

    if (millions > 0) {
      result += convertThreeDigits(millions) + (millions === 1 ? ' milhão' : ' milhões');
    }
    if (thousands > 0) {
      if (result) result += ' ';
      result += (thousands === 1 ? 'mil' : convertThreeDigits(thousands) + ' mil');
    }
    if (remainder > 0) {
      if (result) result += ' e ';
      result += convertThreeDigits(remainder);
    }
  }

  // Clean up "um mil" to "mil" and "e cento" if needed
  result = result.replace(/^um mil /, 'mil ').trim();

  result += (integer === 1 ? ' metical' : ' meticais');
  
  if (cents > 0) {
    result += ' e ' + convertThreeDigits(cents) + (cents === 1 ? ' centavo' : ' centavos');
  }

  return result.toLowerCase().trim();
};

/**
 * Generates a premium receipt PDF using Node.js PDFKit
 * @param {Object} payment - Payment object with member and plan relations
 * @param {Object} res - Express response object
 */
export const generateReceiptPDF = (payment, res) => {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Recibo de Pagamento - ${payment.receiptNumber || payment.id}`,
        Author: 'CrossFit Gym Management',
      }
    });

    // Pipe results to response
    doc.pipe(res);

    // Styling Constants
    const primaryColor = '#FF6B00';
    const textColor = '#1F2937';
    const grayColor = '#6B7280';
    const lightGray = '#F3F4F6';
    const borderColor = '#E5E7EB';

    // Header: Logo and Company Info
    const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 40 });
    }

    doc
      .fillColor(textColor)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('CROSSTRAINING GYM', 100, 45);

    doc
      .fillColor(grayColor)
      .fontSize(9)
      .font('Helvetica')
      .text('NUIT: 401996397', 100, 65)
      .text('Morada: Cuamba, Moçambique', 100, 78)
      .text('Telefone: +258 87 123 4567', 100, 91);

    // Divider
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, 115)
      .lineTo(545, 115)
      .stroke();

    // Receipt Title
    doc
      .fillColor(primaryColor)
      .fontSize(32)
      .font('Helvetica-Bold')
      .text('RECIBO', 50, 140, { align: 'center' });

    // Payment Summary Table-like Section
    const startY = 200;
    const labelX = 80;
    const valueX = 220;

    const drawRow = (label, value, y, isAmount = false) => {
      doc
        .fillColor(grayColor)
        .fontSize(10)
        .font('Helvetica')
        .text(label, labelX, y);

      doc
        .fillColor(isAmount ? primaryColor : textColor)
        .fontSize(isAmount ? 18 : 12)
        .font('Helvetica-Bold')
        .text(value, valueX, isAmount ? y - 4 : y);

      doc
        .strokeColor(lightGray)
        .lineWidth(0.5)
        .moveTo(labelX, y + 20)
        .lineTo(515, y + 20)
        .stroke();
    };

    const amount = parseFloat(payment.amount || 0);
    const dateStr = payment.paymentDate 
      ? new Date(payment.paymentDate).toLocaleDateString('pt-PT') 
      : new Date().toLocaleDateString('pt-PT');
    const receiptNo = payment.receiptNumber 
      ? String(payment.receiptNumber).padStart(8, '0')
      : payment.id.substring(0, 8).toUpperCase();

    drawRow('Nº Recibo:', receiptNo, startY);
    drawRow('Membro:', payment.member?.name || '---', startY + 35);
    drawRow('Plano:', payment.plan?.name || '---', startY + 70);
    drawRow('Valor Pago:', `${amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MZN`, startY + 105, true);

    // Amount in words
    doc
      .fillColor(grayColor)
      .fontSize(9)
      .font('Helvetica-Oblique')
      .text(`(${amountInWords(amount)})`, valueX, startY + 128);

    drawRow('Método:', payment.paymentMethod || 'Não especificado', startY + 160);
    drawRow('Data:', dateStr, startY + 195);

    // Signature Line
    const footerY = 550;
    doc
      .strokeColor(textColor)
      .lineWidth(1)
      .moveTo(80, footerY + 40)
      .lineTo(250, footerY + 40)
      .stroke();

    doc
      .fillColor(grayColor)
      .fontSize(8)
      .text('Assinatura do Recebedor', 80, footerY + 50);

    // Status Box (PAGO)
    doc
      .rect(400, footerY, 120, 60)
      .fill(primaryColor);

    doc
      .fillColor('#FFFFFF')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('PAGO', 400, footerY + 22, { align: 'center', width: 120 });

    // Global Footer
    const bottomY = 750;
    doc
      .fillColor(lightGray)
      .rect(50, bottomY, 495, 40)
      .fill();

    doc
      .fillColor(grayColor)
      .fontSize(9)
      .font('Helvetica')
      .text('Obrigado pela sua preferência! Visite-nos em www.crosstraininggym.mz', 50, bottomY + 15, { align: 'center', width: 495 });

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    console.error('[PDF] Fatal Node.js generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate receipt' });
    }
  }
};
