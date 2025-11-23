import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  FileText, 
  FileCheck, 
  TruckIcon, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Subscription } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
  });

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsLoggingOut(true);
    try {
      // Use fetch directly to avoid any routing issues
      const response = await fetch("https://uk-crm-backend.onrender.com/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      // Clear all queries regardless of response
      queryClient.clear();
      
      // Always redirect to home (landing page), even if logout request fails
      window.location.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Clear cache and redirect on error
      queryClient.clear();
      window.location.replace("/login");
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Quotations",
      url: "/quotations",
      icon: FileText,
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: FileCheck,
    },
    {
      title: "Delivery Challans",
      url: "/delivery-challans",
      icon: TruckIcon,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
    },
    {
      title: "HR / Employees",
      url: "/employees",
      icon: Users,
    },
    {
      title: "Sales Reports",
      url: "/reports",
      icon: BarChart3,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  const trialDaysRemaining = subscription?.trialEndsAt
    ? Math.max(0, Math.floor((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-base">CRM Launch</h2>
            <p className="text-xs text-muted-foreground">Business Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.url)}
                    isActive={location === item.url}
                    data-testid={`nav-${item.url}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {subscription?.status === "trial" && trialDaysRemaining !== null && (
          <SidebarGroup>
            <SidebarGroupLabel>Subscription</SidebarGroupLabel>
            <SidebarGroupContent className="px-3">
              <div className="p-3 rounded-md bg-muted space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Trial Status</span>
                  <Badge variant="secondary" className="text-xs" data-testid="badge-trial-days">
                    {trialDaysRemaining} days left
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Enjoying the CRM? Subscribe to continue after your trial ends.
                </p>
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setLocation('/settings?tab=subscription')}
                    data-testid="button-subscribe-stripe"
                  >
                    Subscribe with Stripe
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setLocation('/settings?tab=subscription')}
                    data-testid="button-subscribe-paypal"
                  >
                    Subscribe with PayPal
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                  <img src="https://cdn.simpleicons.org/stripe/635BFF" alt="Stripe" className="h-4 opacity-70" />
                  <img src="https://cdn.simpleicons.org/paypal/00457C" alt="PayPal" className="h-4 opacity-70" />
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          disabled={isLoggingOut}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Logging out..." : "Log Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
