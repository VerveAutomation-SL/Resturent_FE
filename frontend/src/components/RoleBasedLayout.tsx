import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CounterInterface } from "@/components/counter/CounterInterface";
import {
  LayoutDashboard,
  CreditCard,
  ShoppingCart,
  Settings,
  LogOut,
} from "lucide-react";
import type { User as UserType } from "@/types";
import apiClient from "@/api/client";

interface RoleBasedLayoutProps {
  user: UserType;
}

export function RoleBasedLayout({ user }: RoleBasedLayoutProps) {
  const [currentView, setCurrentView] = useState<string>(
    getDefaultView(user.role)
  );

  function getDefaultView(role: string): string {
    switch (role) {
      case "admin":
      case "manager":
        return "dashboard";
      case "counter":
        return "counter";
      default:
        return "counter";
    }
  }

  const handleLogout = () => {
    apiClient.clearAuth();
    window.location.href = "/login";
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "admin":
        return {
          title: "Administrator",
          color: "bg-red-100 text-red-800",
          icon: <Settings className="w-4 h-4" />,
          description: "Full system access and management",
        };
      case "manager":
        return {
          title: "Manager",
          color: "bg-purple-100 text-purple-800",
          icon: <LayoutDashboard className="w-4 h-4" />,
          description: "Operations management and reporting",
        };
      case "counter":
        return {
          title: "Counter/Checkout",
          color: "bg-green-100 text-green-800",
          icon: <CreditCard className="w-4 h-4" />,
          description: "Order creation and payment processing",
        };
      default:
        return {
          title: "Counter/Checkout",
          color: "bg-green-100 text-green-800",
          icon: <CreditCard className="w-4 h-4" />,
          description: "Order creation and payment processing",
        };
    }
  };

  const roleConfig = getRoleConfig(user.role);

  // Get available views based on user role
  const getAvailableViews = (role: string) => {
    const views = [];

    // Admin and managers get all views
    if (role === "admin" || role === "manager") {
      views.push(
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "counter",
          label: "Counter/Checkout",
          icon: <CreditCard className="w-4 h-4" />,
        }
      );
    }
    // Counter gets counter interface and general POS
    else if (role === "counter") {
      views.push({
        id: "counter",
        label: "Counter/Checkout",
        icon: <CreditCard className="w-4 h-4" />,
      });
    }
    // Default fallback
    else {
      views.push({
        id: "counter",
        label: "Counter/Checkout",
        icon: <CreditCard className="w-4 h-4" />,
      });
    }

    return views;
  };

  const availableViews = getAvailableViews(user.role);

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <AdminLayout user={user} />;
      case "counter":
        return <CounterInterface />;
      default:
        return <CounterInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <div className="border-b border-border bg-card px-6 py-3 h-[8vh]">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo and Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">POS System</span>
            </div>

            {/* Navigation Tabs */}
            {availableViews.length > 1 && (
              <div className="flex items-center gap-2">
                {availableViews.map((view) => (
                  <Button
                    key={view.id}
                    variant={currentView === view.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentView(view.id)}
                    className="flex items-center gap-2"
                  >
                    {view.icon}
                    {view.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - User Info and Actions */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  {roleConfig.description}
                </div>
              </div>
              <Badge className={`${roleConfig.color} font-medium`}>
                {roleConfig.icon}
                <span className="ml-1">{roleConfig.title}</span>
              </Badge>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>{renderCurrentView()}</div>
    </div>
  );
}
