"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { SubscriptionAction } from "@/lib/domain";
import { subscriptionActionLabels } from "@/lib/subscription";
import { cn } from "@/lib/utils";

interface SubscriptionActionsProps {
  /** Actions to offer, primary first. */
  actions: readonly SubscriptionAction[];
  className?: string;
}

/** Subscription buttons. None of them does anything yet; each one shows a notice. */
export function SubscriptionActions({ actions, className }: SubscriptionActionsProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {actions.map((action, index) => (
        <Button
          key={action}
          variant={index === 0 ? "default" : action === "cancel" ? "destructive" : "outline"}
          onClick={() =>
            toast.add({
              type: "info",
              title: "Belum berfungsi",
              description: `"${subscriptionActionLabels[action]}" dihubungkan setelah sistem pembayaran siap.`,
            })
          }
        >
          {subscriptionActionLabels[action]}
        </Button>
      ))}
    </div>
  );
}
