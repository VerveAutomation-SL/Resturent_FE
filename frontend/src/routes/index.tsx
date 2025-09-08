import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import apiClient from "@/api/client";
import { RoleBasedLayout } from "@/components/RoleBasedLayout";
import type { User } from "@/types";
import Cookies from "js-cookie";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ALL HOOKS MUST BE AT THE TOP LEVEL - before any conditional returns
  // const { isLoading: isServerVerifying, error } = useQuery({
  //   queryKey: ["currentUser"],
  //   queryFn: () => {
  //     console.log("Verifying user with API URL:", import.meta.env.VITE_API_URL);
  //     return apiClient.getCurrentUser();
  //   },
  //   retry: 1,
  //   enabled: false, // Temporarily disable server verification
  //   onError: (error) => {
  //     console.error("getCurrentUser failed:", error);
  //     // Clear auth and redirect to login
  //     apiClient.clearAuth();
  //     window.location.href = "/login";
  //   },
  // });

  useEffect(() => {
    console.log("Loading user from JWT token...");
    const token = Cookies.get("pos_token");

    console.log("Stored token:", token ? "exists" : "missing");

    // Check if token exists
    if (!token) {
      console.log("Token missing, clearing auth");
      apiClient.clearAuth();
      setIsLoading(false);
      window.location.href = "/login";
      return;
    }

    // Decode JWT token to get user information and check expiry
    try {
      const decodedToken = jwtDecode<User & { exp: number; iat: number }>(
        token
      );
      console.log("Decoded token:", decodedToken);

      // Check if token has expired (from JWT token itself)
      const currentTime = new Date().getTime();
      const tokenExpTime = decodedToken.exp * 1000; // Convert to milliseconds

      if (currentTime >= tokenExpTime) {
        console.log("Token expired (from JWT), clearing auth");
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

      console.log("User from JWT:", userFromToken);
      setUser(userFromToken);

      // No need to store user separately since we get it from JWT token
    } catch (error) {
      console.error("Failed to decode JWT token:", error);
      apiClient.clearAuth();
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, []);

  // Show loading while we check Cookies
  if (isLoading) {
    console.log("Still loading user data from Cookies...");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading POS System...</p>
        </div>
      </div>
    );
  }

  // Check authentication - ONLY after Cookies is loaded
  if (!apiClient.isAuthenticated() || !user) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" />;
  }

  // Redirect admin users to admin panel
  if (user.role === "admin") {
    console.log("Admin user detected, redirecting to admin panel");
    return <Navigate to="/admin/dashboard" />;
  }

  console.log(
    "User authenticated, rendering role-based layout for user:",
    user
  );
  return <RoleBasedLayout user={user} />;
}
