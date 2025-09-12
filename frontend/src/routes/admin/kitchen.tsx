import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { NewEnhancedKitchenLayout } from "@/components/kitchen/NewEnhancedKitchenLayout";
import type { User } from "@/types";
import Cookies from "js-cookie";

export const Route = createFileRoute("/admin/kitchen")({
  component: AdminKitchenPage,
});

function AdminKitchenPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = Cookies.get("pos_token");

    if (!token) {
      return;
    }

    try {
      // Decode JWT token to get user information
      const decodedToken = jwtDecode<User & { exp: number; iat: number }>(
        token
      );

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
    }
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return <NewEnhancedKitchenLayout user={user} />;
}
