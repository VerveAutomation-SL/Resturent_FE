import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { RoleBasedLayout } from "@/components/RoleBasedLayout";
import type { User } from "@/types";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Loading user from JWT token...");
    const decodedToken = apiClient.isAuthenticated();

    if (decodedToken) {
      console.log("Decoded token User:", decodedToken);
      setUser(decodedToken);

      // Show user detected toast
      // toastHelpers.userDetected(decodedToken.role, decodedToken.name);
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
  if (!user) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" />;
  }

  // Redirect admin users to admin panel
  if (user.role === "admin") {
    console.log("Admin user detected, redirecting to admin panel");
    return <Navigate to="/admin/dashboard" />;
  }

  return <RoleBasedLayout user={user} />;
}
