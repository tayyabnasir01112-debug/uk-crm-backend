import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
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
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      if (options.includeHeader !== false) {
        if (options.businessName) {
          doc.fontSize(20).text(options.businessName, { align: 'center' });
        }
        if (options.businessAddress) {
          doc.fontSize(10).text(options.businessAddress, { align: 'center' });
        }
        if (options.businessEmail || options.businessPhone) {
          const contactInfo = [options.businessEmail, options.businessPhone].filter(Boolean).join(' | ');
          doc.fontSize(10).text(contactInfo, { align: 'center' });
        }
        doc.moveDown(2);
      }

      // Document Title
      const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';
      doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown();

      // Document Number and Date
      const docNumber = type === 'quotation' 
        ? (document as Quotation).quotationNumber
        : type === 'invoice'
        ? (document as Invoice).invoiceNumber
        : (document as DeliveryChallan).challanNumber;
      
      doc.fontSize(12).font('Helvetica');
      doc.text(`Document Number: ${docNumber}`, { align: 'left' });
      doc.text(`Date: ${new Date(document.createdAt!).toLocaleDateString('en-GB')}`, { align: 'left' });
      
      if (type === 'invoice' && (document as Invoice).status === 'paid') {
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').fillColor('green')
          .text('PAID', { align: 'right' });
        doc.fillColor('black');
      }
      
      doc.moveDown(2);

      // Customer Information
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', { continued: false });
      doc.font('Helvetica').fontSize(10);
      doc.text(document.customerName);
      if (document.customerAddress) {
        doc.text(document.customerAddress);
      }
      if ('customerEmail' in document && document.customerEmail) {
        doc.text(document.customerEmail);
      }
      doc.moveDown(2);

      // Items Table
      if (Array.isArray(document.items) && document.items.length > 0) {
        const tableTop = doc.y;
        const itemHeight = 20;
        let y = tableTop;

        // Table Header
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Item', 50, y);
        doc.text('Quantity', 250, y);
        if (type !== 'challan') {
          doc.text('Unit Price', 350, y);
          doc.text('Total', 450, y);
        } else {
          doc.text('Unit', 350, y);
        }
        y += itemHeight;

        // Table Rows
        doc.font('Helvetica').fontSize(9);
        document.items.forEach((item: any) => {
          doc.text(item.name || 'N/A', 50, y, { width: 180 });
          doc.text(String(item.quantity || 0), 250, y);
          if (type !== 'challan') {
            doc.text(`£${(typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0)).toFixed(2)}`, 350, y);
            doc.text(`£${(typeof item.total === 'number' ? item.total : parseFloat(item.total || 0)).toFixed(2)}`, 450, y);
          } else {
            doc.text(item.unit || 'pcs', 350, y);
          }
          y += itemHeight;
        });

        // Draw lines
        doc.moveTo(50, tableTop).lineTo(550, tableTop).stroke();
        doc.moveTo(50, tableTop + itemHeight).lineTo(550, tableTop + itemHeight).stroke();
        doc.moveTo(50, y).lineTo(550, y).stroke();
        doc.y = y + 10;
      }

      // Totals (for quotations and invoices)
      if (type !== 'challan') {
        const docWithTotals = document as Quotation | Invoice;
        doc.moveDown();
        doc.font('Helvetica').fontSize(10);
        doc.text(`Subtotal: £${(typeof docWithTotals.subtotal === 'string' ? parseFloat(docWithTotals.subtotal) : docWithTotals.subtotal || 0).toFixed(2)}`, { align: 'right' });
        doc.text(`Tax Rate: ${(typeof docWithTotals.taxRate === 'string' ? parseFloat(docWithTotals.taxRate) : docWithTotals.taxRate || 0)}%`, { align: 'right' });
        doc.text(`Tax Amount: £${(typeof docWithTotals.taxAmount === 'string' ? parseFloat(docWithTotals.taxAmount) : docWithTotals.taxAmount || 0).toFixed(2)}`, { align: 'right' });
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(`Total: £${(typeof docWithTotals.total === 'string' ? parseFloat(docWithTotals.total) : docWithTotals.total || 0).toFixed(2)}`, { align: 'right' });
      }

      // Notes
      if (document.notes) {
        doc.moveDown(2);
        doc.font('Helvetica').fontSize(10);
        doc.text('Notes:', { continued: false });
        doc.text(document.notes);
      }

      // Footer
      if (options.includeFooter !== false) {
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;
        doc.fontSize(8).font('Helvetica');
        doc.text(
          options.footerText || options.businessName || 'Thank you for your business!',
          pageWidth / 2,
          pageHeight - 50,
          { align: 'center' }
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
          text: options.businessName,
          alignment: AlignmentType.CENTER,
          heading: 'Heading1',
        })
      );
    }
    if (options.businessAddress) {
      children.push(
        new Paragraph({
          text: options.businessAddress,
          alignment: AlignmentType.CENTER,
        })
      );
    }
    if (options.businessEmail || options.businessPhone) {
      const contactInfo = [options.businessEmail, options.businessPhone].filter(Boolean).join(' | ');
      children.push(
        new Paragraph({
          text: contactInfo,
          alignment: AlignmentType.CENTER,
        })
      );
    }
    children.push(new Paragraph({ text: '' }));
  }

  // Document Title
  const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';
  children.push(
    new Paragraph({
      text: title,
      alignment: AlignmentType.CENTER,
      heading: 'Heading1',
    })
  );
  children.push(new Paragraph({ text: '' }));

  // Document Number and Date
  const docNumber = type === 'quotation'
    ? (document as Quotation).quotationNumber
    : type === 'invoice'
    ? (document as Invoice).invoiceNumber
    : (document as DeliveryChallan).challanNumber;

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Document Number: ${docNumber}`, bold: true }),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Date: ${new Date(document.createdAt!).toLocaleDateString('en-GB')}` }),
      ],
    })
  );

  if (type === 'invoice' && (document as Invoice).status === 'paid') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'PAID', bold: true, color: '008000' }),
        ],
        alignment: AlignmentType.RIGHT,
      })
    );
  }

  children.push(new Paragraph({ text: '' }));

  // Customer Information
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Bill To:', bold: true }),
      ],
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

    // Header Row
    const headerCells = [
      new TableCell({ children: [new Paragraph({ text: 'Item', children: [new TextRun({ text: 'Item', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ text: 'Quantity', children: [new TextRun({ text: 'Quantity', bold: true })] })] }),
    ];
    if (type !== 'challan') {
      headerCells.push(
        new TableCell({ children: [new Paragraph({ text: 'Unit Price', children: [new TextRun({ text: 'Unit Price', bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ text: 'Total', children: [new TextRun({ text: 'Total', bold: true })] })] })
      );
    } else {
      headerCells.push(
        new TableCell({ children: [new Paragraph({ text: 'Unit', children: [new TextRun({ text: 'Unit', bold: true })] })] })
      );
    }
    tableRows.push(new TableRow({ children: headerCells }));

    // Data Rows
    document.items.forEach((item: any) => {
      const cells = [
        new TableCell({ children: [new Paragraph({ text: item.name || 'N/A' })] }),
        new TableCell({ children: [new Paragraph({ text: String(item.quantity || 0) })] }),
      ];
      if (type !== 'challan') {
        cells.push(
          new TableCell({ children: [new Paragraph({ text: `£${(typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0)).toFixed(2)}` })] }),
          new TableCell({ children: [new Paragraph({ text: `£${(typeof item.total === 'number' ? item.total : parseFloat(item.total || 0)).toFixed(2)}` })] })
        );
      } else {
        cells.push(
          new TableCell({ children: [new Paragraph({ text: item.unit || 'pcs' })] })
        );
      }
      tableRows.push(new TableRow({ children: cells }));
    });

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    children.push(table);
    children.push(new Paragraph({ text: '' }));
  }

  // Totals (for quotations and invoices)
  if (type !== 'challan') {
    const docWithTotals = document as Quotation | Invoice;
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Subtotal: £${(typeof docWithTotals.subtotal === 'string' ? parseFloat(docWithTotals.subtotal) : docWithTotals.subtotal || 0).toFixed(2)}` }),
        ],
        alignment: AlignmentType.RIGHT,
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Tax Rate: ${(typeof docWithTotals.taxRate === 'string' ? parseFloat(docWithTotals.taxRate) : docWithTotals.taxRate || 0)}%` }),
        ],
        alignment: AlignmentType.RIGHT,
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Tax Amount: £${(typeof docWithTotals.taxAmount === 'string' ? parseFloat(docWithTotals.taxAmount) : docWithTotals.taxAmount || 0).toFixed(2)}` }),
        ],
        alignment: AlignmentType.RIGHT,
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Total: £${(typeof docWithTotals.total === 'string' ? parseFloat(docWithTotals.total) : docWithTotals.total || 0).toFixed(2)}`, bold: true }),
        ],
        alignment: AlignmentType.RIGHT,
      })
    );
  }

  // Notes
  if (document.notes) {
    children.push(new Paragraph({ text: '' }));
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Notes:', bold: true }),
        ],
      })
    );
    children.push(new Paragraph({ text: document.notes }));
  }

  // Footer
  if (options.includeFooter !== false) {
    children.push(new Paragraph({ text: '' }));
    children.push(
      new Paragraph({
        text: options.footerText || options.businessName || 'Thank you for your business!',
        alignment: AlignmentType.CENTER,
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

