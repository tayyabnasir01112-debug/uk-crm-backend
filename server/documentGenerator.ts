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
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Header Section
      if (options.includeHeader !== false) {
        if (options.businessName) {
          doc.fontSize(24)
             .font('Helvetica-Bold')
             .fillColor(0.12, 0.25, 0.69) // Blue
             .text(options.businessName, margin, yPosition, {
               width: contentWidth,
               align: 'left'
             });
          yPosition += 30;
        }

        if (options.businessAddress) {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor(0, 0, 0) // Black
             .text(options.businessAddress, margin, yPosition, {
               width: contentWidth,
               align: 'left'
             });
          yPosition += 15;
        }

        if (options.businessEmail || options.businessPhone) {
          const contactInfo = [
            options.businessEmail,
            options.businessPhone
          ].filter(Boolean).join(' | ');
          
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor(0.4, 0.4, 0.4) // Gray
             .text(contactInfo, margin, yPosition, {
               width: contentWidth,
               align: 'left'
             });
          yPosition += 20;
        }

        // Separator line
        doc.strokeColor(0.9, 0.9, 0.9)
           .lineWidth(1)
           .moveTo(margin, yPosition)
           .lineTo(pageWidth - margin, yPosition)
           .stroke();
        yPosition += 20;
      }

      // Document Title
      const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';
      
      // Title background
      doc.rect(margin, yPosition, contentWidth, 40)
         .fillColor(0.95, 0.95, 0.95)
         .fill();
      
      // Title text
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor(0, 0, 0)
         .text(title, margin + 10, yPosition + 10, {
           width: contentWidth - 20,
           align: 'center'
         });
      
      yPosition += 50;

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

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(0, 0, 0)
         .text('Document Number:', margin, yPosition);
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(0, 0, 0)
         .text(docNumber, margin + 100, yPosition);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(0, 0, 0)
         .text('Date:', pageWidth - margin - 150, yPosition);
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(0, 0, 0)
         .text(docDate, pageWidth - margin - 100, yPosition);

      yPosition += 25;

      // Paid Stamp for Invoices
      if (type === 'invoice' && (document as Invoice).status === 'paid') {
        doc.save();
        doc.translate(pageWidth - margin - 80, yPosition)
           .rotate(-45)
           .fontSize(32)
           .font('Helvetica-Bold')
           .fillColor(0.06, 0.73, 0.51) // Green
           .text('PAID', 0, 0);
        doc.restore();
        yPosition += 40;
      }

      yPosition += 10;

      // Customer Information
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(0, 0, 0)
         .text('Bill To:', margin, yPosition);
      
      yPosition += 15;

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(0, 0, 0)
         .text(document.customerName, margin, yPosition);
      yPosition += 12;

      if (document.customerAddress) {
        doc.text(document.customerAddress, margin, yPosition);
        yPosition += 12;
      }

      if ('customerEmail' in document && document.customerEmail) {
        doc.text(document.customerEmail, margin, yPosition);
        yPosition += 12;
      }

      yPosition += 15;

      // Items Table
      if (Array.isArray(document.items) && document.items.length > 0) {
        const tableTop = yPosition;
        const rowHeight = 25;
        const headerHeight = 30;
        let currentY = tableTop;

        // Draw table header background
        doc.rect(margin, currentY, contentWidth, headerHeight)
           .fillColor(0.12, 0.25, 0.69) // Blue
           .fill();

        // Header text
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(1, 1, 1); // White

        const colWidths = type !== 'challan' 
          ? [contentWidth * 0.40, contentWidth * 0.15, contentWidth * 0.20, contentWidth * 0.25]
          : [contentWidth * 0.50, contentWidth * 0.25, contentWidth * 0.25];

        let xPos = margin + 10;
        doc.text('Item', xPos, currentY + 8);
        xPos += colWidths[0];
        doc.text('Quantity', xPos, currentY + 8);
        xPos += colWidths[1];
        
        if (type !== 'challan') {
          doc.text('Unit Price', xPos, currentY + 8);
          xPos += colWidths[2];
          doc.text('Total', xPos, currentY + 8);
        } else {
          doc.text('Unit', xPos, currentY + 8);
        }

        currentY += headerHeight;

        // Table rows
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(0, 0, 0); // Black

        document.items.forEach((item: any, index: number) => {
          // Row background for even rows
          if (index % 2 === 0) {
            doc.rect(margin, currentY, contentWidth, rowHeight)
               .fillColor(0.98, 0.98, 0.98)
               .fill();
          }

          // Reset fill color for text
          doc.fillColor(0, 0, 0);

          xPos = margin + 10;
          
          // Item name
          doc.text(item.name || 'N/A', xPos, currentY + 8, {
            width: colWidths[0] - 10
          });
          xPos += colWidths[0];

          // Quantity
          doc.text(String(item.quantity || 0), xPos, currentY + 8);
          xPos += colWidths[1];

          if (type !== 'challan') {
            // Unit price
            doc.text(`£${(typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0)).toFixed(2)}`, xPos, currentY + 8);
            xPos += colWidths[2];
            // Total
            doc.font('Helvetica-Bold')
               .text(`£${(typeof item.total === 'number' ? item.total : parseFloat(item.total || 0)).toFixed(2)}`, xPos, currentY + 8);
            doc.font('Helvetica');
          } else {
            // Unit
            doc.text(item.unit || 'pcs', xPos, currentY + 8);
          }

          currentY += rowHeight;
        });

        // Table border
        doc.strokeColor(0.82, 0.82, 0.82)
           .lineWidth(1)
           .rect(margin, tableTop, contentWidth, currentY - tableTop)
           .stroke();

        yPosition = currentY + 20;
      }

      // Totals Section
      if (type !== 'challan') {
        const docWithTotals = document as Quotation | Invoice;
        const totalsStartX = pageWidth - margin - 200;
        const totalsY = yPosition;

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

        // Totals background
        doc.rect(totalsStartX - 10, totalsY, 200, 80)
           .fillColor(0.98, 0.98, 0.98)
           .fill();

        let totalsYPos = totalsY + 10;

        // Subtotal
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(0, 0, 0)
           .text('Subtotal:', totalsStartX, totalsYPos);
        doc.font('Helvetica-Bold')
           .fillColor(0, 0, 0)
           .text(`£${subtotal.toFixed(2)}`, totalsStartX + 100, totalsYPos, { align: 'right' });
        totalsYPos += 15;

        // Tax
        doc.font('Helvetica')
           .fillColor(0, 0, 0)
           .text(`Tax (${taxRate.toFixed(2)}%):`, totalsStartX, totalsYPos);
        doc.font('Helvetica-Bold')
           .fillColor(0, 0, 0)
           .text(`£${taxAmount.toFixed(2)}`, totalsStartX + 100, totalsYPos, { align: 'right' });
        totalsYPos += 15;

        // Divider
        doc.strokeColor(0.82, 0.82, 0.82)
           .lineWidth(1)
           .moveTo(totalsStartX, totalsYPos)
           .lineTo(totalsStartX + 180, totalsYPos)
           .stroke();
        totalsYPos += 10;

        // Total
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(0.12, 0.25, 0.69) // Blue
           .text('Total:', totalsStartX, totalsYPos);
        doc.fontSize(14)
           .fillColor(0.12, 0.25, 0.69)
           .text(`£${total.toFixed(2)}`, totalsStartX + 100, totalsYPos, { align: 'right' });

        yPosition = totalsY + 90;
      }

      // Notes
      if (document.notes) {
        yPosition += 10;
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(0, 0, 0)
           .text('Notes:', margin, yPosition);
        yPosition += 15;
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(0, 0, 0)
           .text(document.notes, margin, yPosition, {
             width: contentWidth,
             align: 'left'
           });
      }

      // Footer
      if (options.includeFooter !== false) {
        const footerY = pageHeight - margin - 20;
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(0.6, 0.6, 0.6)
           .text(
             options.footerText || options.businessName || 'Thank you for your business!',
             margin,
             footerY,
             {
               width: contentWidth,
               align: 'center'
             }
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
          children: [
            new TextRun({
              text: options.businessName,
              bold: true,
              size: 32,
              color: '1e40af',
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 120 },
        })
      );
    }

    if (options.businessAddress) {
      children.push(
        new Paragraph({
          text: options.businessAddress,
          alignment: AlignmentType.LEFT,
          spacing: { after: 80 },
        })
      );
    }

    if (options.businessEmail || options.businessPhone) {
      const contactInfo = [options.businessEmail, options.businessPhone].filter(Boolean).join(' | ');
      children.push(
        new Paragraph({
          text: contactInfo,
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
        })
      );
    }
  }

  // Document Title
  const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 36,
          color: '000000',
        }),
      ],
      alignment: AlignmentType.CENTER,
      shading: {
        fill: 'f3f4f6',
      },
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
        new TextRun({ text: 'Document Number: ', bold: true }),
        new TextRun({ text: docNumber }),
      ],
      spacing: { after: 120 },
    })
  );
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Date: ', bold: true }),
        new TextRun({ text: docDate }),
      ],
      spacing: { after: 200 },
    })
  );

  // Paid Stamp
  if (type === 'invoice' && (document as Invoice).status === 'paid') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PAID',
            bold: true,
            size: 48,
            color: '10b981',
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    );
  }

  children.push(new Paragraph({ text: '' }));

  // Customer Information
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Bill To:', bold: true, size: 22 }),
      ],
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

    // Header Row
    const headerCells = [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Item', bold: true, color: 'ffffff' })],
          alignment: AlignmentType.LEFT,
        })],
        shading: { fill: '1e40af' },
        verticalAlign: 'center',
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Quantity', bold: true, color: 'ffffff' })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: '1e40af' },
        verticalAlign: 'center',
      }),
    ];
    
    if (type !== 'challan') {
      headerCells.push(
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Unit Price', bold: true, color: 'ffffff' })],
            alignment: AlignmentType.RIGHT,
          })],
          shading: { fill: '1e40af' },
          verticalAlign: 'center',
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Total', bold: true, color: 'ffffff' })],
            alignment: AlignmentType.RIGHT,
          })],
          shading: { fill: '1e40af' },
          verticalAlign: 'center',
        })
      );
    } else {
      headerCells.push(
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Unit', bold: true, color: 'ffffff' })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { fill: '1e40af' },
          verticalAlign: 'center',
        })
      );
    }
    
    tableRows.push(new TableRow({ 
      children: headerCells,
      tableHeader: true,
    }));

    // Data Rows
    document.items.forEach((item: any, index: number) => {
      const cells = [
        new TableCell({
          children: [new Paragraph({
            text: item.name || 'N/A',
            alignment: AlignmentType.LEFT,
          })],
          shading: index % 2 === 0 ? { fill: 'f9fafb' } : undefined,
        }),
        new TableCell({
          children: [new Paragraph({
            text: String(item.quantity || 0),
            alignment: AlignmentType.CENTER,
          })],
          shading: index % 2 === 0 ? { fill: 'f9fafb' } : undefined,
        }),
      ];
      
      if (type !== 'challan') {
        cells.push(
          new TableCell({
            children: [new Paragraph({
              text: `£${(typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0)).toFixed(2)}`,
              alignment: AlignmentType.RIGHT,
            })],
            shading: index % 2 === 0 ? { fill: 'f9fafb' } : undefined,
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: `£${(typeof item.total === 'number' ? item.total : parseFloat(item.total || 0)).toFixed(2)}`,
                bold: true,
              })],
              alignment: AlignmentType.RIGHT,
            })],
            shading: index % 2 === 0 ? { fill: 'f9fafb' } : undefined,
          })
        );
      } else {
        cells.push(
          new TableCell({
            children: [new Paragraph({
              text: item.unit || 'pcs',
              alignment: AlignmentType.CENTER,
            })],
            shading: index % 2 === 0 ? { fill: 'f9fafb' } : undefined,
          })
        );
      }
      
      tableRows.push(new TableRow({ children: cells }));
    });

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' },
      },
    });

    children.push(table);
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
          new TextRun({ text: 'Subtotal: ', size: 20 }),
          new TextRun({ text: `£${subtotal.toFixed(2)}`, bold: true, size: 20 }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Tax (${taxRate.toFixed(2)}%): `, size: 20 }),
          new TextRun({ text: `£${taxAmount.toFixed(2)}`, bold: true, size: 20 }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Total: ', bold: true, size: 24, color: '1e40af' }),
          new TextRun({ text: `£${total.toFixed(2)}`, bold: true, size: 28, color: '1e40af' }),
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
        children: [
          new TextRun({ text: 'Notes:', bold: true, size: 22 }),
        ],
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
    sections: [
      {
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
