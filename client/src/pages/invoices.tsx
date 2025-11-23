import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Eye, Download, Edit, Trash2, X, FileCheck, FileText, TruckIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getAPIBaseURL } from "@/lib/api";
import type { Invoice, Quotation, DeliveryChallan } from "@shared/schema";
import { format } from "date-fns";

const invoiceSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerAddress: z.string().optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unitPrice: z.number().min(0, "Unit price must be 0 or greater"),
    total: z.number(),
  })).min(1, "At least one item is required"),
  subtotal: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function Invoices() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sourceQuotation, setSourceQuotation] = useState<Quotation | null>(null);
  const [sourceChallan, setSourceChallan] = useState<DeliveryChallan | null>(null);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: challans = [] } = useQuery<DeliveryChallan[]>({
    queryKey: ["/api/delivery-challans"],
  });

  // Check for quotation or challan data from localStorage
  useEffect(() => {
    const quotationData = localStorage.getItem('createInvoiceFromQuotation');
    const challanData = localStorage.getItem('createInvoiceFromChallan');
    
    if (quotationData) {
      try {
        const quotation = JSON.parse(quotationData);
        setSourceQuotation(quotation);
        localStorage.removeItem('createInvoiceFromQuotation');
      } catch (error) {
        console.error("Failed to parse quotation data:", error);
      }
    }
    
    if (challanData) {
      try {
        const challan = JSON.parse(challanData);
        setSourceChallan(challan);
        localStorage.removeItem('createInvoiceFromChallan');
      } catch (error) {
        console.error("Failed to parse challan data:", error);
      }
    }
  }, []);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerAddress: "",
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      items: [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: 0,
      taxRate: 20,
      taxAmount: 0,
      total: 0,
      notes: "",
    },
  });

  // Watch items and taxRate to auto-calculate totals
  const items = form.watch("items");
  const taxRate = form.watch("taxRate");

  useEffect(() => {
    // Calculate item totals
    const updatedItems = items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    
    // Update form with calculated totals
    updatedItems.forEach((item, index) => {
      form.setValue(`items.${index}.total`, item.total);
    });

    // Calculate subtotal
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    form.setValue("subtotal", subtotal);

    // Calculate tax and total
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    form.setValue("taxAmount", taxAmount);
    form.setValue("total", total);
  }, [items, taxRate, form]);

  // Load from quotation or challan if provided
  useEffect(() => {
    if (sourceQuotation) {
      form.reset({
        customerName: sourceQuotation.customerName,
        customerEmail: sourceQuotation.customerEmail || "",
        customerAddress: sourceQuotation.customerAddress || "",
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        items: Array.isArray(sourceQuotation.items) ? sourceQuotation.items.map((item: any) => ({
          name: item.name || "",
          quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
          unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0,
          total: typeof item.total === 'number' ? item.total : parseFloat(item.total) || 0,
        })) : [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
        subtotal: typeof sourceQuotation.subtotal === 'string' ? parseFloat(sourceQuotation.subtotal) : sourceQuotation.subtotal || 0,
        taxRate: typeof sourceQuotation.taxRate === 'string' ? parseFloat(sourceQuotation.taxRate) : sourceQuotation.taxRate || 20,
        taxAmount: typeof sourceQuotation.taxAmount === 'string' ? parseFloat(sourceQuotation.taxAmount) : sourceQuotation.taxAmount || 0,
        total: typeof sourceQuotation.total === 'string' ? parseFloat(sourceQuotation.total) : sourceQuotation.total || 0,
        notes: sourceQuotation.notes || "",
      });
      setDialogOpen(true);
    }
  }, [sourceQuotation, form]);

  useEffect(() => {
    if (sourceChallan) {
      form.reset({
        customerName: sourceChallan.customerName,
        customerEmail: "",
        customerAddress: sourceChallan.customerAddress || "",
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        items: Array.isArray(sourceChallan.items) ? sourceChallan.items.map((item: any) => ({
          name: item.name || "",
          quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
          unitPrice: 0, // Challans don't have prices
          total: 0,
        })) : [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
        subtotal: 0,
        taxRate: 20,
        taxAmount: 0,
        total: 0,
        notes: sourceChallan.notes || "",
      });
      setDialogOpen(true);
    }
  }, [sourceChallan, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return await response.json();
    },
    onSuccess: async (invoice) => {
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      
      // Update source quotation status if created from quotation
      if (sourceQuotation) {
        try {
          await apiRequest("PUT", `/api/quotations/${sourceQuotation.id}`, {
            status: "accepted"
          });
          queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
        } catch (error) {
          console.error("Failed to update quotation status:", error);
        }
      }

      // Update source challan status if created from challan
      if (sourceChallan) {
        try {
          await apiRequest("PUT", `/api/delivery-challans/${sourceChallan.id}`, {
            status: "delivered"
          });
          queryClient.invalidateQueries({ queryKey: ["/api/delivery-challans"] });
        } catch (error) {
          console.error("Failed to update challan status:", error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setDialogOpen(false);
      setSourceQuotation(null);
      setSourceChallan(null);
      form.reset({
        customerName: "",
        customerEmail: "",
        customerAddress: "",
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        items: [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
        subtotal: 0,
        taxRate: 20,
        taxAmount: 0,
        total: 0,
        notes: "",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InvoiceFormData }) => {
      const response = await apiRequest("PUT", `/api/invoices/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsEditMode(false);
      setViewDialogOpen(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/invoices/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices.filter((inv) =>
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "sent": return "default";
      case "overdue": return "destructive";
      default: return "secondary";
    }
  };

  const onSubmit = (data: InvoiceFormData) => {
    createMutation.mutate(data);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
    setIsEditMode(false);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
    setIsEditMode(true);
    form.reset({
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail || "",
      customerAddress: invoice.customerAddress || "",
      invoiceNumber: invoice.invoiceNumber,
      items: Array.isArray(invoice.items) ? invoice.items.map((item: any) => ({
        name: item.name || "",
        quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0,
        total: typeof item.total === 'number' ? item.total : parseFloat(item.total) || 0,
      })) : [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : invoice.subtotal || 0,
      taxRate: typeof invoice.taxRate === 'string' ? parseFloat(invoice.taxRate) : invoice.taxRate || 20,
      taxAmount: typeof invoice.taxAmount === 'string' ? parseFloat(invoice.taxAmount) : invoice.taxAmount || 0,
      total: typeof invoice.total === 'string' ? parseFloat(invoice.total) : invoice.total || 0,
      notes: invoice.notes || "",
    });
  };

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [...currentItems, { name: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  const handleCreateFromQuotation = (quotation: Quotation) => {
    setSourceQuotation(quotation);
  };

  const handleCreateFromChallan = (challan: DeliveryChallan) => {
    setSourceChallan(challan);
  };

  const handleDownload = async (invoice: Invoice, format: 'pdf' | 'word' = 'pdf') => {
    try {
      const url = new URL(`/api/invoices/${invoice.id}/download`, getAPIBaseURL());
      url.searchParams.set('format', format);
      url.searchParams.set('includeHeader', includeHeader.toString());
      url.searchParams.set('includeFooter', includeFooter.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice-${invoice.invoiceNumber}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadDialogOpen(false);

      toast({
        title: "Success",
        description: `Invoice downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PUT", `/api/invoices/${id}`, {
        status: "paid",
        paidAt: new Date().toISOString(),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice marked as paid",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      if (selectedInvoice) {
        setSelectedInvoice({ ...selectedInvoice, status: "paid" as any });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to mark invoice as paid",
        variant: "destructive",
      });
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invoices</h1>
          <p className="text-muted-foreground">Create and manage your business invoices</p>
        </div>
        <div className="flex gap-2">
          {quotations.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-create-from-quotation">
                  <FileText className="h-4 w-4 mr-2" />
                  From Quotation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Quotation</DialogTitle>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                  {quotations.filter(q => q.status === 'accepted' || q.status === 'draft').map((quotation) => (
                    <Button
                      key={quotation.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleCreateFromQuotation(quotation)}
                    >
                      {quotation.quotationNumber} - {quotation.customerName}
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          {challans.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-create-from-challan">
                  <TruckIcon className="h-4 w-4 mr-2" />
                  From Challan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Delivery Challan</DialogTitle>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                  {challans.filter(c => c.status === 'delivered' || c.status === 'dispatched').map((challan) => (
                    <Button
                      key={challan.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleCreateFromChallan(challan)}
                    >
                      {challan.challanNumber} - {challan.customerName}
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-invoice">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {sourceQuotation ? "Create Invoice from Quotation" : sourceChallan ? "Create Invoice from Challan" : "Create New Invoice"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-invoice-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter customer name" {...field} data-testid="input-customer-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} data-testid="input-customer-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Address" {...field} data-testid="input-customer-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Items Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>Items *</FormLabel>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    {form.watch("items").map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                        <FormField
                          control={form.control}
                          name={`items.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="col-span-4">
                              <FormLabel className="text-xs">Item Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Item name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-xs">Qty</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    field.onChange(val);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-xs">Unit Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    field.onChange(val);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormItem className="col-span-2">
                          <FormLabel className="text-xs">Total</FormLabel>
                          <Input
                            value={item.total.toFixed(2)}
                            disabled
                            className="bg-muted"
                          />
                        </FormItem>
                        <div className="col-span-2 flex justify-end">
                          {form.watch("items").length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <FormLabel>Subtotal</FormLabel>
                      <Input
                        value={`£${form.watch("subtotal").toFixed(2)}`}
                        disabled
                        className="bg-muted font-semibold"
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>Tax Amount</FormLabel>
                      <Input
                        value={`£${form.watch("taxAmount").toFixed(2)}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <FormLabel>Total</FormLabel>
                    <Input
                      value={`£${form.watch("total").toFixed(2)}`}
                      disabled
                      className="bg-muted font-bold text-lg"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Payment terms, additional notes..." {...field} data-testid="input-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                      setDialogOpen(false);
                      setSourceQuotation(null);
                      setSourceChallan(null);
                    }} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                      {createMutation.isPending ? "Creating..." : "Create Invoice"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View/Edit Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Invoice" : "View Invoice"}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && !isEditMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                  <p className="text-lg font-semibold">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedInvoice.status!)} className="capitalize">
                    {selectedInvoice.status}
                  </Badge>
                  {selectedInvoice.status === 'paid' && (
                    <div className="mt-2 relative">
                      <div className="absolute -rotate-12 bg-green-500 text-white px-4 py-2 rounded font-bold text-lg shadow-lg">
                        PAID
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                  <p>{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Email</p>
                  <p>{selectedInvoice.customerEmail || "N/A"}</p>
                </div>
              </div>
              {selectedInvoice.customerAddress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Address</p>
                  <p>{selectedInvoice.customerAddress}</p>
                </div>
              )}
              {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.name || "N/A"}</TableCell>
                          <TableCell>{item.quantity || 0}</TableCell>
                          <TableCell>£{typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : parseFloat(item.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">£{typeof item.total === 'number' ? item.total.toFixed(2) : parseFloat(item.total || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subtotal</p>
                  <p className="text-lg font-semibold">£{typeof selectedInvoice.subtotal === 'string' ? parseFloat(selectedInvoice.subtotal).toFixed(2) : selectedInvoice.subtotal?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax Rate</p>
                  <p>{typeof selectedInvoice.taxRate === 'string' ? parseFloat(selectedInvoice.taxRate) : selectedInvoice.taxRate || 0}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax Amount</p>
                  <p className="text-lg font-semibold">£{typeof selectedInvoice.taxAmount === 'string' ? parseFloat(selectedInvoice.taxAmount).toFixed(2) : selectedInvoice.taxAmount?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">£{typeof selectedInvoice.total === 'string' ? parseFloat(selectedInvoice.total).toFixed(2) : selectedInvoice.total?.toFixed(2) || "0.00"}</p>
              </div>
              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{selectedInvoice.notes}</p>
                </div>
              )}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="invIncludeHeader" 
                      checked={includeHeader}
                      onChange={(e) => setIncludeHeader(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="invIncludeHeader" className="text-sm">Include Header</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="invIncludeFooter" 
                      checked={includeFooter}
                      onChange={(e) => setIncludeFooter(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="invIncludeFooter" className="text-sm">Include Footer</label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                    Close
                  </Button>
                  {selectedInvoice.status !== 'paid' && (
                    <Button 
                      variant="default"
                      onClick={() => markAsPaidMutation.mutate(selectedInvoice.id)}
                      disabled={markAsPaidMutation.isPending}
                    >
                      {markAsPaidMutation.isPending ? "Marking..." : "Mark as Paid"}
                    </Button>
                  )}
                  <Button onClick={() => handleEdit(selectedInvoice)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Download Format</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleDownload(selectedInvoice, 'pdf')}
                          >
                            Download PDF
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleDownload(selectedInvoice, 'word')}
                          >
                            Download Word
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          )}
          {selectedInvoice && isEditMode && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => {
                if (selectedInvoice) {
                  updateMutation.mutate({ id: selectedInvoice.id, data });
                }
              })} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Items *</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  {form.watch("items").map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                      <FormField
                        control={form.control}
                        name={`items.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="col-span-4">
                            <FormLabel className="text-xs">Item Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-xs">Qty</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  field.onChange(val);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-xs">Unit Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  field.onChange(val);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">Total</FormLabel>
                        <Input
                          value={item.total.toFixed(2)}
                          disabled
                          className="bg-muted"
                        />
                      </FormItem>
                      <div className="col-span-2 flex justify-end">
                        {form.watch("items").length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <FormLabel>Subtotal</FormLabel>
                    <Input
                      value={`£${form.watch("subtotal").toFixed(2)}`}
                      disabled
                      className="bg-muted font-semibold"
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              field.onChange(val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Tax Amount</FormLabel>
                    <Input
                      value={`£${form.watch("taxAmount").toFixed(2)}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <FormLabel>Total</FormLabel>
                  <Input
                    value={`£${form.watch("total").toFixed(2)}`}
                    disabled
                    className="bg-muted font-bold text-lg"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditMode(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Updating..." : "Update Invoice"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </div>

        {filteredInvoices.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>£{parseFloat(invoice.total.toString()).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status!)} className="capitalize">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(invoice.createdAt!), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(invoice)}
                          data-testid={`button-view-${invoice.id}`}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setDownloadDialogOpen(true);
                          }}
                          data-testid={`button-download-${invoice.id}`}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(invoice)}
                          data-testid={`button-edit-${invoice.id}`}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(invoice.id)}
                          data-testid={`button-delete-${invoice.id}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first invoice to start billing customers
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
