import { readConsentToken } from "@/lib/auth/consent-server";
import { CONSENT_VERSION } from "@/lib/consent";
import { createAdminClient } from "@/lib/supabase/admin";

import { type ConsentDecision, ConsentView, InvalidConsentLink } from "./consent-view";

export const dynamic = "force-dynamic";

/** r***@contoh.com: cukup untuk dikenali pemiliknya, tidak membocorkan alamat lengkap. */
function maskEmail(email: string | undefined) {
  if (!email) return "-";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

export default async function ConsentPage({ params }: PageProps<"/persetujuan/[token]">) {
  const { token } = await params;
  const result = readConsentToken(token);
  if (!result.ok) {
    return (
      <InvalidConsentLink
        expired={result.reason === "expired" || result.reason === "wrong-version"}
      />
    );
  }

  // Token sudah diverifikasi server; data dibaca dengan service_role karena pembukanya bisa
  // belum masuk (tautan dari email). Yang ditampilkan hanya milik orang tua di dalam token.
  const parentId = result.payload.parentId;
  const admin = createAdminClient();
  const [profile, user, consent, guardianships] = await Promise.all([
    admin.from("profiles").select("full_name, role").eq("id", parentId).maybeSingle(),
    admin.auth.admin.getUserById(parentId),
    admin
      .from("consents")
      .select("granted, version")
      .eq("parent_id", parentId)
      .eq("type", "data_anak")
      .maybeSingle(),
    admin
      .from("guardianships")
      // students dan profiles terhubung lewat dua jalur (profile_id dan guardianships): sebut kuncinya.
      .select("students(goal, profiles!students_profile_id_fkey(full_name))")
      .eq("parent_id", parentId),
  ]);

  const loadError = profile.error ?? consent.error ?? guardianships.error;
  if (loadError) {
    console.error("[persetujuan] data gagal dimuat", loadError.code, loadError.message);
    throw new Error("Data persetujuan gagal dimuat.");
  }
  if (profile.data?.role !== "parent") {
    return <InvalidConsentLink expired={false} />;
  }

  const initialDecision: ConsentDecision =
    consent.data?.version === CONSENT_VERSION
      ? consent.data.granted
        ? "approved"
        : "rejected"
      : "pending";

  const childrenList = (guardianships.data ?? []).flatMap(({ students }) =>
    students ? [{ name: students.profiles?.full_name ?? "Tanpa nama", goal: students.goal }] : [],
  );

  return (
    <ConsentView
      token={token}
      version={CONSENT_VERSION}
      parentName={profile.data.full_name ?? "Orang tua"}
      parentEmail={maskEmail(user.data.user?.email)}
      childrenList={childrenList}
      initialDecision={initialDecision}
    />
  );
}
