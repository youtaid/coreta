"use client";

import { type FormEvent, type ReactNode, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { StudentLoginMethod } from "@/lib/domain";
import { cn } from "@/lib/utils";

const methods: { value: StudentLoginMethod; label: string; hint: string }[] = [
  { value: "email", label: "Email", hint: "Anak masuk dengan email dan kata sandi." },
  { value: "code", label: "Kode masuk + PIN", hint: "Untuk anak yang belum punya email." },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Form to create a student account. Submitting does nothing yet; it only shows a notice. */
export function CreateStudentForm() {
  const [method, setMethod] = useState<StudentLoginMethod>("code");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.add({
      type: "info",
      title: "Belum berfungsi",
      description: "Akun belum dibuat. Formulir ini dihubungkan setelah backend siap.",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Nama anak">
        {(id) => <Input id={id} name="name" autoComplete="off" required />}
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Cara masuk</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {methods.map((item) => (
            <label
              key={item.value}
              className={cn(
                "flex min-h-touch cursor-pointer flex-col justify-center rounded-lg border px-3 py-2 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring",
                method === item.value ? "border-primary bg-secondary" : "hover:bg-accent",
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="loginMethod"
                  value={item.value}
                  checked={method === item.value}
                  onChange={() => setMethod(item.value)}
                  className="size-4 accent-primary"
                />
                {item.label}
              </span>
              <span className="pl-6 text-sm text-muted-foreground">{item.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {method === "email" ? (
        <Field label="Email anak">
          {(id) => <Input id={id} name="email" type="email" autoComplete="off" required />}
        </Field>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kode masuk" hint="Huruf dan angka, misalnya RAKA-4821.">
            {(id) => <Input id={id} name="code" autoComplete="off" required />}
          </Field>
          <Field label="PIN" hint="4 angka.">
            {(id) => (
              <Input
                id={id}
                name="pin"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="off"
                required
              />
            )}
          </Field>
        </div>
      )}

      <Field
        label="Target harian"
        hint="Jumlah soal per hari yang dihitung sebagai target tercapai."
      >
        {(id) => (
          <Input
            id={id}
            name="dailyGoal"
            type="number"
            min={1}
            max={20}
            defaultValue={6}
            className="max-w-28"
          />
        )}
      </Field>

      <Button type="submit">Buat akun siswa</Button>
    </form>
  );
}
