import { AgentLogList } from "@/components/domain/agent-log-list";
import { PageHeader } from "@/components/domain/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { formatRupiah } from "@/lib/format";
import { agentConversations, agentLabelNames, aiCostByDay } from "@/lib/mock/admin";

export default function AgentLogPage() {
  const today = aiCostByDay[0];
  const weekCost = aiCostByDay.reduce((sum, day) => sum + day.costIdr, 0);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Log agen AI"
        description="Percakapan asisten layanan beserta label keluhan, panggilan alat, dan biayanya."
      />

      <section aria-labelledby="biaya" className="space-y-4">
        <h2 id="biaya" className="font-heading text-xl font-semibold">
          Biaya AI
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {today && (
            <>
              <StatCard
                label={`Hari ini (${today.dayLabel})`}
                value={formatRupiah(today.costIdr)}
              />
              <StatCard label="Panggilan hari ini" value={String(today.calls)} />
            </>
          )}
          <StatCard label="7 hari terakhir" value={formatRupiah(weekCost)} />
          <StatCard
            label="Rata-rata per hari"
            value={formatRupiah(weekCost / aiCostByDay.length)}
          />
        </div>
      </section>

      <section aria-labelledby="percakapan" className="space-y-4">
        <h2 id="percakapan" className="font-heading text-xl font-semibold">
          Percakapan terbaru
        </h2>
        <AgentLogList conversations={agentConversations} labelNames={agentLabelNames} />
      </section>
    </section>
  );
}
