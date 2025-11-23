import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import type { Quotation, Invoice, DeliveryChallan } from '@shared/schema';

interface DocumentOptions {
  includeHeader?: boolean;
  includeFooter?: boolean;
  businessName?: string;
  businessAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
  footerText?: string;
  primaryColor?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '').trim();
  // Handle 3-digit hex codes
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  // Ensure we have 6 characters
  if (cleanHex.length !== 6) {
    // Default to blue if invalid
    return [0.12, 0.25, 0.69];
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  // Validate RGB values
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return [0.12, 0.25, 0.69]; // Default blue
  }
  return [r, g, b];
}

function hexToWord(hex: string): string {
  return hex.replace('#', '');
}

function parseDecimal(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function generatePDF(
  document: Quotation | Invoice | DeliveryChallan,
  type: 'quotation' | 'invoice' | 'challan',
  options: DocumentOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);
      const primaryColor = options.primaryColor || '#1e40af';
      const primaryRgb = hexToRgb(primaryColor);
      let y = margin;

      // Header
      if (options.includeHeader !== false) {
        if (options.businessName) {
          doc.fontSize(18).font('Helvetica-Bold').fillColor(...primaryRgb);
          doc.text(options.businessName, margin, y);
          y += 24;
        }
        if (options.businessAddress) {
          doc.fontSize(10).font('Helvetica').fillColor(0, 0, 0);
          doc.text(options.businessAddress, margin, y);
          y += 14;
        }
        if (options.businessEmail || options.businessPhone) {
          const contact = [options.businessEmail, options.businessPhone].filter(Boolean).join(' | ');
          doc.fontSize(9).font('Helvetica').fillColor(0.5, 0.5, 0.5);
          doc.text(contact, margin, y);
          y += 16;
        }
        doc.strokeColor(...primaryRgb).lineWidth(1).moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
        y += 20;
      }

      // Title
      const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';
      doc.fontSize(20).font('Helvetica-Bold').fillColor(0, 0, 0);
      doc.text(title, margin, y, { align: 'center', width: contentWidth });
      y += 30;

      // Document Info
      const docNumber = type === 'quotation' 
        ? (document as Quotation).quotationNumber
        : type === 'invoice'
        ? (document as Invoice).invoiceNumber
        : (document as DeliveryChallan).challanNumber;
      const docDate = new Date(document.createdAt!).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
      });

      doc.fontSize(10).font('Helvetica').fillColor(0, 0, 0);
      doc.text(`Document Number: ${docNumber}`, margin, y);
      const dateText = `Date: ${docDate}`;
      doc.text(dateText, pageWidth - margin - doc.widthOfString(dateText), y);
      y += 25;

      // Paid Stamp
      if (type === 'invoice' && (document as Invoice).status === 'paid') {
        doc.save();
        doc.translate(pageWidth - margin - 60, y + 25).rotate(-45);
        doc.fontSize(30).font('Helvetica-Bold').fillColor(0.06, 0.73, 0.51);
        doc.text('PAID', 0, 0);
        doc.restore();
      }
      y += 20;

      // Bill To
      doc.fontSize(11).font('Helvetica-Bold').fillColor(0, 0, 0);
      doc.text('Bill To:', margin, y);
      y += 15;
      doc.fontSize(10).font('Helvetica').fillColor(0, 0, 0);
      doc.text(document.customerName, margin, y);
      y += 12;
      if (document.customerAddress) {
        doc.text(document.customerAddress, margin, y);
        y += 12;
      }
      if ('customerEmail' in document && document.customerEmail) {
        doc.text(document.customerEmail, margin, y);
        y += 12;
      }
      y += 20;

      // Calculate totals from items if needed
      let calculatedSubtotal = 0;
      let calculatedTaxAmount = 0;
      let calculatedTotal = 0;

      // Items Table
      if (Array.isArray(document.items) && document.items.length > 0) {
        const tableStartY = y;
        const rowHeight = 20;
        const headerHeight = 24;

        // Header background - draw rectangle with primary color
        // Save state, set color, fill rectangle, restore state
        doc.save();
        doc.fillColor(...primaryRgb);
        doc.rect(margin, y, contentWidth, headerHeight).fill();
        doc.restore();
        
        // Header text - white on colored background
        doc.fillColor(1, 1, 1);
        doc.fontSize(10).font('Helvetica-Bold');
        const col1 = margin + 8;
        const col2 = margin + contentWidth * 0.50;
        const col3 = margin + contentWidth * 0.70;
        const col4 = margin + contentWidth * 0.90;
        doc.text('Item', col1, y + 6);
        doc.text('Qty', col2, y + 6);
        if (type !== 'challan') {
          doc.text('Price', col3, y + 6);
          doc.text('Total', col4 - doc.widthOfString('Total'), y + 6);
        } else {
          doc.text('Unit', col3, y + 6);
        }
        y += headerHeight;

        // Rows - Calculate item totals
        doc.fontSize(9).font('Helvetica').fillColor(0, 0, 0);
        document.items.forEach((item: any) => {
          const itemName = item.name || 'N/A';
          const quantity = parseDecimal(item.quantity);
          const unitPrice = parseDecimal(item.unitPrice);
          
          // Calculate item total if missing or 0
          let itemTotal = parseDecimal(item.total);
          if (itemTotal === 0 && unitPrice > 0 && quantity > 0) {
            itemTotal = unitPrice * quantity;
          }
          
          calculatedSubtotal += itemTotal;
          
          doc.text(itemName, col1, y + 5, { width: col2 - col1 - 10 });
          doc.text(String(quantity), col2, y + 5);
          
          if (type !== 'challan') {
            const priceText = `£${unitPrice.toFixed(2)}`;
            doc.text(priceText, col3 - doc.widthOfString(priceText), y + 5);
            
            const totalText = `£${itemTotal.toFixed(2)}`;
            doc.font('Helvetica-Bold');
            doc.text(totalText, col4 - doc.widthOfString(totalText), y + 5);
            doc.font('Helvetica');
          } else {
            doc.text(item.unit || 'pcs', col3, y + 5);
          }
          y += rowHeight;
        });

        // Border
        doc.strokeColor(0.8, 0.8, 0.8).lineWidth(0.5);
        doc.rect(margin, tableStartY, contentWidth, y - tableStartY).stroke();
        y += 20;
      }

      // Totals - Always calculate from items to ensure accuracy
      if (type !== 'challan') {
        const docWithTotals = document as Quotation | Invoice;
        const taxRate = parseDecimal(docWithTotals.taxRate) || 20;
        
        // Always use calculated subtotal from items
        const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : parseDecimal(docWithTotals.subtotal);
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        const totalsX = pageWidth - margin - 180;
        
        doc.fontSize(10).font('Helvetica').fillColor(0, 0, 0);
        doc.text('Subtotal:', totalsX, y);
        const subtotalText = `£${subtotal.toFixed(2)}`;
        doc.font('Helvetica-Bold');
        doc.text(subtotalText, totalsX + 160 - doc.widthOfString(subtotalText), y);
        y += 16;

        doc.font('Helvetica').fillColor(0, 0, 0);
        doc.text(`Tax (${taxRate.toFixed(2)}%):`, totalsX, y);
        const taxText = `£${taxAmount.toFixed(2)}`;
        doc.font('Helvetica-Bold');
        doc.text(taxText, totalsX + 160 - doc.widthOfString(taxText), y);
        y += 16;

        doc.strokeColor(0.7, 0.7, 0.7).lineWidth(1).moveTo(totalsX, y).lineTo(totalsX + 160, y).stroke();
        y += 10;

        doc.fontSize(12).font('Helvetica-Bold').fillColor(...primaryRgb);
        doc.text('Total:', totalsX, y);
        const totalText = `£${total.toFixed(2)}`;
        doc.fontSize(14);
        doc.text(totalText, totalsX + 160 - doc.widthOfString(totalText), y);
        y += 25;
      }

      // Notes
      if (document.notes) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(0, 0, 0);
        doc.text('Notes:', margin, y);
        y += 14;
        doc.fontSize(9).font('Helvetica').fillColor(0, 0, 0);
        doc.text(document.notes, margin, y, { width: contentWidth });
      }

      // Footer
      if (options.includeFooter !== false) {
        const footerY = pageHeight - margin - 15;
        doc.fontSize(8).font('Helvetica').fillColor(...primaryRgb);
        doc.text(
          options.footerText || options.businessName || 'Thank you for your business!',
          margin, footerY, { width: contentWidth, align: 'center' }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateWord(
  document: Quotation | Invoice | DeliveryChallan,
  type: 'quotation' | 'invoice' | 'challan',
  options: DocumentOptions = {}
): Promise<Buffer> {
  const children: Paragraph[] = [];
  const primaryColor = options.primaryColor || '#1e40af';
  const primaryColorWord = hexToWord(primaryColor);

  function parseDecimal(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  // Header
  if (options.includeHeader !== false) {
    if (options.businessName) {
      children.push(new Paragraph({
        children: [new TextRun({ text: options.businessName, bold: true, size: 28, color: primaryColorWord })],
        spacing: { after: 120 },
      }));
    }
    if (options.businessAddress) {
      children.push(new Paragraph({ text: options.businessAddress, spacing: { after: 80 } }));
    }
    if (options.businessEmail || options.businessPhone) {
      const contact = [options.businessEmail, options.businessPhone].filter(Boolean).join(' | ');
      children.push(new Paragraph({ text: contact, spacing: { after: 200 } }));
    }
  }

  // Title
  const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';
  children.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  // Document Info
  const docNumber = type === 'quotation'
    ? (document as Quotation).quotationNumber
    : type === 'invoice'
    ? (document as Invoice).invoiceNumber
    : (document as DeliveryChallan).challanNumber;
  const docDate = new Date(document.createdAt!).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  children.push(new Paragraph({
    children: [new TextRun({ text: `Document Number: ${docNumber}  |  Date: ${docDate}` })],
    spacing: { after: 200 },
  }));

  // Paid Stamp
  if (type === 'invoice' && (document as Invoice).status === 'paid') {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'PAID', bold: true, size: 40, color: '10b981' })],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
    }));
  }

  // Bill To
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Bill To:', bold: true, size: 20 })],
    spacing: { after: 120 },
  }));
  children.push(new Paragraph({ text: document.customerName }));
  if (document.customerAddress) {
    children.push(new Paragraph({ text: document.customerAddress }));
  }
  if ('customerEmail' in document && document.customerEmail) {
    children.push(new Paragraph({ text: document.customerEmail }));
  }
  children.push(new Paragraph({ text: '' }));

  // Calculate totals from items
  let calculatedSubtotal = 0;

  // Items Table
  if (Array.isArray(document.items) && document.items.length > 0) {
    const tableRows: TableRow[] = [];
    
    // Header
    const headerCells = [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Item', bold: true, color: 'ffffff' })],
        })],
        shading: { fill: primaryColorWord },
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Quantity', bold: true, color: 'ffffff' })],
        })],
        shading: { fill: primaryColorWord },
      }),
    ];
    
    if (type !== 'challan') {
      headerCells.push(
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Unit Price', bold: true, color: 'ffffff' })],
          })],
          shading: { fill: primaryColorWord },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Total', bold: true, color: 'ffffff' })],
          })],
          shading: { fill: primaryColorWord },
        })
      );
    } else {
      headerCells.push(new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Unit', bold: true, color: 'ffffff' })],
        })],
        shading: { fill: primaryColorWord },
      }));
    }
    tableRows.push(new TableRow({ children: headerCells }));

    // Data Rows - Calculate item totals
    document.items.forEach((item: any) => {
      const quantity = parseDecimal(item.quantity);
      const unitPrice = parseDecimal(item.unitPrice);
      
      // Calculate item total if missing or 0
      let itemTotal = parseDecimal(item.total);
      if (itemTotal === 0 && unitPrice > 0 && quantity > 0) {
        itemTotal = unitPrice * quantity;
      }
      
      calculatedSubtotal += itemTotal;
      
      const cells = [
        new TableCell({ children: [new Paragraph({ text: item.name || 'N/A' })] }),
        new TableCell({ children: [new Paragraph({ text: String(quantity) })] }),
      ];
      
      if (type !== 'challan') {
        cells.push(
          new TableCell({ children: [new Paragraph({ text: `£${unitPrice.toFixed(2)}` })] }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: `£${itemTotal.toFixed(2)}`, bold: true })],
            })],
          })
        );
      } else {
        cells.push(new TableCell({ children: [new Paragraph({ text: item.unit || 'pcs' })] }));
      }
      tableRows.push(new TableRow({ children: cells }));
    });

    children.push(new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      },
    }));
    children.push(new Paragraph({ text: '' }));
  }

  // Totals - Always calculate from items to ensure accuracy
  if (type !== 'challan') {
    const docWithTotals = document as Quotation | Invoice;
    const taxRate = parseDecimal(docWithTotals.taxRate) || 20;
    
    // Always use calculated subtotal from items
    const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : parseDecimal(docWithTotals.subtotal);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    children.push(new Paragraph({
      children: [new TextRun({ text: 'Subtotal: ' }), new TextRun({ text: `£${subtotal.toFixed(2)}`, bold: true })],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 80 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: `Tax (${taxRate.toFixed(2)}%): ` }), new TextRun({ text: `£${taxAmount.toFixed(2)}`, bold: true })],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 80 },
    }));
    children.push(new Paragraph({
      children: [
        new TextRun({ text: 'Total: ', bold: true, size: 24, color: primaryColorWord }),
        new TextRun({ text: `£${total.toFixed(2)}`, bold: true, size: 24, color: primaryColorWord }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
    }));
  }

  // Notes
  if (document.notes) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Notes:', bold: true, size: 20 })],
      spacing: { after: 120 },
    }));
    children.push(new Paragraph({ text: document.notes, spacing: { after: 200 } }));
  }

  // Footer
  if (options.includeFooter !== false) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: options.footerText || options.businessName || 'Thank you for your business!',
        color: primaryColorWord,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }));
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}
