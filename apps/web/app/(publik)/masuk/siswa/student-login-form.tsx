"use client";

import { KeyRound, LogIn } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { type StudentSignInState, signInWithCode } from "./actions";

const initialState: StudentSignInState = { status: "idle" };

/** Masuk siswa dengan kode masuk + PIN (dipakai di /masuk tab Siswa dan /masuk/siswa). */
export function StudentLoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signInWithCode, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div className="space-y-1.5">
        <label htmlFor="student-code" className="text-xs font-semibold text-foreground">
          Kode Masuk
        </label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            id="student-code"
            name="code"
            defaultValue={state.code}
            autoComplete="username"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Contoh: K7QM-3XPA"
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? "student-code-error" : "student-code-hint"}
            className="pl-9 font-mono text-sm tracking-widest uppercase"
          />
        </div>
        {errors.code ? (
          <p id="student-code-error" className="text-[11px] font-medium text-destructive">
            {errors.code}
          </p>
        ) : (
          <p id="student-code-hint" className="text-[11px] text-muted-foreground">
            Kode dari orang tua Anda, 8 huruf dan angka.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="student-pin" className="text-xs font-semibold text-foreground">
          PIN
        </label>
        <Input
          id="student-pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={6}
          placeholder="6 angka"
          aria-invalid={Boolean(errors.pin)}
          aria-describedby={errors.pin ? "student-pin-error" : undefined}
          className="text-sm tracking-widest"
        />
        {errors.pin && (
          <p id="student-pin-error" className="text-[11px] font-medium text-destructive">
            {errors.pin}
          </p>
        )}
      </div>

      {state.message && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full gap-2 font-bold min-h-touch"
      >
        {isPending ? (
          <span>Memeriksa Kode...</span>
        ) : (
          <>
            <LogIn className="size-4" />
            <span>Masuk sebagai Siswa</span>
          </>
        )}
      </Button>
    </form>
  );
}
