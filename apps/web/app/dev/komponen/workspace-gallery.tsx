"use client";

import { ExternalLink, Layout, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { MediaView } from "@/components/workspace/media-view";
import { QuestionPanel } from "@/components/workspace/question-panel";
import { ReadingPanel } from "@/components/workspace/reading-panel";
import { ScratchArea } from "@/components/workspace/scratch-area";
import { AnswerPanel } from "@/components/workspace/AnswerPanel";
import { buttonVariants } from "@/components/ui/button";
import type { AnswerType, WorkspaceQuestion } from "@/lib/domain";
import { mockWorkspaceQuestions } from "@/lib/mock/workspace";
import { cn } from "@/lib/utils";

import { Section } from "./section";

type AnswerDemoQuestion = Pick<WorkspaceQuestion, "id" | "answerType" | "options">;

const answerDemoQuestions = {
  pg: {
    id: "demo-answer-pg",
    answerType: "pg",
    options: [
      { id: "pg-a", label: "A", text: "x < 3" },
      { id: "pg-b", label: "B", text: "x > 3" },
      { id: "pg-c", label: "C", text: "x = 3" },
    ],
  },
  pgk: {
    id: "demo-answer-pgk",
    answerType: "pgk",
    options: [
      { id: "pgk-a", label: "A", text: "Grafik membuka ke atas" },
      { id: "pgk-b", label: "B", text: "Sumbu simetri x = 2" },
      { id: "pgk-c", label: "C", text: "Titik puncaknya (2, -1)" },
    ],
  },
  bs: {
    id: "demo-answer-bs",
    answerType: "bs",
    options: [
      { id: "bs-1", label: "1", text: "Diskriminan positif menghasilkan dua akar berbeda." },
      { id: "bs-2", label: "2", text: "Parabola dengan a > 0 membuka ke bawah." },
      { id: "bs-3", label: "3", text: "Sumbu simetri membagi parabola menjadi dua bagian." },
    ],
  },
  isian: {
    id: "demo-answer-isian",
    answerType: "isian",
  },
} satisfies Record<AnswerType, AnswerDemoQuestion>;

export function WorkspaceGallery() {
  const [selectedOption, setSelectedOption] = useState<string | null>("opt-1-a");

  const standardQuestion = mockWorkspaceQuestions[0];
  const mediaQuestion = mockWorkspaceQuestions[1];
  const readingQuestion = mockWorkspaceQuestions[2];

  return (
    <>
      <p
        id="workspace"
        className="-mb-6 border-t pt-10 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
      >
        Komponen ruang kerja (Workspace) · Fase 10–11
      </p>

      {/* Demo link to full 100dvh workspace */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Layout className="size-4.5 text-primary" />
            <span>Ruang Kerja Satu Layar (100dvh)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Buka tampilan penuh ruang kerja satu layar tanpa scroll halaman, mendukung mode standar,
            media, dan bacaan.
          </p>
        </div>
        <Link
          href="/belajar/kerjakan/demo-assignment"
          className={cn(buttonVariants({ size: "sm" }), "min-h-touch gap-2 font-semibold")}
        >
          <span>Buka Ruang Kerja Penuh</span>
          <ExternalLink className="size-3.5" />
        </Link>
      </div>

      {/* 1. QuestionPanel Showcase */}
      <Section id="question-panel" title="QuestionPanel (Panel Soal)">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[420px] flex flex-col">
            <QuestionPanel
              question={standardQuestion}
              selectedOptionId={selectedOption}
              onSelectOption={setSelectedOption}
            />
          </div>

          <div className="space-y-3 rounded-xl border bg-card p-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground text-sm">
              <Sparkles className="size-4 text-primary" />
              <span>Spesifikasi QuestionPanel</span>
            </div>
            <p>
              • Menampilkan nomor butir, lencana tingkat kesulitan (Dasar, Mahir, Ujian UTBK), dan
              kompetensi.
            </p>
            <p>• Mendukung formula matematika dengan blok monospace terformat.</p>
            <p>• Pilihan jawaban A–E dengan target sentuh ≥ 44px (WCAG 2.5.5 / Apple HIG).</p>
            <p>• Interaktif: dapat dipilih dengan klik atau sentuhan di layar tablet.</p>
          </div>
        </div>
      </Section>

      {/* 2. MediaView Showcase */}
      <Section id="media-view" title="MediaView (Diagram & Grafik Geometri)">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[320px] flex flex-col">
            {mediaQuestion.media && <MediaView media={mediaQuestion.media} />}
          </div>

          <div className="space-y-3 rounded-xl border bg-card p-5 text-xs text-muted-foreground">
            <div className="font-bold text-foreground text-sm">Diagram Kartesius Vektor</div>
            <p>
              • Menggambar kurva kuadrat parabola $y = x^2 - 4x + 3$ beresolusi tinggi (vektor SVG).
            </p>
            <p>
              • Menandai titik puncak $P(2, -1)$, akar $(1, 0)$ dan $(3, 0)$, serta sumbu koordinat.
            </p>
            <p>• Bebas blur di tablet resolusi tinggi (Retina / AMOLED).</p>
          </div>
        </div>
      </Section>

      {/* 3. ReadingPanel Showcase */}
      <Section id="reading-panel" title="ReadingPanel (Panel Stimulus Bacaan)">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[440px] flex flex-col">
            {readingQuestion.stimulus && <ReadingPanel stimulus={readingQuestion.stimulus} />}
          </div>

          <div className="space-y-3 rounded-xl border bg-card p-5 text-xs text-muted-foreground">
            <div className="font-bold text-foreground text-sm">
              Aturan Scroll Internal (Aturan 9)
            </div>
            <p>
              • Sesuai Aturan Tak Boleh Dilanggar #9: Panel bacaan adalah satu-satunya area yang
              boleh memiliki scrollbar vertikal di dalam dirinya sendiri (
              <code>overflow-y-auto</code>).
            </p>
            <p>• Halaman ruang kerja induk tetap terkunci pada 100dvh tanpa scroll sama sekali.</p>
            <p>
              • Memuat narasi literasi numerasi lengkap (~450 kata), parameter harian, dan sumber
              rujukan.
            </p>
          </div>
        </div>
      </Section>

      {/* 4. ScratchArea Showcase */}
      <Section id="scratch-area" title="ScratchArea (Area Coretan Kertas Berpetak)">
        <div className="h-[280px] w-full flex flex-col">
          <ScratchArea label="Area Coretan Siswa (Kotak Berpetak 24px)" />
        </div>
      </Section>

      {/* 5. AnswerPanel Showcase */}
      <Section id="answer-panel" title="AnswerPanel (Empat Tipe Jawaban)">
        <p className="text-sm text-muted-foreground">
          Semua kontrol memakai state lokal untuk demonstrasi. Belum ada penilaian atau pengiriman
          jawaban.
        </p>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <AnswerPanel question={answerDemoQuestions.pg} />
          <AnswerPanel question={answerDemoQuestions.pgk} />
          <AnswerPanel question={answerDemoQuestions.bs} />
          <AnswerPanel question={answerDemoQuestions.isian} mockRecognition="x = 3" />
        </div>
      </Section>
    </>
  );
}
