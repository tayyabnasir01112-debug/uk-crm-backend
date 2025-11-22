import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, CreditCard, User, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Business, Subscription, User as UserType } from "@shared/schema";

const businessSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  vatNumber: z.string().optional(),
  companyNumber: z.string().optional(),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  paymentLink: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export default function Settings() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: business, isLoading: businessLoading } = useQuery<Business>({
    queryKey: ["/api/business"],
  });

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
  });

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: business?.businessName || "",
      address: business?.address || "",
      city: business?.city || "",
      postcode: business?.postcode || "",
      phone: business?.phone || "",
      email: business?.email || "",
      vatNumber: business?.vatNumber || "",
      companyNumber: business?.companyNumber || "",
      headerText: business?.headerText || "",
      footerText: business?.footerText || "",
      paymentLink: business?.paymentLink || "",
      primaryColor: business?.primaryColor || "#1e40af",
    },
  });

  useEffect(() => {
    if (business) {
      form.reset({
        businessName: business.businessName,
        address: business.address || "",
        city: business.city || "",
        postcode: business.postcode || "",
        phone: business.phone || "",
        email: business.email || "",
        vatNumber: business.vatNumber || "",
        companyNumber: business.companyNumber || "",
        headerText: business.headerText || "",
        footerText: business.footerText || "",
        paymentLink: business.paymentLink || "",
        primaryColor: business.primaryColor || "#1e40af",
      });
    }
  }, [business, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: BusinessFormData) => {
      return await apiRequest("PUT", "/api/business", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Business settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
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
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BusinessFormData) => {
    updateMutation.mutate(data);
  };

  const trialDaysRemaining = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  if (authLoading || businessLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and business preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="business" data-testid="tab-business">
            <Building2 className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="subscription" data-testid="tab-subscription">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email || ""} disabled className="mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input value={user?.firstName || ""} disabled className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input value={user?.lastName || ""} disabled className="mt-2" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Profile information is managed by your authentication provider.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Business Information</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-business-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-postcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-vat" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Number</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-company-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="headerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header Text</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-header" />
                      </FormControl>
                      <FormDescription>Appears on invoices and documents</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="footerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Text</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-footer" />
                      </FormControl>
                      <FormDescription>Appears on invoices and documents</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Link</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} data-testid="input-payment-link" />
                      </FormControl>
                      <FormDescription>Payment URL or QR code link for invoices</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Brand Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input type="color" {...field} className="w-20 h-11" data-testid="input-color" />
                          <Input value={field.value} onChange={field.onChange} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save">
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Subscription & Billing</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-border rounded-md">
                <div>
                  <h3 className="font-semibold text-lg">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">£20/month - Complete CRM</p>
                </div>
                <Badge variant={subscription?.status === "trial" ? "secondary" : "default"} className="capitalize">
                  {subscription?.status || "trial"}
                </Badge>
              </div>

              {subscription?.status === "trial" && trialDaysRemaining !== null && (
                <Card className="p-4 bg-muted">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Trial Period</h4>
                      <p className="text-sm text-muted-foreground">
                        You have <strong>{trialDaysRemaining} days</strong> remaining in your free trial.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold">Payment Methods</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your Stripe or PayPal subscription to continue after your trial ends.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" disabled data-testid="button-stripe">
                    Add Stripe Payment
                  </Button>
                  <Button variant="outline" disabled data-testid="button-paypal">
                    Add PayPal Payment
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Payment integration will be configured by the admin. Contact support for assistance.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
