import { PageHeader } from "@/components/domain/page-header";
import { UserDirectory } from "@/components/domain/user-directory";
import { adminUsers } from "@/lib/mock/content";

export default function UsersPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Pengguna"
        description="Cari pengguna, lihat status langganan, lalu perpanjang atau nonaktifkan akses."
      />
      <UserDirectory users={adminUsers} />
    </section>
  );
}
