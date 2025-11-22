import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, PoundSterling, FileText } from "lucide-react";
import type { Invoice, Quotation } from "@shared/schema";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";

export default function Reports() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: quotations = [], isLoading: quotationsLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const totalRevenue = invoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status !== "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);

  const avgInvoiceValue = invoices.length > 0 
    ? invoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0) / invoices.length
    : 0;

  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  });

  const monthlyData = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.createdAt!);
      return invDate >= monthStart && invDate <= monthEnd;
    });

    const monthQuotations = quotations.filter(q => {
      const qDate = new Date(q.createdAt!);
      return qDate >= monthStart && qDate <= monthEnd;
    });

    return {
      month: format(month, "MMM yyyy"),
      revenue: monthInvoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0),
      invoices: monthInvoices.length,
      quotations: monthQuotations.length,
    };
  });

  const statusData = [
    {
      status: "Paid",
      count: invoices.filter(inv => inv.status === "paid").length,
      value: invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)
    },
    {
      status: "Sent",
      count: invoices.filter(inv => inv.status === "sent").length,
      value: invoices.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)
    },
    {
      status: "Draft",
      count: invoices.filter(inv => inv.status === "draft").length,
      value: invoices.filter(inv => inv.status === "draft").reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)
    },
    {
      status: "Overdue",
      count: invoices.filter(inv => inv.status === "overdue").length,
      value: invoices.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)
    }
  ];

  if (authLoading || invoicesLoading || quotationsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sales Reports</h1>
        <p className="text-muted-foreground">Visual insights into your business performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold mb-1">£{totalRevenue.toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground">From paid invoices</p>
            </div>
            <div className="w-12 h-12 rounded-md bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <PoundSterling className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending Revenue</p>
              <h3 className="text-3xl font-bold mb-1">£{pendingRevenue.toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </div>
            <div className="w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Avg Invoice Value</p>
              <h3 className="text-3xl font-bold mb-1">£{avgInvoiceValue.toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground">Per invoice</p>
            </div>
            <div className="w-12 h-12 rounded-md bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Invoices</p>
              <h3 className="text-3xl font-bold mb-1">{invoices.length}</h3>
              <p className="text-xs text-muted-foreground">All time</p>
            </div>
            <div className="w-12 h-12 rounded-md bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Revenue (£)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Documents Created */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Documents Created</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="invoices" fill="hsl(var(--chart-1))" name="Invoices" />
              <Bar dataKey="quotations" fill="hsl(var(--chart-2))" name="Quotations" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Invoice Status Breakdown */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Invoice Status Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusData.map((status, index) => (
            <Card key={index} className="p-4 bg-muted">
              <p className="text-sm font-medium text-muted-foreground mb-2">{status.status}</p>
              <p className="text-2xl font-bold mb-1">{status.count}</p>
              <p className="text-sm text-muted-foreground">£{status.value.toFixed(2)}</p>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
