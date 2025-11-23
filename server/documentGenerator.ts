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
}

export async function generatePDF(
  document: Quotation | Invoice | DeliveryChallan,
  type: 'quotation' | 'invoice' | 'challan',
  options: DocumentOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4'
      });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Header
      if (options.includeHeader !== false) {
        if (options.businessName) {
          doc.fontSize(20).font('Helvetica-Bold').fillColor(0, 0, 0);
          doc.text(options.businessName, margin, yPos);
          yPos += 25;
        }
        if (options.businessAddress) {
          doc.fontSize(10).font('Helvetica').fillColor(0, 0, 0);
          doc.text(options.businessAddress, margin, yPos);
          yPos += 15;
        }
        if (options.businessEmail || options.businessPhone) {
          const contact = [options.businessEmail, options.businessPhone].filter(Boolean).join(' | ');
          doc.fontSize(9).font('Helvetica').fillColor(0, 0, 0);
          doc.text(contact, margin, yPos);
          yPos += 20;
        }
        yPos += 10;
      }

      // Title
      const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';
      doc.fontSize(18).font('Helvetica-Bold').fillColor(0, 0, 0);
      doc.text(title, margin, yPos, { align: 'center', width: contentWidth });
      yPos += 30;

      // Document Number and Date
      const docNumber = type === 'quotation' 
        ? (document as Quotation).quotationNumber
        : type === 'invoice'
        ? (document as Invoice).invoiceNumber
        : (document as DeliveryChallan).challanNumber;
      
      const docDate = new Date(document.createdAt!).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      doc.fontSize(10).font('Helvetica').fillColor(0, 0, 0);
      doc.text(`Document Number: ${docNumber}`, margin, yPos);
      doc.text(`Date: ${docDate}`, pageWidth - margin - 150, yPos);
      yPos += 20;

      // Paid Stamp
      if (type === 'invoice' && (document as Invoice).status === 'paid') {
        doc.save();
        doc.translate(pageWidth - margin - 60, yPos + 20)
           .rotate(-45)
           .fontSize(28).font('Helvetica-Bold').fillColor(0, 0.7, 0.3);
        doc.text('PAID', 0, 0);
        doc.restore();
      }

      yPos += 20;

      // Bill To
      doc.fontSize(10).font('Helvetica-Bold').fillColor(0, 0, 0);
      doc.text('Bill To:', margin, yPos);
      yPos += 15;
      doc.fontSize(10).font('Helvetica').fillColor(0, 0, 0);
      doc.text(document.customerName, margin, yPos);
      yPos += 12;
      if (document.customerAddress) {
        doc.text(document.customerAddress, margin, yPos);
        yPos += 12;
      }
      if ('customerEmail' in document && document.customerEmail) {
        doc.text(document.customerEmail, margin, yPos);
        yPos += 12;
      }
      yPos += 20;

      // Items Table
      if (Array.isArray(document.items) && document.items.length > 0) {
        const tableTop = yPos;
        const rowHeight = 20;
        const headerHeight = 25;
        let currentY = tableTop;

        // Header
        doc.rect(margin, currentY, contentWidth, headerHeight)
           .fillColor(0.2, 0.2, 0.2)
           .fill();
        
        doc.fontSize(9).font('Helvetica-Bold').fillColor(1, 1, 1);
        doc.text('Item', margin + 5, currentY + 7);
        doc.text('Qty', margin + contentWidth * 0.45, currentY + 7);
        if (type !== 'challan') {
          doc.text('Price', margin + contentWidth * 0.60, currentY + 7);
          doc.text('Total', margin + contentWidth * 0.75, currentY + 7);
        } else {
          doc.text('Unit', margin + contentWidth * 0.60, currentY + 7);
        }
        currentY += headerHeight;

        // Rows
        doc.fontSize(9).font('Helvetica').fillColor(0, 0, 0);
        document.items.forEach((item: any, index: number) => {
          if (index % 2 === 0) {
            doc.rect(margin, currentY, contentWidth, rowHeight)
               .fillColor(0.95, 0.95, 0.95)
               .fill();
          }
          doc.fillColor(0, 0, 0);
          doc.text(item.name || 'N/A', margin + 5, currentY + 5);
          doc.text(String(item.quantity || 0), margin + contentWidth * 0.45, currentY + 5);
          if (type !== 'challan') {
            const price = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0);
            const total = typeof item.total === 'number' ? item.total : parseFloat(item.total || 0);
            doc.text(`£${price.toFixed(2)}`, margin + contentWidth * 0.60, currentY + 5);
            doc.font('Helvetica-Bold');
            doc.text(`£${total.toFixed(2)}`, margin + contentWidth * 0.75, currentY + 5);
            doc.font('Helvetica');
          } else {
            doc.text(item.unit || 'pcs', margin + contentWidth * 0.60, currentY + 5);
          }
          currentY += rowHeight;
        });

        // Border
        doc.strokeColor(0, 0, 0).lineWidth(0.5);
        doc.rect(margin, tableTop, contentWidth, currentY - tableTop).stroke();
        yPos = currentY + 20;
      }

      // Totals
      if (type !== 'challan') {
        const docWithTotals = document as Quotation | Invoice;
        const subtotal = typeof docWithTotals.subtotal === 'string' 
          ? parseFloat(docWithTotals.subtotal) 
          : docWithTotals.subtotal || 0;
        const taxRate = typeof docWithTotals.taxRate === 'string' 
          ? parseFloat(docWithTotals.taxRate) 
          : docWithTotals.taxRate || 0;
        const taxAmount = typeof docWithTotals.taxAmount === 'string' 
          ? parseFloat(docWithTotals.taxAmount) 
          : docWithTotals.taxAmount || 0;
        const total = typeof docWithTotals.total === 'string' 
          ? parseFloat(docWithTotals.total) 
          : docWithTotals.total || 0;

        const totalsX = pageWidth - margin - 200;
        doc.fontSize(9).font('Helvetica').fillColor(0, 0, 0);
        doc.text('Subtotal:', totalsX, yPos);
        doc.text(`£${subtotal.toFixed(2)}`, totalsX + 120, yPos, { align: 'right' });
        yPos += 15;
        doc.text(`Tax (${taxRate.toFixed(2)}%):`, totalsX, yPos);
        doc.text(`£${taxAmount.toFixed(2)}`, totalsX + 120, yPos, { align: 'right' });
        yPos += 15;
        doc.fontSize(11).font('Helvetica-Bold').fillColor(0, 0, 0);
        doc.text('Total:', totalsX, yPos);
        doc.text(`£${total.toFixed(2)}`, totalsX + 120, yPos, { align: 'right' });
        yPos += 25;
      }

      // Notes
      if (document.notes) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(0, 0, 0);
        doc.text('Notes:', margin, yPos);
        yPos += 12;
        doc.fontSize(9).font('Helvetica').fillColor(0, 0, 0);
        doc.text(document.notes, margin, yPos, { width: contentWidth });
      }

      // Footer
      if (options.includeFooter !== false) {
        const footerY = doc.page.height - margin - 15;
        doc.fontSize(8).font('Helvetica').fillColor(0.5, 0.5, 0.5);
        doc.text(
          options.footerText || options.businessName || 'Thank you for your business!',
          margin,
          footerY,
          { width: contentWidth, align: 'center' }
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

  // Header
  if (options.includeHeader !== false) {
    if (options.businessName) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: options.businessName, bold: true, size: 28 })],
          spacing: { after: 120 },
        })
      );
    }
    if (options.businessAddress) {
      children.push(
        new Paragraph({
          text: options.businessAddress,
          spacing: { after: 80 },
        })
      );
    }
    if (options.businessEmail || options.businessPhone) {
      const contact = [options.businessEmail, options.businessPhone].filter(Boolean).join(' | ');
      children.push(
        new Paragraph({
          text: contact,
          spacing: { after: 200 },
        })
      );
    }
  }

  // Title
  const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';
  children.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Document Details
  const docNumber = type === 'quotation'
    ? (document as Quotation).quotationNumber
    : type === 'invoice'
    ? (document as Invoice).invoiceNumber
    : (document as DeliveryChallan).challanNumber;

  const docDate = new Date(document.createdAt!).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Document Number: ${docNumber}  |  Date: ${docDate}` }),
      ],
      spacing: { after: 200 },
    })
  );

  // Paid Stamp
  if (type === 'invoice' && (document as Invoice).status === 'paid') {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'PAID', bold: true, size: 40, color: '10b981' })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    );
  }

  // Bill To
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Bill To:', bold: true, size: 20 })],
      spacing: { after: 120 },
    })
  );
  children.push(new Paragraph({ text: document.customerName }));
  if (document.customerAddress) {
    children.push(new Paragraph({ text: document.customerAddress }));
  }
  if ('customerEmail' in document && document.customerEmail) {
    children.push(new Paragraph({ text: document.customerEmail }));
  }
  children.push(new Paragraph({ text: '' }));

  // Items Table
  if (Array.isArray(document.items) && document.items.length > 0) {
    const tableRows: TableRow[] = [];

    // Header
    const headerCells = [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Item', bold: true, color: 'ffffff' })],
        })],
        shading: { fill: '333333' },
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Quantity', bold: true, color: 'ffffff' })],
        })],
        shading: { fill: '333333' },
      }),
    ];
    
    if (type !== 'challan') {
      headerCells.push(
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Unit Price', bold: true, color: 'ffffff' })],
          })],
          shading: { fill: '333333' },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Total', bold: true, color: 'ffffff' })],
          })],
          shading: { fill: '333333' },
        })
      );
    } else {
      headerCells.push(
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Unit', bold: true, color: 'ffffff' })],
          })],
          shading: { fill: '333333' },
        })
      );
    }
    
    tableRows.push(new TableRow({ children: headerCells }));

    // Data Rows
    document.items.forEach((item: any, index: number) => {
      const cells = [
        new TableCell({
          children: [new Paragraph({ text: item.name || 'N/A' })],
          shading: index % 2 === 0 ? { fill: 'f5f5f5' } : undefined,
        }),
        new TableCell({
          children: [new Paragraph({ text: String(item.quantity || 0) })],
          shading: index % 2 === 0 ? { fill: 'f5f5f5' } : undefined,
        }),
      ];
      
      if (type !== 'challan') {
        const price = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0);
        const total = typeof item.total === 'number' ? item.total : parseFloat(item.total || 0);
        cells.push(
          new TableCell({
            children: [new Paragraph({ text: `£${price.toFixed(2)}` })],
            shading: index % 2 === 0 ? { fill: 'f5f5f5' } : undefined,
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: `£${total.toFixed(2)}`, bold: true })],
            })],
            shading: index % 2 === 0 ? { fill: 'f5f5f5' } : undefined,
          })
        );
      } else {
        cells.push(
          new TableCell({
            children: [new Paragraph({ text: item.unit || 'pcs' })],
            shading: index % 2 === 0 ? { fill: 'f5f5f5' } : undefined,
          })
        );
      }
      
      tableRows.push(new TableRow({ children: cells }));
    });

    children.push(
      new Table({
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
      })
    );
    children.push(new Paragraph({ text: '' }));
  }

  // Totals
  if (type !== 'challan') {
    const docWithTotals = document as Quotation | Invoice;
    const subtotal = typeof docWithTotals.subtotal === 'string' 
      ? parseFloat(docWithTotals.subtotal) 
      : docWithTotals.subtotal || 0;
    const taxRate = typeof docWithTotals.taxRate === 'string' 
      ? parseFloat(docWithTotals.taxRate) 
      : docWithTotals.taxRate || 0;
    const taxAmount = typeof docWithTotals.taxAmount === 'string' 
      ? parseFloat(docWithTotals.taxAmount) 
      : docWithTotals.taxAmount || 0;
    const total = typeof docWithTotals.total === 'string' 
      ? parseFloat(docWithTotals.total) 
      : docWithTotals.total || 0;

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Subtotal: ' }),
          new TextRun({ text: `£${subtotal.toFixed(2)}`, bold: true }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Tax (${taxRate.toFixed(2)}%): ` }),
          new TextRun({ text: `£${taxAmount.toFixed(2)}`, bold: true }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Total: ', bold: true, size: 24 }),
          new TextRun({ text: `£${total.toFixed(2)}`, bold: true, size: 24 }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    );
  }

  // Notes
  if (document.notes) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Notes:', bold: true, size: 20 })],
        spacing: { after: 120 },
      })
    );
    children.push(
      new Paragraph({
        text: document.notes,
        spacing: { after: 200 },
      })
    );
  }

  // Footer
  if (options.includeFooter !== false) {
    children.push(
      new Paragraph({
        text: options.footerText || options.businessName || 'Thank you for your business!',
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}
