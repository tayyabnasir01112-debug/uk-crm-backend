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

// Convert hex to RGB for PDFKit
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

// Convert hex to Word format (without #)
function hexToWord(hex: string): string {
  return hex.replace('#', '');
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
      const primaryColor = options.primaryColor || '#1e40af';
      const primaryRgb = hexToRgb(primaryColor);
      let yPos = margin;

      // Header Section
      if (options.includeHeader !== false) {
        if (options.businessName) {
          doc.fontSize(20)
             .font('Helvetica-Bold')
             .fillColor(...primaryRgb)
             .text(options.businessName, margin, yPos, { width: contentWidth });
          yPos += 26;
        }

        if (options.businessAddress) {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor(0, 0, 0)
             .text(options.businessAddress, margin, yPos, { width: contentWidth });
          yPos += 14;
        }

        if (options.businessEmail || options.businessPhone) {
          const contact = [options.businessEmail, options.businessPhone].filter(Boolean).join(' | ');
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor(0.4, 0.4, 0.4)
             .text(contact, margin, yPos, { width: contentWidth });
          yPos += 16;
        }

        // Header separator line
        doc.strokeColor(...primaryRgb)
           .lineWidth(2)
           .moveTo(margin, yPos)
           .lineTo(pageWidth - margin, yPos)
           .stroke();
        yPos += 20;
      }

      // Document Title
      const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .fillColor(0, 0, 0)
         .text(title, margin, yPos, { align: 'center', width: contentWidth });
      yPos += 32;

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

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(0, 0, 0);
      
      // Document number on left
      doc.text(`Document Number: ${docNumber}`, margin, yPos);
      
      // Date on right - calculate width for right alignment
      const dateText = `Date: ${docDate}`;
      const dateWidth = doc.widthOfString(dateText);
      doc.text(dateText, pageWidth - margin - dateWidth, yPos);
      
      yPos += 22;

      // Paid Stamp for Invoices
      if (type === 'invoice' && (document as Invoice).status === 'paid') {
        doc.save();
        const stampX = pageWidth - margin - 100;
        const stampY = yPos + 20;
        doc.translate(stampX, stampY)
           .rotate(-45)
           .fontSize(32)
           .font('Helvetica-Bold')
           .fillColor(0.06, 0.73, 0.51); // Green
        doc.text('PAID', 0, 0);
        doc.restore();
      }

      yPos += 18;

      // Bill To Section
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(0, 0, 0)
         .text('Bill To:', margin, yPos);
      yPos += 15;

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(0, 0, 0)
         .text(document.customerName, margin, yPos);
      yPos += 12;

      if (document.customerAddress) {
        doc.text(document.customerAddress, margin, yPos);
        yPos += 12;
      }

      if ('customerEmail' in document && document.customerEmail) {
        doc.text(document.customerEmail, margin, yPos);
        yPos += 12;
      }

      yPos += 18;

      // Items Table
      if (Array.isArray(document.items) && document.items.length > 0) {
        const tableTop = yPos;
        const rowHeight = 20;
        const headerHeight = 26;
        let currentY = tableTop;

        // Table Header Background
        doc.rect(margin, currentY, contentWidth, headerHeight)
           .fillColor(...primaryRgb)
           .fill();

        // Table Header Text
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(1, 1, 1);

        // Column positions
        const col1X = margin + 8;
        const col2X = margin + contentWidth * 0.50;
        const col3X = margin + contentWidth * 0.70;
        const col4X = margin + contentWidth * 0.85;

        doc.text('Item', col1X, currentY + 7);
        doc.text('Qty', col2X, currentY + 7);
        
        if (type !== 'challan') {
          doc.text('Unit Price', col3X, currentY + 7);
          const totalLabelWidth = doc.widthOfString('Total');
          doc.text('Total', col4X - totalLabelWidth, currentY + 7);
        } else {
          doc.text('Unit', col3X, currentY + 7);
        }

        currentY += headerHeight;

        // Table Rows
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(0, 0, 0);

        document.items.forEach((item: any, index: number) => {
          // Alternate row background
          if (index % 2 === 0) {
            doc.rect(margin, currentY, contentWidth, rowHeight)
               .fillColor(0.97, 0.97, 0.97)
               .fill();
          }

          // Reset fill color for text
          doc.fillColor(0, 0, 0);

          // Item name
          doc.text(item.name || 'N/A', col1X, currentY + 5, {
            width: col2X - col1X - 10
          });
          
          // Quantity
          doc.text(String(item.quantity || 0), col2X, currentY + 5);
          
          if (type !== 'challan') {
            // Unit price
            const priceText = `£${(typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0)).toFixed(2)}`;
            const priceWidth = doc.widthOfString(priceText);
            doc.text(priceText, col3X - priceWidth, currentY + 5);
            
            // Total
            const totalText = `£${(typeof item.total === 'number' ? item.total : parseFloat(item.total || 0)).toFixed(2)}`;
            const totalWidth = doc.widthOfString(totalText);
            doc.font('Helvetica-Bold');
            doc.text(totalText, col4X - totalWidth, currentY + 5);
            doc.font('Helvetica');
          } else {
            doc.text(item.unit || 'pcs', col3X, currentY + 5);
          }

          currentY += rowHeight;
        });

        // Table Border
        doc.strokeColor(0.8, 0.8, 0.8)
           .lineWidth(0.5)
           .rect(margin, tableTop, contentWidth, currentY - tableTop)
           .stroke();

        yPos = currentY + 22;
      }

      // Totals Section
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
        const totalsY = yPos;

        // Totals background box
        doc.rect(totalsX - 10, totalsY, 200, 80)
           .fillColor(0.98, 0.98, 0.98)
           .fill();

        let totalsYPos = totalsY + 10;

        // Subtotal
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(0, 0, 0);
        doc.text('Subtotal:', totalsX, totalsYPos);
        const subtotalText = `£${subtotal.toFixed(2)}`;
        const subtotalWidth = doc.widthOfString(subtotalText);
        doc.font('Helvetica-Bold');
        doc.text(subtotalText, totalsX + 180 - subtotalWidth, totalsYPos);
        totalsYPos += 16;

        // Tax
        doc.font('Helvetica');
        doc.text(`Tax (${taxRate.toFixed(2)}%):`, totalsX, totalsYPos);
        const taxText = `£${taxAmount.toFixed(2)}`;
        const taxWidth = doc.widthOfString(taxText);
        doc.font('Helvetica-Bold');
        doc.text(taxText, totalsX + 180 - taxWidth, totalsYPos);
        totalsYPos += 16;

        // Divider line
        doc.strokeColor(0.7, 0.7, 0.7)
           .lineWidth(1)
           .moveTo(totalsX, totalsYPos)
           .lineTo(totalsX + 180, totalsYPos)
           .stroke();
        totalsYPos += 10;

        // Total
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(...primaryRgb);
        doc.text('Total:', totalsX, totalsYPos);
        const totalText = `£${total.toFixed(2)}`;
        const totalWidth = doc.widthOfString(totalText);
        doc.fontSize(14);
        doc.text(totalText, totalsX + 180 - totalWidth, totalsYPos);

        yPos = totalsY + 85;
      }

      // Notes Section
      if (document.notes) {
        yPos += 12;
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(0, 0, 0)
           .text('Notes:', margin, yPos);
        yPos += 14;
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(0, 0, 0)
           .text(document.notes, margin, yPos, {
             width: contentWidth,
             align: 'left'
           });
      }

      // Footer
      if (options.includeFooter !== false) {
        const footerY = pageHeight - margin - 15;
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(...primaryRgb)
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
  const primaryColor = options.primaryColor || '#1e40af';
  const primaryColorWord = hexToWord(primaryColor);

  // Header
  if (options.includeHeader !== false) {
    if (options.businessName) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: options.businessName,
              bold: true,
              size: 28,
              color: primaryColorWord,
            }),
          ],
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
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32,
        }),
      ],
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
        children: [
          new TextRun({
            text: 'PAID',
            bold: true,
            size: 40,
            color: '10b981',
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    );
  }

  // Bill To
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Bill To:',
          bold: true,
          size: 20,
        }),
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

    // Header
    const headerCells = [
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Item',
                bold: true,
                color: 'ffffff',
              }),
            ],
          }),
        ],
        shading: { fill: primaryColorWord },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Quantity',
                bold: true,
                color: 'ffffff',
              }),
            ],
          }),
        ],
        shading: { fill: primaryColorWord },
      }),
    ];
    
    if (type !== 'challan') {
      headerCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Unit Price',
                  bold: true,
                  color: 'ffffff',
                }),
              ],
            }),
          ],
          shading: { fill: primaryColorWord },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Total',
                  bold: true,
                  color: 'ffffff',
                }),
              ],
            }),
          ],
          shading: { fill: primaryColorWord },
        })
      );
    } else {
      headerCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Unit',
                  bold: true,
                  color: 'ffffff',
                }),
              ],
            }),
          ],
          shading: { fill: primaryColorWord },
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
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `£${total.toFixed(2)}`,
                    bold: true,
                  }),
                ],
              }),
            ],
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
          new TextRun({
            text: 'Total: ',
            bold: true,
            size: 24,
            color: primaryColorWord,
          }),
          new TextRun({
            text: `£${total.toFixed(2)}`,
            bold: true,
            size: 24,
            color: primaryColorWord,
          }),
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
          new TextRun({
            text: 'Notes:',
            bold: true,
            size: 20,
          }),
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
        children: [
          new TextRun({
            text: options.footerText || options.businessName || 'Thank you for your business!',
            color: primaryColorWord,
          }),
        ],
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
