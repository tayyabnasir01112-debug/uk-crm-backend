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
import { Plus, Search, Eye, Download, Edit, Trash2, X, FileCheck, TruckIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getAPIBaseURL } from "@/lib/api";
import type { Quotation, InventoryItem } from "@shared/schema";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { InventorySelector } from "@/components/inventory-selector";

const quotationSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerAddress: z.string().optional(),
  quotationNumber: z.string().min(1, "Quotation number is required"),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be 0 or greater"),
    total: z.number(),
    inventoryItemId: z.string().optional(),
  })).min(1, "At least one item is required"),
  subtotal: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  notes: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

export default function Quotations() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [includePayment, setIncludePayment] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);
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

  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const getInitialFormValues = (): QuotationFormData => ({
    customerName: "",
    customerEmail: "",
    customerAddress: "",
    quotationNumber: `QUO-${Date.now().toString().slice(-6)}`,
    items: [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    taxRate: 20,
    taxAmount: 0,
    total: 0,
    notes: "",
  });

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: getInitialFormValues(),
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

  const createMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const response = await apiRequest("POST", "/api/quotations", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setDialogOpen(false);
      form.reset(getInitialFormValues());
      setIsEditMode(false);
      setEditingQuotationId(null);
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
        description: error.message || "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  const updateQuotationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: QuotationFormData }) => {
      const response = await apiRequest("PUT", `/api/quotations/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setDialogOpen(false);
      setIsEditMode(false);
      setEditingQuotationId(null);
      form.reset(getInitialFormValues());
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
        description: error.message || "Failed to update quotation",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/quotations/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
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
        description: "Failed to delete quotation",
        variant: "destructive",
      });
    },
  });

  const filteredQuotations = quotations.filter((q) =>
    q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "sent": return "default";
      case "accepted": return "default";
      case "declined": return "destructive";
      default: return "secondary";
    }
  };

  const onSubmit = (data: QuotationFormData) => {
    // Note: Quotations don't reduce stock, so no validation needed here
    // Stock validation happens when creating delivery challans or invoices
    if (isEditMode && editingQuotationId) {
      updateQuotationMutation.mutate({ id: editingQuotationId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewDialogOpen(true);
    setIsEditMode(false);
  };

  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewDialogOpen(false);
    setIsEditMode(true);
    setEditingQuotationId(quotation.id!);
    setDialogOpen(true);
    form.reset({
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail || "",
      customerAddress: quotation.customerAddress || "",
      quotationNumber: quotation.quotationNumber,
      items: Array.isArray(quotation.items) ? quotation.items.map((item: any) => ({
        name: item.name || "",
        quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0,
        total: typeof item.total === 'number' ? item.total : parseFloat(item.total) || 0,
      })) : [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: typeof quotation.subtotal === 'string' ? parseFloat(quotation.subtotal) : quotation.subtotal || 0,
      taxRate: typeof quotation.taxRate === 'string' ? parseFloat(quotation.taxRate) : quotation.taxRate || 20,
      taxAmount: typeof quotation.taxAmount === 'string' ? parseFloat(quotation.taxAmount) : quotation.taxAmount || 0,
      total: typeof quotation.total === 'string' ? parseFloat(quotation.total) : quotation.total || 0,
      notes: quotation.notes || "",
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

  const handleDownload = async (quotation: Quotation, format: 'pdf' | 'word' = 'pdf') => {
    try {
      const url = new URL(`/api/quotations/${quotation.id}/download`, getAPIBaseURL());
      url.searchParams.set('format', format);
      url.searchParams.set('includeHeader', includeHeader.toString());
      url.searchParams.set('includeFooter', includeFooter.toString());
      url.searchParams.set('includePayment', includePayment.toString());
      url.searchParams.set('includeSignature', includeSignature.toString());

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
      link.download = `quotation-${quotation.quotationNumber}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadDialogOpen(false);

      toast({
        title: "Success",
        description: `Quotation downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download quotation",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quotations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quotations</h1>
          <p className="text-muted-foreground">Create and manage your business quotations</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setIsEditMode(false);
              setEditingQuotationId(null);
              form.reset(getInitialFormValues());
            }
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="button-create-quotation">
              <Plus className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Quotation" : "Create New Quotation"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quotationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Number</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-quotation-number" />
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
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Add selected inventory items
                          const selectedItems = inventoryItems.filter(item => item.quantity > 0);
                          if (selectedItems.length > 0) {
                            const currentItems = form.getValues("items");
                            const newItems = selectedItems.map(item => ({
                              name: item.name,
                              quantity: 1,
                              unitPrice: parseFloat(item.unitPrice.toString()),
                              total: parseFloat(item.unitPrice.toString()),
                              inventoryItemId: item.id,
                            }));
                            form.setValue("items", [...currentItems, ...newItems]);
                          } else {
                            toast({
                              title: "No inventory items",
                              description: "Please add items to inventory first",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add from Inventory
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
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
                              <div className="flex gap-1">
                                <Input placeholder="Item name" {...field} className="flex-1" />
                                {inventoryItems.length > 0 && (
                                  <InventorySelector
                                    inventoryItems={inventoryItems}
                                    onSelect={(selectedItem) => {
                                      field.onChange(selectedItem.name);
                                      form.setValue(`items.${index}.unitPrice`, parseFloat(selectedItem.unitPrice.toString()));
                                      form.setValue(`items.${index}.quantity`, 1);
                                      form.setValue(`items.${index}.inventoryItemId`, selectedItem.id);
                                    }}
                                    className="w-auto"
                                  />
                                )}
                              </div>
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
                                step="1"
                                min="1"
                                {...field}
                                value={field.value || 1}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  field.onChange(Math.max(1, val));
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
                        <Textarea placeholder="Additional notes..." {...field} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isEditMode ? updateQuotationMutation.isPending : createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {isEditMode
                      ? updateQuotationMutation.isPending
                        ? "Saving..."
                        : "Save Changes"
                      : createMutation.isPending
                        ? "Creating..."
                        : "Create Quotation"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View/Edit Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Quotation" : "View Quotation"}</DialogTitle>
          </DialogHeader>
          {selectedQuotation && !isEditMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quotation Number</p>
                  <p className="text-lg font-semibold">{selectedQuotation.quotationNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedQuotation.status!)} className="capitalize">
                    {selectedQuotation.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                  <p>{selectedQuotation.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Email</p>
                  <p>{selectedQuotation.customerEmail || "N/A"}</p>
                </div>
              </div>
              {selectedQuotation.customerAddress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Address</p>
                  <p>{selectedQuotation.customerAddress}</p>
                </div>
              )}
              {Array.isArray(selectedQuotation.items) && selectedQuotation.items.length > 0 && (
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
                      {selectedQuotation.items.map((item: any, index: number) => {
                        // Calculate item total if missing or 0
                        const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity || 0);
                        const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0);
                        let itemTotal = typeof item.total === 'number' ? item.total : parseFloat(item.total || 0);
                        if (itemTotal === 0 && unitPrice > 0 && quantity > 0) {
                          itemTotal = unitPrice * quantity;
                        }
                        return (
                          <TableRow key={index}>
                            <TableCell>{item.name || "N/A"}</TableCell>
                            <TableCell>{quantity}</TableCell>
                            <TableCell>£{unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">£{itemTotal.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subtotal</p>
                  <p className="text-lg font-semibold">
                    {(() => {
                      // Recalculate subtotal from items
                      let calculatedSubtotal = 0;
                      if (Array.isArray(selectedQuotation.items)) {
                        selectedQuotation.items.forEach((item: any) => {
                          const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity || 0);
                          const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0);
                          let itemTotal = typeof item.total === 'number' ? item.total : parseFloat(item.total || 0);
                          if (itemTotal === 0 && unitPrice > 0 && quantity > 0) {
                            itemTotal = unitPrice * quantity;
                          }
                          calculatedSubtotal += itemTotal;
                        });
                      }
                      const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (typeof selectedQuotation.subtotal === 'string' ? parseFloat(selectedQuotation.subtotal) : selectedQuotation.subtotal || 0);
                      return `£${subtotal.toFixed(2)}`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax Rate</p>
                  <p>{typeof selectedQuotation.taxRate === 'string' ? parseFloat(selectedQuotation.taxRate) : selectedQuotation.taxRate || 0}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax Amount</p>
                  <p className="text-lg font-semibold">
                    {(() => {
                      // Recalculate tax amount
                      let calculatedSubtotal = 0;
                      if (Array.isArray(selectedQuotation.items)) {
                        selectedQuotation.items.forEach((item: any) => {
                          const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity || 0);
                          const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0);
                          let itemTotal = typeof item.total === 'number' ? item.total : parseFloat(item.total || 0);
                          if (itemTotal === 0 && unitPrice > 0 && quantity > 0) {
                            itemTotal = unitPrice * quantity;
                          }
                          calculatedSubtotal += itemTotal;
                        });
                      }
                      const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (typeof selectedQuotation.subtotal === 'string' ? parseFloat(selectedQuotation.subtotal) : selectedQuotation.subtotal || 0);
                      const taxRate = typeof selectedQuotation.taxRate === 'string' ? parseFloat(selectedQuotation.taxRate) : selectedQuotation.taxRate || 20;
                      const taxAmount = subtotal * (taxRate / 100);
                      return `£${taxAmount.toFixed(2)}`;
                    })()}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    // Recalculate total from items
                    let calculatedSubtotal = 0;
                    if (Array.isArray(selectedQuotation.items)) {
                      selectedQuotation.items.forEach((item: any) => {
                        const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity || 0);
                        const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0);
                        let itemTotal = typeof item.total === 'number' ? item.total : parseFloat(item.total || 0);
                        if (itemTotal === 0 && unitPrice > 0 && quantity > 0) {
                          itemTotal = unitPrice * quantity;
                        }
                        calculatedSubtotal += itemTotal;
                      });
                    }
                    const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (typeof selectedQuotation.subtotal === 'string' ? parseFloat(selectedQuotation.subtotal) : selectedQuotation.subtotal || 0);
                    const taxRate = typeof selectedQuotation.taxRate === 'string' ? parseFloat(selectedQuotation.taxRate) : selectedQuotation.taxRate || 20;
                    const taxAmount = subtotal * (taxRate / 100);
                    const total = subtotal + taxAmount;
                    return `£${total.toFixed(2)}`;
                  })()}
                </p>
              </div>
              {selectedQuotation.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{selectedQuotation.notes}</p>
                </div>
              )}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="quoIncludeHeader" 
                      checked={includeHeader}
                      onChange={(e) => setIncludeHeader(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="quoIncludeHeader" className="text-sm">Include Header</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="quoIncludeFooter" 
                      checked={includeFooter}
                      onChange={(e) => setIncludeFooter(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="quoIncludeFooter" className="text-sm">Include Footer</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="quoIncludePayment" 
                      checked={includePayment}
                      onChange={(e) => setIncludePayment(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="quoIncludePayment" className="text-sm">Include Payment Section</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="quoIncludeSignature" 
                      checked={includeSignature}
                      onChange={(e) => setIncludeSignature(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="quoIncludeSignature" className="text-sm">Include Signature</label>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Navigate to invoices page with quotation data
                        localStorage.setItem('createInvoiceFromQuotation', JSON.stringify(selectedQuotation));
                        setViewDialogOpen(false);
                        setLocation('/invoices');
                      }}
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Navigate to delivery challans page with quotation data
                        localStorage.setItem('createChallanFromQuotation', JSON.stringify(selectedQuotation));
                        setViewDialogOpen(false);
                        setLocation('/delivery-challans');
                      }}
                    >
                      <TruckIcon className="h-4 w-4 mr-2" />
                      Create Delivery Challan
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                      Close
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
                              onClick={() => handleDownload(selectedQuotation, 'pdf')}
                            >
                              Download PDF
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleDownload(selectedQuotation, 'word')}
                            >
                              Download Word
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={() => handleEdit(selectedQuotation)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </div>

        {filteredQuotations.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id} data-testid={`row-quotation-${quotation.id}`}>
                    <TableCell className="font-medium">{quotation.quotationNumber}</TableCell>
                    <TableCell>{quotation.customerName}</TableCell>
                    <TableCell>
                      {(() => {
                        // Recalculate total from items to ensure accuracy
                        let calculatedSubtotal = 0;
                        if (Array.isArray(quotation.items)) {
                          quotation.items.forEach((item: any) => {
                            const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity || 0);
                            const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice || 0);
                            let itemTotal = typeof item.total === 'number' ? item.total : parseFloat(item.total || 0);
                            if (itemTotal === 0 && unitPrice > 0 && quantity > 0) {
                              itemTotal = unitPrice * quantity;
                            }
                            calculatedSubtotal += itemTotal;
                          });
                        }
                        const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (typeof quotation.subtotal === 'string' ? parseFloat(quotation.subtotal) : quotation.subtotal || 0);
                        const taxRate = typeof quotation.taxRate === 'string' ? parseFloat(quotation.taxRate) : quotation.taxRate || 20;
                        const taxAmount = subtotal * (taxRate / 100);
                        const total = subtotal + taxAmount;
                        return `£${total.toFixed(2)}`;
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(quotation.status!)} className="capitalize">
                        {quotation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(quotation.createdAt!), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(quotation)}
                          data-testid={`button-view-${quotation.id}`}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setDownloadDialogOpen(true);
                          }}
                          data-testid={`button-download-${quotation.id}`}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(quotation)}
                          data-testid={`button-edit-${quotation.id}`}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(quotation.id)}
                          data-testid={`button-delete-${quotation.id}`}
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
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No quotations yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first quotation to get started
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first">
              <Plus className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          </div>
        )}
      </Card>

      {/* Standalone Download Dialog for Actions Column */}
      <Dialog open={downloadDialogOpen && selectedQuotation !== null && !viewDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDownloadDialogOpen(false);
          setSelectedQuotation(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Format</DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="headerCheckboxActions" 
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="headerCheckboxActions" className="text-sm">Include Header</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="footerCheckboxActions" 
                    checked={includeFooter}
                    onChange={(e) => setIncludeFooter(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="footerCheckboxActions" className="text-sm">Include Footer</label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDownload(selectedQuotation, 'pdf')}
                >
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDownload(selectedQuotation, 'word')}
                >
                  Download Word
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
