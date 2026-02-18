import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Generates a premium receipt PDF using a Python script
 * @param {Object} payment - Payment object with member and plan relations
 * @param {Object} res - Express response object
 */
export const generateReceiptPDF = (payment, res) => {
  try {
    console.log('[PDF] Starting Python migration generation for payment:', payment.id);

    if (!payment.member || !payment.plan) {
      console.error('[PDF] Missing required data');
      if (!res.headersSent) {
        res.status(400).json({ error: 'Payment data incomplete' });
      }
      return;
    }

    const receiptNo = payment.receiptNumber 
      ? String(payment.receiptNumber).padStart(8, '0')
      : payment.id.substring(0, 8).toUpperCase();

    const amount = parseFloat(payment.amount || 0);
    const paymentDate = payment.paymentDate 
      ? new Date(payment.paymentDate).toLocaleDateString('pt-PT') 
      : new Date().toLocaleDateString('pt-PT');

    const pdfData = {
      memberName: payment.member?.name || 'Cliente',
      memberPhone: payment.member?.phone || '---',
      planName: payment.plan?.name || 'Plano de Treino',
      amount: amount,
      paymentDate: paymentDate,
      receiptNo: receiptNo,
      paymentMethod: payment.paymentMethod || 'Não especificado',
      logoPath: path.join(process.cwd(), '..', 'frontend', 'public', 'logo.png')
    };

    // Response headers
    res.setHeader('Content-Type', 'application/pdf; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="recibo-${receiptNo}.pdf"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    const pythonScript = path.join(process.cwd(), 'src', 'utils', 'python', 'invoice_generator.py');
    const pythonProcess = spawn('python', [pythonScript, JSON.stringify(pdfData)]);

    pythonProcess.stdout.pipe(res);

    pythonProcess.stderr.on('data', (data) => {
      console.error(`[PDF Python Error]: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`[PDF] Python process closed with code ${code}`);
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: 'Python PDF generation failed' });
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('[PDF] Failed to start Python process:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start PDF generator' });
      }
    });

  } catch (error) {
    console.error('[PDF] Fatal error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate receipt' });
    }
  }
};
