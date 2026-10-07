"use client";

import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface NotConnectedButtonProps extends Omit<ComponentProps<typeof Button>, "onClick"> {
  children: ReactNode;
  /** What the button will do once the backend exists, shown in the notice. */
  description?: string;
}

/** A button for an action the backend does not support yet; clicking it only shows a notice. */
export function NotConnectedButton({
  children,
  description = "Tombol ini baru tampilan. Fungsinya dihubungkan setelah backend siap.",
  ...props
}: NotConnectedButtonProps) {
  return (
    <Button
      {...props}
      onClick={() => toast.add({ type: "info", title: "Belum berfungsi", description })}
    >
      {children}
    </Button>
  );
}
