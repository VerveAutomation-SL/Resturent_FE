import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <div className="space-y-8">
      <Card className="max-w-md mx-auto mt-12">
        <CardHeader className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle>Settings Temporarily Disabled</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            The settings page is currently unavailable. System configurations
            are managed automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
});
