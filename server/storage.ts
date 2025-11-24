import {
  users,
  businesses,
  subscriptions,
  customers,
  inventoryItems,
  quotations,
  invoices,
  deliveryChallans,
  employees,
  type User,
  type UpsertUser,
  type Business,
  type InsertBusiness,
  type Subscription,
  type InsertSubscription,
  type Customer,
  type InsertCustomer,
  type InventoryItem,
  type InsertInventoryItem,
  type Quotation,
  type InsertQuotation,
  type Invoice,
  type InsertInvoice,
  type DeliveryChallan,
  type InsertDeliveryChallan,
  type Employee,
  type InsertEmployee,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUsersByEmail(email: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  
  getBusiness(userId: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(userId: string, business: Partial<InsertBusiness>): Promise<Business | undefined>;
  
  getSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: string, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  getCustomers(userId: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  getInventoryItems(userId: string): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<void>;
  
  getQuotations(userId: string): Promise<Quotation[]>;
  getQuotation(id: string): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: string, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: string): Promise<void>;
  
  getInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<void>;
  
  getDeliveryChallans(userId: string): Promise<DeliveryChallan[]>;
  createDeliveryChallan(challan: InsertDeliveryChallan): Promise<DeliveryChallan>;
  updateDeliveryChallan(id: string, challan: Partial<InsertDeliveryChallan>): Promise<DeliveryChallan | undefined>;
  deleteDeliveryChallan(id: string): Promise<void>;
  
  getEmployees(userId: string): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsersByEmail(email: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.email, email));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));
    return user;
  }

  async getBusiness(userId: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.userId, userId));
    return business;
  }

  async createBusiness(businessData: InsertBusiness): Promise<Business> {
    const [business] = await db
      .insert(businesses)
      .values(businessData)
      .returning();
    return business;
  }

  async updateBusiness(userId: string, businessData: Partial<InsertBusiness>): Promise<Business | undefined> {
    const [business] = await db
      .update(businesses)
      .set({ ...businessData, updatedAt: new Date() })
      .where(eq(businesses.userId, userId))
      .returning();
    return business;
  }

  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  async updateSubscription(userId: string, subscriptionData: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...subscriptionData, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return subscription;
  }

  async getCustomers(userId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.userId, userId)).orderBy(desc(customers.createdAt));
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(customerData)
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getInventoryItems(userId: string): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)).orderBy(desc(inventoryItems.createdAt));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item;
  }

  async createInventoryItem(itemData: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db
      .insert(inventoryItems)
      .values(itemData)
      .returning();
    return item;
  }

  async updateInventoryItem(id: string, itemData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db
      .update(inventoryItems)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return item;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }

  async getQuotations(userId: string): Promise<Quotation[]> {
    return await db.select().from(quotations).where(eq(quotations.userId, userId)).orderBy(desc(quotations.createdAt));
  }

  async getQuotation(id: string): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    return quotation;
  }

  async createQuotation(quotationData: InsertQuotation): Promise<Quotation> {
    const [quotation] = await db
      .insert(quotations)
      .values(quotationData)
      .returning();
    return quotation;
  }

  async updateQuotation(id: string, quotationData: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    const [quotation] = await db
      .update(quotations)
      .set({
        ...quotationData,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, id))
      .returning();
    return quotation;
  }

  async deleteQuotation(id: string): Promise<void> {
    await db.delete(quotations).where(eq(quotations.id, id));
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    return invoice;
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({
        ...invoiceData,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getDeliveryChallans(userId: string): Promise<DeliveryChallan[]> {
    return await db.select().from(deliveryChallans).where(eq(deliveryChallans.userId, userId)).orderBy(desc(deliveryChallans.createdAt));
  }

  async createDeliveryChallan(challanData: InsertDeliveryChallan): Promise<DeliveryChallan> {
    const [challan] = await db
      .insert(deliveryChallans)
      .values(challanData)
      .returning();
    return challan;
  }

  async updateDeliveryChallan(id: string, challanData: Partial<InsertDeliveryChallan>): Promise<DeliveryChallan | undefined> {
    const [challan] = await db
      .update(deliveryChallans)
      .set({
        ...challanData,
        updatedAt: new Date(),
      })
      .where(eq(deliveryChallans.id, id))
      .returning();
    return challan;
  }

  async deleteDeliveryChallan(id: string): Promise<void> {
    await db.delete(deliveryChallans).where(eq(deliveryChallans.id, id));
  }

  async getEmployees(userId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.userId, userId)).orderBy(desc(employees.createdAt));
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(employeeData)
      .returning();
    return employee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }
}

export const storage = new DatabaseStorage();
