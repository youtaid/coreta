import { isGoogleAuthEnabled } from "@/lib/auth/origin-server";

import { RegisterForm } from "./register-form";

export default async function RegisterPage({ searchParams }: PageProps<"/daftar">) {
  const { paket } = await searchParams;
  return (
    <RegisterForm
      paket={(Array.isArray(paket) ? paket[0] : paket) ?? "monthly"}
      googleEnabled={isGoogleAuthEnabled()}
    />
  );
}
