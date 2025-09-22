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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-start items-center max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Store className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">POS System</h1>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Modern Point of Sale
            <br />
            <span className="text-blue-200">for Your Business</span>
          </h2>

          <p className="text-xl text-center text-blue-100 mb-12 leading-relaxed">
            Streamline your operations with our complete POS solution. Manage
            orders, track inventory, and grow your business with powerful
            analytics.
          </p>

          <div className="grid grid-cols-2 gap-6">
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
              <div key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-blue-200 text-xs">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Store className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Restaurant POS Login
              </CardTitle>
              <CardDescription className="text-base">
                🍽️ Choose your role below or sign in manually
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">email</label>
                  <Input
                    type="text"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="h-11"
                    autoComplete="email"
                    disabled={loginMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
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
                      className="h-11 pr-10"
                      autoComplete="current-password"
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                  <div className="bg-gradient-to-r from-red-50 to-red-25 border border-red-200 text-red-700 p-4 rounded-lg text-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      <span className="font-medium">Login Failed</span>
                    </div>
                    <div className="mt-1 text-xs text-red-600">{error}</div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-base font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    "Sign In to POS System"
                  )}
                </Button>
              </form>

              <div className="border-t pt-6">
                {/* Roles */}
                <div>
                  <div className="text-xs text-gray-600 mb-2 font-medium">
                    Demo Accounts
                  </div>
                  <div className="grid gap-2">
                    {[
                      {
                        email: "kalpa@restaurant.com",
                        role: "admin",
                        icon: Settings,
                        bg: "bg-red-50 text-red-700 border-red-100",
                        desc: "👑 Full system access",
                        password: "kalpa123",
                      },
                      {
                        email: "manager@restaurant.com",
                        role: "manager",
                        icon: BarChart3,
                        bg: "bg-blue-50 text-blue-700 border-blue-100",
                        desc: "📊 Management & reports",
                        password: "manager123",
                      },
                      {
                        email: "counter@restaurant.com",
                        role: "Counter",
                        icon: CreditCard,
                        bg: "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200",
                        desc: "💰 Payment processing & all orders",
                        password: "counter1@123",
                      },
                    ].map((account) => (
                      <button
                        key={account.email}
                        onClick={() =>
                          fillDemoCredentials(account.email, account.password)
                        }
                        className={`flex items-center justify-between p-3 border rounded-lg ${account.bg} hover:bg-opacity-80 text-left transition-all duration-200`}
                        disabled={loginMutation.isPending}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-white/70 rounded flex items-center justify-center">
                            <account.icon className="w-3 h-3" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {account.role}
                            </div>
                            <div className="text-xs opacity-70">
                              {account.desc}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs opacity-60 font-mono">
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
