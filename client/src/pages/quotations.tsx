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
import { Plus, Search, Eye, Download, Edit, Trash2, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Quotation } from "@shared/schema";
import { format } from "date-fns";

const quotationSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerAddress: z.string().optional(),
  quotationNumber: z.string().min(1, "Quotation number is required"),
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

type QuotationFormData = z.infer<typeof quotationSchema>;

export default function Quotations() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

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

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
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
      form.reset({
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
    createMutation.mutate(data);
  };

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewDialogOpen(true);
    setIsEditMode(false);
  };

  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewDialogOpen(true);
    setIsEditMode(true);
    // Populate form with quotation data
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-quotation">
              <Plus className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quotation</DialogTitle>
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
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending ? "Creating..." : "Create Quotation"}
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
                      {selectedQuotation.items.map((item: any, index: number) => (
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
                  <p className="text-lg font-semibold">£{typeof selectedQuotation.subtotal === 'string' ? parseFloat(selectedQuotation.subtotal).toFixed(2) : selectedQuotation.subtotal?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax Rate</p>
                  <p>{typeof selectedQuotation.taxRate === 'string' ? parseFloat(selectedQuotation.taxRate) : selectedQuotation.taxRate || 0}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax Amount</p>
                  <p className="text-lg font-semibold">£{typeof selectedQuotation.taxAmount === 'string' ? parseFloat(selectedQuotation.taxAmount).toFixed(2) : selectedQuotation.taxAmount?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">£{typeof selectedQuotation.total === 'string' ? parseFloat(selectedQuotation.total).toFixed(2) : selectedQuotation.total?.toFixed(2) || "0.00"}</p>
              </div>
              {selectedQuotation.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{selectedQuotation.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => handleEdit(selectedQuotation)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
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
                    <TableCell>£{parseFloat(quotation.total.toString()).toFixed(2)}</TableCell>
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
    </div>
  );
}
