"use client";

import { KeyRound } from "lucide-react";
import { type ReactNode, useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { type ChildActionState, createStudent, resetPin, updateTargets } from "./actions";

const initialState: ChildActionState = { status: "idle" };

const goalOptions = [
  { value: "utbk", label: "UTBK-SNBT" },
  { value: "tka", label: "TKA" },
  { value: "both", label: "TKA dan UTBK-SNBT" },
] as const;

const selectClass =
  "h-touch w-full rounded-lg border border-input bg-background px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-galat` : hint ? `${id}-petunjuk` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-galat`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-petunjuk`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function StatusMessage({ state }: { state: ChildActionState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "text-sm font-medium",
        state.status === "error" ? "text-destructive" : "text-success",
      )}
    >
      {state.message}
    </p>
  );
}

function PinFields({ errors }: { errors?: ChildActionState["errors"] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="PIN (6 angka)" hint="Hindari angka sama atau berurutan." error={errors?.pin}>
        {(props) => (
          <Input
            {...props}
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="new-password"
            required
          />
        )}
      </Field>
      <Field label="Ulangi PIN" error={errors?.pinConfirm}>
        {(props) => (
          <Input
            {...props}
            name="pinConfirm"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="new-password"
            required
          />
        )}
      </Field>
    </div>
  );
}

export function CreateStudentForm({
  defaultGoal,
  disabled,
}: {
  defaultGoal: string;
  disabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(createStudent, initialState);
  const errors = state.errors;
  const values = state.values ?? {};

  return (
    <div className="space-y-5">
      {state.created && (
        <div
          role="status"
          className="space-y-2 rounded-xl border border-success/40 bg-success/10 p-4"
        >
          <p className="font-semibold">Akun {state.created.name} sudah dibuat.</p>
          <p className="text-sm text-muted-foreground">
            Berikan kode masuk ini dan PIN yang Anda buat kepada anak. Anak masuk di halaman Masuk,
            tab Siswa.
          </p>
          <p className="font-mono text-2xl font-bold tracking-widest" aria-label="Kode masuk">
            {state.created.loginCode}
          </p>
        </div>
      )}

      <form action={formAction} className="space-y-5" key={state.formKey}>
        <fieldset disabled={disabled || isPending} className="space-y-5 disabled:opacity-60">
          <Field label="Nama anak" error={errors?.fullName}>
            {(props) => (
              <Input
                {...props}
                name="fullName"
                autoComplete="off"
                defaultValue={values.fullName}
                required
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Kelas" error={errors?.grade}>
              {(props) => (
                <select
                  {...props}
                  name="grade"
                  defaultValue={values.grade ?? "12"}
                  className={selectClass}
                >
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              )}
            </Field>
            <Field label="Target ujian" error={errors?.goal}>
              {(props) => (
                <select
                  {...props}
                  name="goal"
                  defaultValue={values.goal ?? defaultGoal}
                  className={selectClass}
                >
                  {goalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Target harian (soal)" error={errors?.dailyTarget}>
              {(props) => (
                <Input
                  {...props}
                  name="dailyTarget"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={values.dailyTarget ?? 6}
                />
              )}
            </Field>
          </div>

          <PinFields errors={errors} />
          <p className="text-sm text-muted-foreground">
            Kode masuk dibuat otomatis. Akun siswa tidak memakai email atau login Google.
          </p>

          <StatusMessage state={state.created ? initialState : state} />
          <Button type="submit">{isPending ? "Membuat akun..." : "Buat akun siswa"}</Button>
        </fieldset>
      </form>
    </div>
  );
}

export function TargetsForm({
  studentId,
  goal,
  dailyTarget,
}: {
  studentId: string;
  goal: string;
  dailyTarget: number;
}) {
  const [state, formAction, isPending] = useActionState(updateTargets, initialState);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target ujian" error={state.errors?.goal}>
          {(props) => (
            <select {...props} name="goal" defaultValue={goal} className={selectClass}>
              {goalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Target harian (soal)" error={state.errors?.dailyTarget}>
          {(props) => (
            <Input
              {...props}
              name="dailyTarget"
              type="number"
              min={1}
              max={20}
              defaultValue={dailyTarget}
            />
          )}
        </Field>
      </div>
      <StatusMessage state={state} />
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Simpan target"}
      </Button>
    </form>
  );
}

export function ResetPinForm({ studentId, childName }: { studentId: string; childName: string }) {
  const [state, formAction, isPending] = useActionState(resetPin, initialState);
  return (
    <details className="group rounded-lg border px-3 py-2">
      <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <KeyRound className="size-4" aria-hidden />
        Ganti PIN {childName}
      </summary>
      <form action={formAction} className="space-y-3 pt-2">
        <input type="hidden" name="studentId" value={studentId} />
        <PinFields errors={state.errors} />
        <StatusMessage state={state} />
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan PIN baru"}
        </Button>
      </form>
    </details>
  );
}
