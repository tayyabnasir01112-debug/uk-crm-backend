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
import { Plus, Search, Eye, Download, Edit, Trash2, TruckIcon, X, FileText, FileCheck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getAPIBaseURL } from "@/lib/api";
import type { DeliveryChallan, Quotation } from "@shared/schema";
import { format } from "date-fns";
import { useLocation } from "wouter";

const challanSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerAddress: z.string().optional(),
  deliveryAddress: z.string().optional(),
  challanNumber: z.string().min(1, "Challan number is required"),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unit: z.string(),
  })).min(1, "At least one item is required"),
  notes: z.string().optional(),
});

type ChallanFormData = z.infer<typeof challanSchema>;

export default function DeliveryChallans() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sourceQuotation, setSourceQuotation] = useState<Quotation | null>(null);
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

  const { data: challans = [], isLoading } = useQuery<DeliveryChallan[]>({
    queryKey: ["/api/delivery-challans"],
  });

  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  // Check for quotation data from localStorage
  useEffect(() => {
    const quotationData = localStorage.getItem('createChallanFromQuotation');
    if (quotationData) {
      try {
        const quotation = JSON.parse(quotationData);
        setSourceQuotation(quotation);
        localStorage.removeItem('createChallanFromQuotation');
      } catch (error) {
        console.error("Failed to parse quotation data:", error);
      }
    }
  }, []);

  const form = useForm<ChallanFormData>({
    resolver: zodResolver(challanSchema),
    defaultValues: {
      customerName: "",
      customerAddress: "",
      deliveryAddress: "",
      challanNumber: `DC-${Date.now().toString().slice(-6)}`,
      items: [{ name: "", quantity: 1, unit: "pcs" }],
      notes: "",
    },
  });

  // Load from quotation if provided
  useEffect(() => {
    if (sourceQuotation) {
      form.reset({
        customerName: sourceQuotation.customerName,
        customerAddress: sourceQuotation.customerAddress || "",
        deliveryAddress: sourceQuotation.customerAddress || "",
        challanNumber: `DC-${Date.now().toString().slice(-6)}`,
        items: Array.isArray(sourceQuotation.items) ? sourceQuotation.items.map((item: any) => ({
          name: item.name || "",
          quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
          unit: "pcs",
        })) : [{ name: "", quantity: 1, unit: "pcs" }],
        notes: sourceQuotation.notes || "",
      });
      setDialogOpen(true);
    }
  }, [sourceQuotation, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ChallanFormData) => {
      const response = await apiRequest("POST", "/api/delivery-challans", data);
      return await response.json();
    },
    onSuccess: async (challan) => {
      toast({
        title: "Success",
        description: "Delivery challan created successfully",
      });
      
      // Update source quotation status if created from quotation
      if (sourceQuotation) {
        try {
          await apiRequest("PUT", `/api/quotations/${sourceQuotation.id}`, {
            status: "sent"
          });
          queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
        } catch (error) {
          console.error("Failed to update quotation status:", error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/delivery-challans"] });
      setDialogOpen(false);
      setSourceQuotation(null);
      form.reset({
        customerName: "",
        customerAddress: "",
        deliveryAddress: "",
        challanNumber: `DC-${Date.now().toString().slice(-6)}`,
        items: [{ name: "", quantity: 1, unit: "pcs" }],
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
        description: "Failed to create delivery challan",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ChallanFormData }) => {
      const response = await apiRequest("PUT", `/api/delivery-challans/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Delivery challan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-challans"] });
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
        description: error.message || "Failed to update delivery challan",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/delivery-challans/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Delivery challan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-challans"] });
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
        description: "Failed to delete delivery challan",
        variant: "destructive",
      });
    },
  });

  const filteredChallans = challans.filter((c) =>
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.challanNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "dispatched": return "default";
      case "delivered": return "default";
      default: return "secondary";
    }
  };

  const onSubmit = (data: ChallanFormData) => {
    createMutation.mutate(data);
  };

  const handleView = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setViewDialogOpen(true);
    setIsEditMode(false);
  };

  const handleEdit = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setViewDialogOpen(true);
    setIsEditMode(true);
    form.reset({
      customerName: challan.customerName,
      customerAddress: challan.customerAddress || "",
      deliveryAddress: challan.deliveryAddress || "",
      challanNumber: challan.challanNumber,
      items: Array.isArray(challan.items) ? challan.items.map((item: any) => ({
        name: item.name || "",
        quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
        unit: item.unit || "pcs",
      })) : [{ name: "", quantity: 1, unit: "pcs" }],
      notes: challan.notes || "",
    });
  };

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [...currentItems, { name: "", quantity: 1, unit: "pcs" }]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  const handleDownload = async (challan: DeliveryChallan, format: 'pdf' | 'word' = 'pdf') => {
    try {
      const url = new URL(`/api/delivery-challans/${challan.id}/download`, getAPIBaseURL());
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
      link.download = `challan-${challan.challanNumber}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadDialogOpen(false);

      toast({
        title: "Success",
        description: `Delivery challan downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download delivery challan",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading delivery challans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Delivery Challans</h1>
          <p className="text-muted-foreground">Track and manage delivery documents</p>
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
                  {quotations.filter(q => q.status === 'accepted' || q.status === 'draft' || q.status === 'sent').map((quotation) => (
                    <Button
                      key={quotation.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setSourceQuotation(quotation);
                        setDialogOpen(true);
                      }}
                    >
                      {quotation.quotationNumber} - {quotation.customerName}
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-challan">
                <Plus className="h-4 w-4 mr-2" />
                Create Challan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {sourceQuotation ? "Create Delivery Challan from Quotation" : "Create New Delivery Challan"}
                </DialogTitle>
              </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="challanNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Challan Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-challan-number" />
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
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} data-testid="input-customer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
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
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Delivery Address" {...field} data-testid="input-delivery-address" />
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
                          <FormItem className="col-span-5">
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
                          <FormItem className="col-span-3">
                            <FormLabel className="text-xs">Quantity</FormLabel>
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
                        name={`items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-xs">Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="pcs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Delivery instructions..." {...field} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    setSourceQuotation(null);
                  }} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending ? "Creating..." : "Create Challan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search delivery challans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </div>

        {filteredChallans.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChallans.map((challan) => (
                  <TableRow key={challan.id} data-testid={`row-challan-${challan.id}`}>
                    <TableCell className="font-medium">{challan.challanNumber}</TableCell>
                    <TableCell>{challan.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(challan.status!)} className="capitalize">
                        {challan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(challan.createdAt!), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(challan)}
                          data-testid={`button-view-${challan.id}`}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedChallan(challan);
                            setDownloadDialogOpen(true);
                          }}
                          data-testid={`button-download-${challan.id}`}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(challan)}
                          data-testid={`button-edit-${challan.id}`}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(challan.id)}
                          data-testid={`button-delete-${challan.id}`}
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
              <TruckIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No delivery challans yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first delivery challan to track shipments
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first">
              <Plus className="h-4 w-4 mr-2" />
              Create Challan
            </Button>
          </div>
        )}
      </Card>

      {/* View/Edit Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Delivery Challan" : "View Delivery Challan"}</DialogTitle>
          </DialogHeader>
          {selectedChallan && !isEditMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Challan Number</p>
                  <p className="text-lg font-semibold">{selectedChallan.challanNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedChallan.status!)} className="capitalize">
                    {selectedChallan.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                  <p>{selectedChallan.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Address</p>
                  <p>{selectedChallan.customerAddress || "N/A"}</p>
                </div>
              </div>
              {selectedChallan.deliveryAddress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delivery Address</p>
                  <p>{selectedChallan.deliveryAddress}</p>
                </div>
              )}
              {Array.isArray(selectedChallan.items) && selectedChallan.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedChallan.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.name || "N/A"}</TableCell>
                          <TableCell>{item.quantity || 0}</TableCell>
                          <TableCell>{item.unit || "pcs"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {selectedChallan.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{selectedChallan.notes}</p>
                </div>
              )}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="challanIncludeHeader" 
                      checked={includeHeader}
                      onChange={(e) => setIncludeHeader(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="challanIncludeHeader" className="text-sm">Include Header</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="challanIncludeFooter" 
                      checked={includeFooter}
                      onChange={(e) => setIncludeFooter(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="challanIncludeFooter" className="text-sm">Include Footer</label>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      localStorage.setItem('createInvoiceFromChallan', JSON.stringify(selectedChallan));
                      setViewDialogOpen(false);
                      setLocation('/invoices');
                    }}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
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
                              onClick={() => handleDownload(selectedChallan, 'pdf')}
                            >
                              Download PDF
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleDownload(selectedChallan, 'word')}
                            >
                              Download Word
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={() => handleEdit(selectedChallan)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedChallan && isEditMode && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => {
                if (selectedChallan) {
                  updateMutation.mutate({ id: selectedChallan.id, data });
                }
              })} className="space-y-4">
                <FormField
                  control={form.control}
                  name="challanNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Challan Number</FormLabel>
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
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
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
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address</FormLabel>
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
                          <FormItem className="col-span-5">
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
                          <FormItem className="col-span-3">
                            <FormLabel className="text-xs">Quantity</FormLabel>
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
                        name={`items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-xs">Unit</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    {updateMutation.isPending ? "Updating..." : "Update Challan"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Standalone Download Dialog for Actions Column */}
      <Dialog open={downloadDialogOpen && selectedChallan !== null && !viewDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDownloadDialogOpen(false);
          setSelectedChallan(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Format</DialogTitle>
          </DialogHeader>
          {selectedChallan && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="headerCheckboxActionsChallan" 
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="headerCheckboxActionsChallan" className="text-sm">Include Header</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="footerCheckboxActionsChallan" 
                    checked={includeFooter}
                    onChange={(e) => setIncludeFooter(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="footerCheckboxActionsChallan" className="text-sm">Include Footer</label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDownload(selectedChallan, 'pdf')}
                >
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDownload(selectedChallan, 'word')}
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
