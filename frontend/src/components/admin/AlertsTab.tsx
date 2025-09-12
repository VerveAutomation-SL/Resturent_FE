import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InventoryIngredient } from "@/types";

type Props = {
  alerts: Array<{
    id: number;
    item: InventoryIngredient;
    message: string;
    created_at: string;
  }>;
  acknowledgeAlert: (id: number) => void;
};

export default function AlertsTab({ alerts, acknowledgeAlert }: Props) {
  return (
    <div className="p-6 space-y-4">
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No active alerts
          </CardContent>
        </Card>
      ) : (
        alerts.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="font-medium">{a.item.name}</div>
                <div className="text-sm text-muted-foreground">{a.message}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
              <div>
                <Button size="sm" onClick={() => acknowledgeAlert(a.id)}>
                  Acknowledge
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
