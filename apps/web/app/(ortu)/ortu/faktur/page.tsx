import Link from "next/link";

import { InvoiceList } from "@/components/domain/invoice-list";
import { PageHeader } from "@/components/domain/page-header";
import { Button } from "@/components/ui/button";
import { invoices } from "@/lib/mock/billing";

export default function InvoicesPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Orang tua"
        title="Faktur"
        description="Riwayat tagihan dan pembayaran. Faktur yang sudah dibayar bisa diunduh sebagai PDF."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/ortu/langganan" />}>
            Kembali ke langganan
          </Button>
        }
      />
      <InvoiceList invoices={invoices} />
    </section>
  );
}
