// import PDFDocument from 'pdfkit'; // Replaced with pdfmake
import PdfPrinter from 'pdfmake';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, Footer, Section } from 'docx';
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

function hexToRgb(hex: string): string {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return '#1e40af'; // Default blue
  }
  return `#${cleanHex}`;
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
  const primaryColor = options.primaryColor || '#1e40af';
  const primaryColorHex = hexToRgb(primaryColor);
  
  const docNumber = type === 'quotation' 
    ? (document as Quotation).quotationNumber
    : type === 'invoice'
    ? (document as Invoice).invoiceNumber
    : (document as DeliveryChallan).challanNumber;
  const docDate = new Date(document.createdAt!).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const title = type === 'quotation' ? 'QUOTATION' : type === 'invoice' ? 'INVOICE' : 'DELIVERY CHALLAN';

  // Calculate totals
  let calculatedSubtotal = 0;
  if (Array.isArray(document.items) && document.items.length > 0) {
    document.items.forEach((item: any) => {
      const quantity = parseDecimal(item.quantity);
      const unitPrice = parseDecimal(item.unitPrice);
      let itemTotal = parseDecimal(item.total);
      if (itemTotal === 0 && unitPrice > 0 && quantity > 0) {
        itemTotal = unitPrice * quantity;
      }
      calculatedSubtotal += itemTotal;
    });
  }

  let subtotal = calculatedSubtotal;
  let taxAmount = 0;
  let total = subtotal;
  
  if (type !== 'challan') {
    const docWithTotals = document as Quotation | Invoice;
    const taxRate = parseDecimal(docWithTotals.taxRate) || 20;
    if (subtotal === 0) {
      subtotal = parseDecimal(docWithTotals.subtotal);
    }
    taxAmount = subtotal * (taxRate / 100);
    total = subtotal + taxAmount;
  }

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [50, 50, 50, 50],
    content: [],
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10,
      color: '#000000'
    }
  };

  // Header
  if (options.includeHeader !== false) {
    const headerContent: any[] = [];
    
    if (options.businessName) {
      headerContent.push({
        text: options.businessName,
        fontSize: 18,
        bold: true,
        color: primaryColorHex,
        margin: [0, 0, 0, 4]
      });
    }
    
    if (options.businessAddress) {
      headerContent.push({
        text: options.businessAddress,
        fontSize: 10,
        margin: [0, 0, 0, 2]
      });
    }
    
    if (options.businessEmail || options.businessPhone) {
      const contact = [options.businessEmail, options.businessPhone].filter(Boolean).join(' | ');
      headerContent.push({
        text: contact,
        fontSize: 9,
        color: '#808080',
        margin: [0, 0, 0, 8]
      });
    }
    
    headerContent.push({
      canvas: [{
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        lineWidth: 1,
        lineColor: primaryColorHex
      }],
      margin: [0, 0, 0, 20]
    });
    
    docDefinition.content.push(...headerContent);
  }

  // Title
  docDefinition.content.push({
    text: title,
    fontSize: 20,
    bold: true,
    alignment: 'center',
    margin: [0, 0, 0, 30]
  });

  // Document Info
  docDefinition.content.push({
    columns: [
      {
        text: `Document Number: ${docNumber}`,
        fontSize: 10
      },
      {
        text: `Date: ${docDate}`,
        fontSize: 10,
        alignment: 'right'
      }
    ],
    margin: [0, 0, 0, 25]
  });

  // Paid Stamp
  if (type === 'invoice' && (document as Invoice).status === 'paid') {
    docDefinition.content.push({
      text: 'PAID',
      fontSize: 30,
      bold: true,
      color: '#10B981',
      absolutePosition: { x: 450, y: 200 },
      angle: -45,
      opacity: 0.3
    });
  }

  // Bill To
  const billToContent: any[] = [
    {
      text: 'Bill To:',
      fontSize: 11,
      bold: true,
      margin: [0, 0, 0, 4]
    },
    {
      text: document.customerName,
      fontSize: 10,
      margin: [0, 0, 0, 2]
    }
  ];
  
  if (document.customerAddress) {
    billToContent.push({
      text: document.customerAddress,
      fontSize: 10,
      margin: [0, 0, 0, 2]
    });
  }
  
  if ('customerEmail' in document && document.customerEmail) {
    billToContent.push({
      text: document.customerEmail,
      fontSize: 10,
      margin: [0, 0, 0, 20]
    });
  } else {
    billToContent[billToContent.length - 1].margin = [0, 0, 0, 20];
  }
  
  docDefinition.content.push(...billToContent);

  // Items Table
  if (Array.isArray(document.items) && document.items.length > 0) {
    const tableBody: any[] = [];
    
    // Header row
    const headerRow: any[] = [
      { text: 'Item', fillColor: primaryColorHex, color: '#FFFFFF', bold: true },
      { text: 'Qty', fillColor: primaryColorHex, color: '#FFFFFF', bold: true }
    ];
    
    if (type !== 'challan') {
      headerRow.push(
        { text: 'Price', fillColor: primaryColorHex, color: '#FFFFFF', bold: true, alignment: 'right' },
        { text: 'Total', fillColor: primaryColorHex, color: '#FFFFFF', bold: true, alignment: 'right' }
      );
    } else {
      headerRow.push({ text: 'Unit', fillColor: primaryColorHex, color: '#FFFFFF', bold: true });
    }
    
    tableBody.push(headerRow);
    
    // Data rows
    document.items.forEach((item: any) => {
      const quantity = parseDecimal(item.quantity);
      const unitPrice = parseDecimal(item.unitPrice);
      let itemTotal = parseDecimal(item.total);
      if (itemTotal === 0 && unitPrice > 0 && quantity > 0) {
        itemTotal = unitPrice * quantity;
      }
      
      const row: any[] = [
        { text: item.name || 'N/A' },
        { text: String(quantity) }
      ];
      
      if (type !== 'challan') {
        row.push(
          { text: `£${unitPrice.toFixed(2)}`, alignment: 'right' },
          { text: `£${itemTotal.toFixed(2)}`, alignment: 'right', bold: true }
        );
      } else {
        row.push({ text: item.unit || 'pcs' });
      }
      
      tableBody.push(row);
    });
    
    docDefinition.content.push({
      table: {
        headerRows: 1,
        widths: type !== 'challan' ? ['*', 'auto', 'auto', 'auto'] : ['*', 'auto', 'auto'],
        body: tableBody
      },
      margin: [0, 0, 0, 20]
    });
  }

  // Totals
  if (type !== 'challan') {
    const totalsContent: any[] = [
      {
        columns: [
          { text: 'Subtotal:', alignment: 'right' },
          { text: `£${subtotal.toFixed(2)}`, alignment: 'right', bold: true }
        ],
        margin: [0, 0, 0, 4]
      },
      {
        columns: [
          { text: `Tax (${parseDecimal((document as Quotation | Invoice).taxRate || 20).toFixed(2)}%):`, alignment: 'right' },
          { text: `£${taxAmount.toFixed(2)}`, alignment: 'right', bold: true }
        ],
        margin: [0, 0, 0, 4]
      },
      {
        canvas: [{
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 180,
          y2: 0,
          lineWidth: 1,
          lineColor: '#B3B3B3'
        }],
        margin: [335, 4, 0, 4]
      },
      {
        columns: [
          { text: 'Total:', alignment: 'right', fontSize: 12, bold: true, color: primaryColorHex },
          { text: `£${total.toFixed(2)}`, alignment: 'right', fontSize: 14, bold: true, color: primaryColorHex }
        ],
        margin: [0, 0, 0, 25]
      }
    ];
    
    docDefinition.content.push(...totalsContent);
  }

  // Notes
  if (document.notes) {
    docDefinition.content.push(
      {
        text: 'Notes:',
        fontSize: 10,
        bold: true,
        margin: [0, 0, 0, 4]
      },
      {
        text: document.notes,
        fontSize: 9,
        margin: [0, 0, 0, 20]
      }
    );
  }

  // Footer
  if (options.includeFooter !== false) {
    docDefinition.footer = function(currentPage: number, pageCount: number) {
      return {
        text: options.footerText || options.businessName || 'Thank you for your business!',
        fontSize: 8,
        color: primaryColorHex,
        alignment: 'center',
        margin: [0, 15, 0, 0]
      };
    };
  }

  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
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

  // Document Info - Document Number on left, Date on right
  const docNumber = type === 'quotation'
    ? (document as Quotation).quotationNumber
    : type === 'invoice'
    ? (document as Invoice).invoiceNumber
    : (document as DeliveryChallan).challanNumber;
  const docDate = new Date(document.createdAt!).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  // Use tabs to align date to the right
  children.push(new Paragraph({
    children: [
      new TextRun({ text: `Document Number: ${docNumber}` }),
      new TextRun({ text: '\t' }),
      new TextRun({ text: `Date: ${docDate}` })
    ],
    tabStops: [{ type: 'right', position: 9000 }],
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
