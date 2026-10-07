"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const notConnected = {
  type: "info",
  title: "Belum berfungsi",
  description: "Tombol ini baru tampilan. Fungsinya dihubungkan setelah backend siap.",
} as const;

/** Download and delete buttons for a child's data. Neither does anything yet. */
export function ChildDataActions({ childName }: { childName: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation.trim().toLowerCase() === childName.toLowerCase();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setConfirmation("");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => toast.add(notConnected)}>
        <Download aria-hidden data-icon="inline-start" />
        Unduh data
      </Button>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden data-icon="inline-start" />
        Hapus data
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus data {childName}?</DialogTitle>
            <DialogDescription>
              Semua jawaban, coretan, dan laporan {childName} akan dihapus permanen. Ketik nama anak
              untuk melanjutkan.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={childName}
            aria-label={`Ketik ${childName} untuk konfirmasi`}
            autoComplete="off"
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
            <Button
              variant="destructive"
              disabled={!canDelete}
              onClick={() => {
                handleOpenChange(false);
                toast.add(notConnected);
              }}
            >
              Hapus permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
