import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import express from "express";
import {
  insertBusinessSchema,
  insertQuotationSchema,
  insertInvoiceSchema,
  insertDeliveryChallanSchema,
  insertInventoryItemSchema,
  insertEmployeeSchema,
  insertCustomerSchema,
} from "@shared/schema";
import { generatePDF, generateWord } from "./documentGenerator";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Health check endpoint for monitoring (no auth required)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/business', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let business = await storage.getBusiness(userId);
      
      if (!business) {
        business = await storage.createBusiness({
          userId,
          businessName: "My Business",
          onboardingCompleted: false,
        });
        
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        await storage.createSubscription({
          userId,
          status: "trial",
          trialEndsAt,
        });
      }
      
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.put('/api/business', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertBusinessSchema.partial().parse(req.body);
      const business = await storage.updateBusiness(userId, validatedData);
      res.json(business);
    } catch (error) {
      console.error("Error updating business:", error);
      res.status(500).json({ message: "Failed to update business" });
    }
  });

  app.post('/api/business/complete-onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertBusinessSchema.partial().parse(req.body);
      const business = await storage.updateBusiness(userId, {
        ...validatedData,
        onboardingCompleted: true,
      });
      res.json(business);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await storage.getSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.get('/api/quotations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const quotations = await storage.getQuotations(userId);
      res.json(quotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.post('/api/quotations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertQuotationSchema.parse({
        ...req.body,
        userId,
      });
      
      // Generate base document number if not provided (extract number from quotationNumber)
      let baseDocNumber = validatedData.baseDocumentNumber;
      if (!baseDocNumber && validatedData.quotationNumber) {
        // Extract numeric part from QUO-123456 format
        const match = validatedData.quotationNumber.match(/(\d+)$/);
        baseDocNumber = match ? match[1] : validatedData.quotationNumber.replace(/^QUO-/, '');
      }
      
      // Update inventory if items have inventoryItemId
      if (Array.isArray(validatedData.items)) {
        for (const item of validatedData.items) {
          if (item.inventoryItemId) {
            const inventoryItem = await storage.getInventoryItem(item.inventoryItemId);
            if (inventoryItem && inventoryItem.userId === userId) {
              // Quotations don't reduce inventory, only delivery challans and invoices do
            }
          }
        }
      }
      
      const quotation = await storage.createQuotation({
        ...validatedData,
        baseDocumentNumber: baseDocNumber,
      });
      res.json(quotation);
    } catch (error) {
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  app.put('/api/quotations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertQuotationSchema.partial().parse(req.body);
      const quotation = await storage.updateQuotation(req.params.id, validatedData);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      console.error("Error updating quotation:", error);
      res.status(500).json({ message: "Failed to update quotation" });
    }
  });

  app.delete('/api/quotations/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteQuotation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invoices = await storage.getInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let validatedData = insertInvoiceSchema.parse({
        ...req.body,
        userId,
      });
      
      // Handle price sync: if created from delivery challan, get prices from original quotation
      if (validatedData.sourceChallanId && (!validatedData.items || validatedData.items.some((item: any) => !item.unitPrice || item.unitPrice === 0))) {
        const sourceChallan = await storage.getDeliveryChallans(userId).then(challans => 
          challans.find(c => c.id === validatedData.sourceChallanId)
        );
        if (sourceChallan && sourceChallan.sourceQuotationId) {
          const sourceQuotation = await storage.getQuotation(sourceChallan.sourceQuotationId);
          if (sourceQuotation && sourceQuotation.userId === userId) {
            // Map items from challan to quotation items by name/quantity to get prices
            const quotationItems = Array.isArray(sourceQuotation.items) ? sourceQuotation.items : [];
            const challanItems = Array.isArray(sourceChallan.items) ? sourceChallan.items : [];
            
            const updatedItems = challanItems.map((challanItem: any) => {
              const matchingQuotationItem = quotationItems.find((qItem: any) => 
                qItem.name === challanItem.name && qItem.quantity === challanItem.quantity
              );
              if (matchingQuotationItem) {
                return {
                  ...challanItem,
                  unitPrice: matchingQuotationItem.unitPrice || 0,
                  total: (matchingQuotationItem.unitPrice || 0) * (challanItem.quantity || 0),
                };
              }
              return challanItem;
            });
            
            // Recalculate totals
            const subtotal = updatedItems.reduce((sum: number, item: any) => 
              sum + (parseFloat(item.total?.toString() || '0') || 0), 0
            );
            const taxRate = parseFloat(sourceQuotation.taxRate?.toString() || '20');
            const taxAmount = subtotal * (taxRate / 100);
            const total = subtotal + taxAmount;
            
            validatedData = {
              ...validatedData,
              items: updatedItems,
              subtotal: subtotal.toString(),
              taxRate: taxRate.toString(),
              taxAmount: taxAmount.toString(),
              total: total.toString(),
            };
          }
        }
      }
      
      // Generate base document number
      let baseDocNumber = validatedData.baseDocumentNumber;
      if (!baseDocNumber) {
        if (validatedData.sourceQuotationId) {
          const sourceQuotation = await storage.getQuotation(validatedData.sourceQuotationId);
          if (sourceQuotation && sourceQuotation.userId === userId) {
            baseDocNumber = sourceQuotation.baseDocumentNumber || 
              (sourceQuotation.quotationNumber.match(/(\d+)$/)?.[1] || sourceQuotation.quotationNumber.replace(/^QUO-/, ''));
          }
        } else if (validatedData.sourceChallanId) {
          const sourceChallan = await storage.getDeliveryChallans(userId).then(challans => 
            challans.find(c => c.id === validatedData.sourceChallanId)
          );
          if (sourceChallan) {
            baseDocNumber = sourceChallan.baseDocumentNumber || 
              (sourceChallan.challanNumber.match(/(\d+)$/)?.[1] || sourceChallan.challanNumber.replace(/^DC-/, ''));
          }
        }
      }
      if (!baseDocNumber && validatedData.invoiceNumber) {
        const match = validatedData.invoiceNumber.match(/(\d+)$/);
        baseDocNumber = match ? match[1] : validatedData.invoiceNumber.replace(/^INV-/, '');
      }
      
      // Update inventory - decrease stock when invoice is created (items sold)
      if (Array.isArray(validatedData.items)) {
        for (const item of validatedData.items) {
          if (item.inventoryItemId) {
            const inventoryItem = await storage.getInventoryItem(item.inventoryItemId);
            if (inventoryItem && inventoryItem.userId === userId) {
              const quantityToDeduct = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0;
              const newQuantity = Math.max(0, inventoryItem.quantity - quantityToDeduct);
              await storage.updateInventoryItem(item.inventoryItemId, { quantity: newQuantity });
            }
          }
        }
      }
      
      const invoice = await storage.createInvoice({
        ...validatedData,
        baseDocumentNumber: baseDocNumber,
      });
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Allow partial updates - bypass schema validation for simple updates
      const updateData: any = {};
      
      // Handle status update
      if (req.body.status !== undefined) {
        updateData.status = req.body.status;
      }
      
      // Handle paidAt timestamp - convert string to Date
      if (req.body.paidAt !== undefined) {
        updateData.paidAt = req.body.paidAt ? new Date(req.body.paidAt) : null;
      }
      
      // Handle other fields if present (for full updates)
      if (req.body.customerName !== undefined) updateData.customerName = req.body.customerName;
      if (req.body.customerEmail !== undefined) updateData.customerEmail = req.body.customerEmail;
      if (req.body.customerAddress !== undefined) updateData.customerAddress = req.body.customerAddress;
      if (req.body.invoiceNumber !== undefined) updateData.invoiceNumber = req.body.invoiceNumber;
      if (req.body.items !== undefined) updateData.items = req.body.items;
      if (req.body.subtotal !== undefined) {
        updateData.subtotal = typeof req.body.subtotal === 'number' 
          ? req.body.subtotal.toString() 
          : req.body.subtotal;
      }
      if (req.body.taxRate !== undefined) {
        updateData.taxRate = typeof req.body.taxRate === 'number' 
          ? req.body.taxRate.toString() 
          : req.body.taxRate;
      }
      if (req.body.taxAmount !== undefined) {
        updateData.taxAmount = typeof req.body.taxAmount === 'number' 
          ? req.body.taxAmount.toString() 
          : req.body.taxAmount;
      }
      if (req.body.total !== undefined) {
        updateData.total = typeof req.body.total === 'number' 
          ? req.body.total.toString() 
          : req.body.total;
      }
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      
      // Directly update without schema validation for partial updates
      const invoice = await storage.updateInvoice(req.params.id, updateData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      console.error("Error details:", error.message, error.stack);
      res.status(500).json({ message: "Failed to update invoice", error: error.message });
    }
  });

  app.delete('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  app.get('/api/delivery-challans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challans = await storage.getDeliveryChallans(userId);
      res.json(challans);
    } catch (error) {
      console.error("Error fetching delivery challans:", error);
      res.status(500).json({ message: "Failed to fetch delivery challans" });
    }
  });

  app.post('/api/delivery-challans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertDeliveryChallanSchema.parse({
        ...req.body,
        userId,
      });
      
      // Generate base document number from source quotation if available
      let baseDocNumber = validatedData.baseDocumentNumber;
      if (!baseDocNumber && validatedData.sourceQuotationId) {
        const sourceQuotation = await storage.getQuotation(validatedData.sourceQuotationId);
        if (sourceQuotation && sourceQuotation.userId === userId) {
          baseDocNumber = sourceQuotation.baseDocumentNumber || 
            (sourceQuotation.quotationNumber.match(/(\d+)$/)?.[1] || sourceQuotation.quotationNumber.replace(/^QUO-/, ''));
        }
      }
      if (!baseDocNumber && validatedData.challanNumber) {
        const match = validatedData.challanNumber.match(/(\d+)$/);
        baseDocNumber = match ? match[1] : validatedData.challanNumber.replace(/^DC-/, '');
      }
      
      // Update inventory - decrease stock when items are shipped
      if (Array.isArray(validatedData.items)) {
        for (const item of validatedData.items) {
          if (item.inventoryItemId) {
            const inventoryItem = await storage.getInventoryItem(item.inventoryItemId);
            if (inventoryItem && inventoryItem.userId === userId) {
              const quantityToDeduct = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0;
              const newQuantity = Math.max(0, inventoryItem.quantity - quantityToDeduct);
              await storage.updateInventoryItem(item.inventoryItemId, { quantity: newQuantity });
            }
          }
        }
      }
      
      const challan = await storage.createDeliveryChallan({
        ...validatedData,
        baseDocumentNumber: baseDocNumber,
      });
      res.json(challan);
    } catch (error) {
      console.error("Error creating delivery challan:", error);
      res.status(500).json({ message: "Failed to create delivery challan" });
    }
  });

  app.put('/api/delivery-challans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertDeliveryChallanSchema.partial().parse(req.body);
      const challan = await storage.updateDeliveryChallan(req.params.id, validatedData);
      if (!challan) {
        return res.status(404).json({ message: "Delivery challan not found" });
      }
      res.json(challan);
    } catch (error) {
      console.error("Error updating delivery challan:", error);
      res.status(500).json({ message: "Failed to update delivery challan" });
    }
  });

  app.delete('/api/delivery-challans/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteDeliveryChallan(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting delivery challan:", error);
      res.status(500).json({ message: "Failed to delete delivery challan" });
    }
  });

  // Download endpoints
  app.get('/api/quotations/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const quotations = await storage.getQuotations(userId);
      const quotation = quotations.find(q => q.id === req.params.id);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      const format = req.query.format || 'pdf';
      const includeHeader = req.query.includeHeader !== 'false';
      const includeFooter = req.query.includeFooter !== 'false';
      const includePayment = req.query.includePayment === 'true';
      const includeSignature = req.query.includeSignature === 'true';

      const business = await storage.getBusiness(userId);
      const businessAddress = business ? [
        business.address,
        business.city,
        business.postcode
      ].filter(Boolean).join(', ') : undefined;
      const options = {
        includeHeader,
        includeFooter,
        businessName: business?.businessName,
        businessAddress,
        businessEmail: business?.email,
        businessPhone: business?.phone,
        footerText: business?.footerText,
        primaryColor: business?.primaryColor,
        paymentLink: business?.paymentLink,
        qrCodeUrl: business?.qrCodeUrl,
        signatureUrl: business?.signatureUrl,
        includePayment,
        includeSignature,
      };

      if (format === 'pdf') {
        const pdfBuffer = await generatePDF(quotation, 'quotation', options);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'word') {
        const wordBuffer = await generateWord(quotation, 'quotation', options);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.quotationNumber}.docx"`);
        res.send(wordBuffer);
      } else {
        res.status(400).json({ message: "Invalid format. Use 'pdf' or 'word'" });
      }
    } catch (error) {
      console.error("Error generating quotation document:", error);
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  app.get('/api/invoices/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invoices = await storage.getInvoices(userId);
      const invoice = invoices.find(i => i.id === req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const format = req.query.format || 'pdf';
      const includeHeader = req.query.includeHeader !== 'false';
      const includeFooter = req.query.includeFooter !== 'false';
      const includePayment = req.query.includePayment === 'true';
      const includeSignature = req.query.includeSignature === 'true';

      const business = await storage.getBusiness(userId);
      const businessAddress = business ? [
        business.address,
        business.city,
        business.postcode
      ].filter(Boolean).join(', ') : undefined;
      const options = {
        includeHeader,
        includeFooter,
        businessName: business?.businessName,
        businessAddress,
        businessEmail: business?.email,
        businessPhone: business?.phone,
        footerText: business?.footerText,
        primaryColor: business?.primaryColor,
        paymentLink: business?.paymentLink,
        qrCodeUrl: business?.qrCodeUrl,
        signatureUrl: business?.signatureUrl,
        includePayment,
        includeSignature,
      };

      if (format === 'pdf') {
        const pdfBuffer = await generatePDF(invoice, 'invoice', options);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'word') {
        const wordBuffer = await generateWord(invoice, 'invoice', options);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.docx"`);
        res.send(wordBuffer);
      } else {
        res.status(400).json({ message: "Invalid format. Use 'pdf' or 'word'" });
      }
    } catch (error) {
      console.error("Error generating invoice document:", error);
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  app.get('/api/delivery-challans/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const challans = await storage.getDeliveryChallans(userId);
      const challan = challans.find(c => c.id === req.params.id);
      
      if (!challan) {
        return res.status(404).json({ message: "Delivery challan not found" });
      }

      const format = req.query.format || 'pdf';
      const includeHeader = req.query.includeHeader !== 'false';
      const includeFooter = req.query.includeFooter !== 'false';
      const includePayment = req.query.includePayment === 'true';
      const includeSignature = req.query.includeSignature === 'true';

      const business = await storage.getBusiness(userId);
      const businessAddress = business ? [
        business.address,
        business.city,
        business.postcode
      ].filter(Boolean).join(', ') : undefined;
      const options = {
        includeHeader,
        includeFooter,
        businessName: business?.businessName,
        businessAddress,
        businessEmail: business?.email,
        businessPhone: business?.phone,
        footerText: business?.footerText,
        primaryColor: business?.primaryColor,
        paymentLink: business?.paymentLink,
        qrCodeUrl: business?.qrCodeUrl,
        signatureUrl: business?.signatureUrl,
        includePayment,
        includeSignature,
      };

      if (format === 'pdf') {
        const pdfBuffer = await generatePDF(challan, 'challan', options);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="challan-${challan.challanNumber}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'word') {
        const wordBuffer = await generateWord(challan, 'challan', options);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="challan-${challan.challanNumber}.docx"`);
        res.send(wordBuffer);
      } else {
        res.status(400).json({ message: "Invalid format. Use 'pdf' or 'word'" });
      }
    } catch (error) {
      console.error("Error generating delivery challan document:", error);
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  app.get('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const items = await storage.getInventoryItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertInventoryItemSchema.parse({
        ...req.body,
        userId,
      });
      const item = await storage.createInventoryItem(validatedData);
      res.json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const item = await storage.getInventoryItem(req.params.id);
      if (!item || item.userId !== userId) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateInventoryItem(req.params.id, validatedData);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteInventoryItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  app.get('/api/employees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employees = await storage.getEmployees(userId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/employees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        userId,
      });
      const employee = await storage.createEmployee(validatedData);
      res.json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.delete('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  app.get('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const customers = await storage.getCustomers(userId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertCustomerSchema.parse({
        ...req.body,
        userId,
      });
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
