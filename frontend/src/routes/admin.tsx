import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import apiClient from "@/api/client";
import type { User } from "@/types";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import Cookies from "js-cookie";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("pos_token");

    if (!token) {
      setIsLoading(false);
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
        setIsLoading(false);
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
    } catch (error) {
      console.error("Failed to decode JWT token:", error);
      apiClient.clearAuth();
    }

    setIsLoading(false);
  }, []);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!apiClient.isAuthenticated() || !user) {
    return <Navigate to="/login" />;
  }

  // Check admin role
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-4">
            You don't have admin privileges.
          </p>
          <Navigate to="/" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <AdminSidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
