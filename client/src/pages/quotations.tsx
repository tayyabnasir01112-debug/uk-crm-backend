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
import { Plus, Search, Eye, Download, Edit, Trash2 } from "lucide-react";
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
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
  })),
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

  const createMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      return await apiRequest("POST", "/api/quotations", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setDialogOpen(false);
      form.reset();
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
        description: "Failed to create quotation",
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quotation</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Button variant="ghost" size="icon" data-testid={`button-view-${quotation.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-download-${quotation.id}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-${quotation.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(quotation.id)}
                          data-testid={`button-delete-${quotation.id}`}
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
