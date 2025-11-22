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

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

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
      const quotation = await storage.createQuotation(validatedData);
      res.json(quotation);
    } catch (error) {
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
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
      const validatedData = insertInvoiceSchema.parse({
        ...req.body,
        userId,
      });
      const invoice = await storage.createInvoice(validatedData);
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
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
      const challan = await storage.createDeliveryChallan(validatedData);
      res.json(challan);
    } catch (error) {
      console.error("Error creating delivery challan:", error);
      res.status(500).json({ message: "Failed to create delivery challan" });
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
