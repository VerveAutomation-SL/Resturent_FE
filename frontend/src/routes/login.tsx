import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import apiClient from "@/api/client";
import type { LoginRequest, LoginResponse, APIResponse } from "@/types";
import { toastHelpers } from "@/lib/toast-helpers";
import {
  Eye,
  EyeOff,
  Store,
  Users,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = apiClient.isAuthenticated();
    if (user) {
      console.log("Already authenticated, redirecting to home...");
      if (user.role === "admin") {
        console.log("Admin user detected, redirecting to admin panel");
        router.navigate({ to: "/admin/dashboard" });
        return;
      } else {
        console.log("Non-admin user, redirecting to home");
      }
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response: APIResponse<LoginResponse> =
        await apiClient.login(credentials);
      return response;
    },
    onSuccess: (response) => {
      console.log("Login success:", response);
      console.log("Current API URL:", import.meta.env.VITE_API_URL);
      if (response.success && response.data) {
        apiClient.setAuthToken(response.data.accessToken);

        // Get user info from token for the toast
        const userInfo = apiClient.isAuthenticated();
        const userRole = userInfo?.role;
        const userName = userInfo?.name;

        // Show success toast
        toastHelpers.loginSuccess(userRole, userName);

        router.navigate({ to: "/" });
      } else {
        console.error("Login failed:", response.message);
        const errorMessage = response.message || "Login failed";
        setError(errorMessage);

        // Show login failed toast
        toastHelpers.loginFailed(errorMessage);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Login failed";
      setError(errorMessage);

      // Show login failed toast
      toastHelpers.loginFailed(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("email and password are required");
      return;
    }

    loginMutation.mutate(formData);
  };

  const fillDemoCredentials = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex bg-card border-r border-border p-8 xl:p-12 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center items-center max-w-lg h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 xl:w-12 xl:h-12 bg-primary rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 xl:w-7 xl:h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl xl:text-3xl font-bold text-foreground">
              Mantraa POS
            </h1>
          </div>

          <h2 className="text-3xl xl:text-4xl font-bold mb-4 xl:mb-6 leading-tight text-foreground text-center">
            Complete Restaurant
            <br />
            <span className="text-muted-foreground">Management System</span>
          </h2>

          <p className="text-base xl:text-lg text-center text-muted-foreground mb-8 xl:mb-12 leading-relaxed">
            Streamline your restaurant operations with our comprehensive POS
            solution. Manage orders, track inventory, process payments, and grow
            your business.
          </p>

          <div className="grid grid-cols-2 gap-4 xl:gap-6">
            {[
              {
                icon: Users,
                title: "Staff Management",
                desc: "Role-based access control",
              },
              {
                icon: CreditCard,
                title: "Payment Processing",
                desc: "Multiple payment methods",
              },
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                desc: "Business insights",
              },
              {
                icon: Store,
                title: "Order Management",
                desc: "Kitchen workflow",
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2 xl:gap-3">
                <div className="w-7 h-7 xl:w-8 xl:h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs xl:text-sm text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground)) 1px, transparent 0)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border border-border">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-14 h-14 xl:w-16 xl:h-16 bg-primary rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                <Store className="w-7 h-7 xl:w-8 xl:h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl xl:text-2xl font-bold text-foreground">
                Restaurant POS Login
              </CardTitle>
              <CardDescription className="text-sm xl:text-base text-muted-foreground">
                🍽️ Choose your role below or sign in manually
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    type="text"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="h-10"
                    autoComplete="email"
                    disabled={loginMutation.isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="h-10 pr-10"
                      autoComplete="current-password"
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-destructive rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-destructive-foreground rounded-full"></div>
                      </div>
                      <span className="font-medium">Login Failed</span>
                    </div>
                    <div className="mt-1 text-xs text-destructive/80">
                      {error}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    "Sign In to Restaurant POS"
                  )}
                </Button>
              </form>

              <div className="border-t border-border pt-4">
                {/* Demo Accounts */}
                <div>
                  <div className="text-xs text-muted-foreground mb-2 font-medium">
                    Demo Accounts - Click to auto-fill
                  </div>
                  <div className="grid gap-2">
                    {[
                      {
                        email: "kalpa@restaurant.com",
                        role: "Admin",
                        icon: Settings,
                        bg: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
                        desc: "👑 Full system access & management",
                        password: "kalpa123",
                      },
                      {
                        email: "manager@restaurant.com",
                        role: "Manager",
                        icon: BarChart3,
                        bg: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15",
                        desc: "📊 Reports & staff management",
                        password: "manager123",
                      },
                      {
                        email: "counter@restaurant.com",
                        role: "Counter Staff",
                        icon: CreditCard,
                        bg: "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/15",
                        desc: "💰 Orders & payment processing",
                        password: "counter1@123",
                      },
                    ].map((account) => (
                      <button
                        key={account.email}
                        onClick={() =>
                          fillDemoCredentials(account.email, account.password)
                        }
                        className={`flex items-center justify-between p-3 border rounded-lg ${account.bg} text-left transition-all duration-200 hover:shadow-sm`}
                        disabled={loginMutation.isPending}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-card rounded-lg flex items-center justify-center shadow-sm">
                            <account.icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">
                              {account.role}
                            </div>
                            <div className="text-xs opacity-75 mt-0.5">
                              {account.desc}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs opacity-60 font-mono bg-card px-1.5 py-0.5 rounded">
                          {account.password}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
