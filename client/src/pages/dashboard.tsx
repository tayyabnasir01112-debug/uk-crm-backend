import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { FileText, FileCheck, TruckIcon, Package, Users, PoundSterling, TrendingUp, Clock } from "lucide-react";
import { Link } from "wouter";
import type { Quotation, Invoice, DeliveryChallan, InventoryItem, Employee } from "@shared/schema";

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: deliveryChallans = [] } = useQuery<DeliveryChallan[]>({
    queryKey: ["/api/delivery-challans"],
  });

  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const stats = [
    {
      title: "Total Revenue",
      value: `£${invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0).toFixed(2)}`,
      icon: PoundSterling,
      description: "From paid invoices",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Active Invoices",
      value: invoices.filter(inv => inv.status !== "paid").length,
      icon: FileCheck,
      description: "Awaiting payment",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Inventory Items",
      value: inventoryItems.length,
      icon: Package,
      description: `${inventoryItems.reduce((sum, item) => sum + item.quantity, 0)} total units`,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Employees",
      value: employees.filter(emp => emp.status === "active").length,
      icon: Users,
      description: "Active team members",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  const recentQuotations = quotations.slice(0, 5);
  const recentInvoices = invoices.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6" data-testid={`stat-card-${index}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold mb-1" data-testid={`stat-value-${index}`}>{stat.value}</h3>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`w-12 h-12 rounded-md ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link href="/quotations">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-new-quotation">
              <FileText className="h-5 w-5" />
              <span className="text-xs">New Quotation</span>
            </Button>
          </Link>
          <Link href="/invoices">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-new-invoice">
              <FileCheck className="h-5 w-5" />
              <span className="text-xs">New Invoice</span>
            </Button>
          </Link>
          <Link href="/delivery-challans">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-new-challan">
              <TruckIcon className="h-5 w-5" />
              <span className="text-xs">New Challan</span>
            </Button>
          </Link>
          <Link href="/inventory">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-add-product">
              <Package className="h-5 w-5" />
              <span className="text-xs">Add Product</span>
            </Button>
          </Link>
          <Link href="/employees">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-add-employee">
              <Users className="h-5 w-5" />
              <span className="text-xs">Add Employee</span>
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-view-reports">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">View Reports</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Quotations</h2>
            <Link href="/quotations">
              <Button variant="ghost" size="sm" data-testid="button-view-all-quotations">View All</Button>
            </Link>
          </div>
          {recentQuotations.length > 0 ? (
            <div className="space-y-3">
              {recentQuotations.map((quotation) => (
                <div key={quotation.id} className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate" data-testid={`quotation-${quotation.id}`}>
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{quotation.quotationNumber}</p>
                      <p className="text-xs text-muted-foreground">{quotation.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">£{parseFloat(quotation.total.toString()).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{quotation.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No quotations yet</p>
              <Link href="/quotations">
                <Button variant="outline" size="sm" className="mt-3" data-testid="button-create-first-quotation">
                  Create Your First Quotation
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Recent Invoices */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Invoices</h2>
            <Link href="/invoices">
              <Button variant="ghost" size="sm" data-testid="button-view-all-invoices">View All</Button>
            </Link>
          </div>
          {recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate" data-testid={`invoice-${invoice.id}`}>
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{invoice.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">£{parseFloat(invoice.total.toString()).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{invoice.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No invoices yet</p>
              <Link href="/invoices">
                <Button variant="outline" size="sm" className="mt-3" data-testid="button-create-first-invoice">
                  Create Your First Invoice
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
