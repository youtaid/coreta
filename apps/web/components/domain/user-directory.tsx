"use client";

import { SearchX } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/domain/empty-state";
import { NotConnectedButton } from "@/components/domain/not-connected-button";
import { SubscriptionBadge } from "@/components/domain/subscription-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AdminUser } from "@/lib/domain";

/** Matches name or email, ignoring case and surrounding spaces. */
export function filterUsers(users: readonly AdminUser[], query: string): AdminUser[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...users];
  return users.filter(
    (user) => user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle),
  );
}

/** Searchable user list. The row actions do nothing yet. */
export function UserDirectory({ users }: { users: readonly AdminUser[] }) {
  const [query, setQuery] = useState("");
  const visible = filterUsers(users, query);

  return (
    <div className="space-y-5">
      <label className="grid max-w-md gap-1 text-sm font-medium">
        Cari pengguna
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nama atau email"
          autoComplete="off"
        />
      </label>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Menampilkan {visible.length} dari {users.length} pengguna
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Pengguna tidak ditemukan"
          description="Coba nama atau email lain."
        />
      ) : (
        <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
          {visible.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4"
            >
              <div className="min-w-0 space-y-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{user.name}</span>
                  <Badge variant="outline">{user.role === "parent" ? "Orang tua" : "Siswa"}</Badge>
                  {user.subscription && <SubscriptionBadge status={user.subscription} />}
                  {!user.active && <Badge variant="destructive">Dinonaktifkan</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.email} · aktif terakhir {user.lastActiveLabel}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {user.role === "parent" && (
                  <NotConnectedButton
                    variant="outline"
                    description="Perpanjang akses (maksimal 7 hari) dihubungkan setelah backend siap."
                  >
                    Perpanjang akses
                    <span className="sr-only"> {user.name}</span>
                  </NotConnectedButton>
                )}
                <NotConnectedButton
                  variant="outline"
                  description="Menonaktifkan akun dihubungkan setelah backend siap."
                >
                  {user.active ? "Nonaktifkan" : "Aktifkan"}
                  <span className="sr-only"> {user.name}</span>
                </NotConnectedButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
