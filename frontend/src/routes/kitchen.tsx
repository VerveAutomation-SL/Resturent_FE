import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import apiClient from "@/api/client";
import { NewEnhancedKitchenLayout } from "@/components/kitchen/NewEnhancedKitchenLayout";
import type { User } from "@/types";
import Cookies from "js-cookie";

export const Route = createFileRoute("/kitchen")({
  component: KitchenPage,
});

function KitchenPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const loadAuthState = async () => {
      const token = Cookies.get("pos_token");

      console.log(
        "🔍 Loading kitchen auth - token:",
        token ? "exists" : "missing"
      );

      if (!token) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        // Decode JWT token to get user information
        const decodedToken = jwtDecode<User & { exp: number; iat: number }>(
          token
        );

        // Check if token has expired
        const currentTime = new Date().getTime();
        const tokenExpTime = decodedToken.exp * 1000;

        if (currentTime >= tokenExpTime) {
          apiClient.clearAuth();
          setIsLoadingAuth(false);
          return;
        }

        // Extract user information from decoded token
        const userFromToken: User = {
          id: decodedToken.id,
          name: decodedToken.name,
          email: decodedToken.email,
          phone: decodedToken.phone || "",
          role: decodedToken.role,
          status: decodedToken.status,
          created_at: decodedToken.created_at,
          updated_at: decodedToken.updated_at,
        };

        setUser(userFromToken);
        console.log("✅ Kitchen auth loaded - user role:", userFromToken.role);
      } catch (error) {
        console.error("❌ Failed to decode JWT token:", error);
        apiClient.clearAuth();
      }

      setIsLoadingAuth(false);
    };

    loadAuthState();
  }, []);

  // Loading state
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading kitchen...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!apiClient.isAuthenticated() || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has kitchen access (admin or manager roles)
  const hasKitchenAccess = user.role === "admin" || user.role === "manager";

  if (!hasKitchenAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the kitchen display.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Main POS
          </button>
        </div>
      </div>
    );
  }

  return <NewEnhancedKitchenLayout user={user} />;
}
