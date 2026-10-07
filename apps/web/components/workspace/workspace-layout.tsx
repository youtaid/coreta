"use client";

import type { Stroke } from "@coreta/ink";
import type { Answer, ScoreResult } from "@coreta/scoring";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  ImageIcon,
  Layout,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkspaceLayoutMode, WorkspaceMedia, WorkspaceQuestion } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { resolveLayout } from "@/lib/workspace-fit";

import { Logo } from "@/components/domain/logo";

import { FloatingWindow } from "./floating-window";
import { MediaView } from "./media-view";
import type { PastedMedia } from "./paste-layer";
import { QuestionPanel } from "./question-panel";
import { ReadingPanel } from "./reading-panel";
import { ScratchArea } from "./scratch-area";

export interface WorkspaceLayoutProps {
  question: WorkspaceQuestion;
  questions?: readonly WorkspaceQuestion[];
  currentQuestionIndex?: number;
  totalQuestions?: number;
  worksheetTitle?: string;
  stageName?: string;
  selectedOptionId?: string | null;
  onSelectOption?: (optionId: string) => void;
  currentAnswer?: Answer;
  onAnswerChange?: (answer: Answer) => void;
  scoreResult?: ScoreResult;
  strokes?: Stroke[];
  onStrokesChange?: (strokes: Stroke[]) => void;
  elapsedSeconds?: number;
  submissionStatus?: "draft" | "submitting" | "graded";
  overallScore?: number | null;
  isSubmitting?: boolean;
  onSelectQuestion?: (index: number) => void;
  onPreviousQuestion?: () => void;
  onNextQuestion?: () => void;
  onSubmit?: () => void;
  onViewResults?: () => void;
  onReportHint?: () => void;
  onExitHref?: string;
  className?: string;
}

const modeBadges: Record<
  WorkspaceLayoutMode,
  { label: string; icon: typeof Layout; variant: "default" | "secondary" | "outline" }
> = {
  standar: { label: "Mode Standar", icon: Layout, variant: "secondary" },
  media: { label: "Mode Media", icon: ImageIcon, variant: "default" },
  bacaan: { label: "Mode Bacaan", icon: BookOpen, variant: "outline" },
};

function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * WorkspaceLayout manages the single-screen (100dvh, overflow-hidden) workspace.
 * Follows Rule 9: The page NEVER scrolls; only the reading panel may scroll internally.
 * Seamlessly adapts across 1180x820 (landscape), 820x1180 (portrait), and 390x844 (mobile).
 */
export function WorkspaceLayout({
  question,
  questions,
  currentQuestionIndex = question.number - 1,
  totalQuestions = questions?.length ?? question.totalQuestions,
  worksheetTitle = "Worksheet Matematika",
  stageName = "Tahap 2 — Aljabar",
  selectedOptionId,
  onSelectOption,
  currentAnswer,
  onAnswerChange,
  scoreResult,
  strokes,
  onStrokesChange,
  elapsedSeconds,
  submissionStatus = "draft",
  overallScore,
  isSubmitting = false,
  onSelectQuestion,
  onPreviousQuestion,
  onNextQuestion,
  onSubmit,
  onViewResults,
  onExitHref = "/belajar/worksheet",
  className,
}: WorkspaceLayoutProps) {
  // Media pasted onto each question's scratch area. Kept here, not inside the scratch area, so a
  // pasted table is still there when the student returns to the question.
  const [pastedByQuestion, setPastedByQuestion] = useState<Record<string, PastedMedia[]>>({});
  const pasteCounter = useRef(0);
  const pastedHere = pastedByQuestion[question.id] ?? [];

  function pasteMedia(media: WorkspaceMedia) {
    const id = `paste-${(pasteCounter.current += 1)}`;
    setPastedByQuestion((current) => {
      const list = current[question.id] ?? [];
      const slot = (list.at(-1)?.slot ?? -1) + 1;
      return { ...current, [question.id]: [...list, { id, slot, media }] };
    });
  }

  function removePasted(id: string) {
    setPastedByQuestion((current) => ({
      ...current,
      [question.id]: (current[question.id] ?? []).filter((item) => item.id !== id),
    }));
  }

  const pastedCountOf = (media: WorkspaceMedia) =>
    pastedHere.filter((item) => item.media.id === media.id).length;

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("petunjuk_tidak_jelas");
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  // The declared mode is a floor; content that does not fit escalates it (standar → media → bacaan).
  const layout = resolveLayout(question);
  const modeBadge = modeBadges[layout.mode];
  const ModeIcon = modeBadge.icon;
  const isLastQuestion = question.number >= totalQuestions;
  const isFirstQuestion = question.number <= 1;

  return (
    <div
      data-testid="workspace-root"
      className={cn(
        "fixed inset-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground select-none",
        className,
      )}
    >
      {/* 1. TOP BAR — Header & Progress (Fixed, No Scroll) */}
      <header
        role="banner"
        className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card/95 px-3 sm:px-4 py-2 backdrop-blur-xs shadow-2xs z-30"
      >
        {/* Left: Exit button & worksheet meta */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={onExitHref}
            className="flex min-h-touch min-w-touch items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Kembali ke daftar worksheet"
          >
            <ArrowLeft className="size-4.5" />
          </Link>

          <Logo variant="icon" size="sm" className="hidden sm:inline-flex shrink-0" />

          <div className="min-w-0">
            <h1 className="font-heading truncate text-xs sm:text-sm font-bold text-foreground">
              {worksheetTitle}
            </h1>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
              {stageName}
            </p>
          </div>
        </div>

        {/* Center: Question Navigation Pills (Touch >= 44px) */}
        <nav aria-label="Navigasi nomor butir soal" className="flex items-center gap-1 sm:gap-1.5">
          {questions && questions.length > 0 ? (
            questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onSelectQuestion?.(idx)}
                  className={cn(
                    "flex min-h-touch min-w-touch items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-ring",
                    isCurrent
                      ? "border-2 border-primary bg-primary text-primary-foreground shadow-xs scale-105"
                      : "border border-border/80 bg-muted/40 text-muted-foreground hover:border-primary/40 hover:bg-muted",
                  )}
                  aria-label={`Buka soal nomor ${q.number} (${resolveLayout(q).mode})`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span>{q.number}</span>
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <span>Soal</span>
              <span className="text-primary font-bold">{question.number}</span>
              <span>/</span>
              <span>{totalQuestions}</span>
            </div>
          )}
        </nav>

        {/* Right: Timer, Graded Badge, Mode Badge & Theme Toggle */}
        <div className="flex items-center gap-2">
          {elapsedSeconds !== undefined && (
            <div
              className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-mono font-medium text-muted-foreground"
              aria-label={`Waktu pengerjaan: ${formatElapsedTime(elapsedSeconds)}`}
            >
              <Clock className="size-3.5 text-primary" />
              <span>{formatElapsedTime(elapsedSeconds)}</span>
            </div>
          )}

          {submissionStatus === "graded" && overallScore !== null && overallScore !== undefined && (
            <Badge
              variant={overallScore >= 70 ? "default" : "secondary"}
              className="h-7 px-2.5 text-xs font-bold"
            >
              Skor: {Math.round(overallScore)}%
            </Badge>
          )}

          <Badge
            variant={modeBadge.variant}
            className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold"
          >
            <ModeIcon className="size-3.5" />
            <span>{modeBadge.label}</span>
          </Badge>

          <ThemeToggle />
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER — Adapts to 3 modes without scrolling */}
      <main
        role="main"
        className="relative flex flex-1 min-h-0 w-full overflow-hidden p-2 sm:p-3 md:p-3.5 gap-2 sm:gap-3"
      >
        {/* MODE 1: STANDAR (Soal pendek, split 2 panel) */}
        {layout.mode === "standar" && (
          <div className="flex h-full min-h-0 w-full flex-col md:flex-row gap-2 sm:gap-3">
            {/* Left/Top: Question Panel */}
            <div className="h-[46%] md:h-full md:w-[45%] lg:w-[42%] flex flex-col min-h-0 shrink-0">
              <QuestionPanel
                question={question}
                selectedOptionId={selectedOptionId}
                onSelectOption={onSelectOption}
                currentAnswer={currentAnswer}
                onAnswerChange={onAnswerChange}
                scoreResult={scoreResult}
              />
            </div>

            {/* Right/Bottom: Scratch Area */}
            <div className="h-[54%] md:h-full flex-1 flex flex-col min-h-0">
              <ScratchArea
                key={question.id}
                label="Area Coretan — Mode Standar"
                pasted={pastedHere}
                onRemovePasted={removePasted}
                strokes={strokes}
                onStrokesChange={onStrokesChange}
              />
            </div>
          </div>
        )}

        {/* MODE 2: MEDIA (Soal dengan diagram / media grafis) */}
        {layout.mode === "media" && (
          <div className="flex h-full min-h-0 w-full flex-col md:flex-row gap-2 sm:gap-3">
            {/* Left/Top: Media + Question Panel */}
            <div className="h-[52%] md:h-full md:w-[50%] lg:w-[48%] flex flex-col gap-2 min-h-0 shrink-0">
              {/* Media diagram */}
              <div className="h-[48%] md:h-[45%] flex flex-col min-h-0 shrink-0">
                {question.media ? (
                  <MediaView
                    media={question.media}
                    onPaste={() => question.media && pasteMedia(question.media)}
                    pastedCount={pastedCountOf(question.media)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                    Tidak ada media
                  </div>
                )}
              </div>

              {/* Question panel */}
              <div className="h-[52%] md:h-[55%] flex flex-col min-h-0 flex-1">
                <QuestionPanel
                  question={question}
                  selectedOptionId={selectedOptionId}
                  onSelectOption={onSelectOption}
                  currentAnswer={currentAnswer}
                  onAnswerChange={onAnswerChange}
                  scoreResult={scoreResult}
                />
              </div>
            </div>

            {/* Right/Bottom: Scratch Area */}
            <div className="h-[48%] md:h-full flex-1 flex flex-col min-h-0">
              <ScratchArea
                key={question.id}
                label="Area Coretan — Mode Media"
                pasted={pastedHere}
                onRemovePasted={removePasted}
                strokes={strokes}
                onStrokesChange={onStrokesChange}
              />
            </div>
          </div>
        )}

        {/* MODE 3: BACAAN (Stimulus teks panjang + area bacaan scroll internal) */}
        {layout.mode === "bacaan" && (
          <div className="flex h-full min-h-0 w-full flex-col md:flex-row gap-2 sm:gap-3">
            {/* Left/Top: Reading Stimulus Panel (ONLY container that scrolls internally) */}
            <div className="h-[46%] md:h-full md:w-[48%] lg:w-[46%] flex flex-col min-h-0 shrink-0">
              {question.stimulus ? (
                <ReadingPanel stimulus={question.stimulus} />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                  Tidak ada stimulus bacaan
                </div>
              )}
            </div>

            {/* Right/Bottom: Question Panel + Scratch Area */}
            <div className="h-[54%] md:h-full flex-1 flex flex-col gap-2 min-h-0">
              {/* Question Panel */}
              <div className="h-[48%] md:h-[45%] flex flex-col min-h-0 shrink-0">
                <QuestionPanel
                  question={question}
                  selectedOptionId={selectedOptionId}
                  onSelectOption={onSelectOption}
                  currentAnswer={currentAnswer}
                  onAnswerChange={onAnswerChange}
                  scoreResult={scoreResult}
                />
              </div>

              {/* Scratch Area */}
              <div className="h-[52%] md:h-[55%] flex flex-col min-h-0 flex-1">
                <ScratchArea
                  key={question.id}
                  label="Area Coretan — Mode Bacaan"
                  pasted={pastedHere}
                  onRemovePasted={removePasted}
                  strokes={strokes}
                  onStrokesChange={onStrokesChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Media that does not fit beside a reading passage floats above the layout. */}
        {layout.mediaPlacement === "floating" && question.media && (
          <FloatingWindow key={question.id} title={question.media.title ?? "Media soal"}>
            <MediaView
              media={question.media}
              className="rounded-none border-0 shadow-none"
              onPaste={() => question.media && pasteMedia(question.media)}
              pastedCount={pastedCountOf(question.media)}
            />
          </FloatingWindow>
        )}
      </main>

      {/* 3. BOTTOM BAR — Actions, Status & Navigation (Fixed, No Scroll) */}
      <footer
        role="contentinfo"
        className="flex h-14 shrink-0 items-center justify-between border-t border-border/80 bg-card/95 px-3 sm:px-4 py-2 backdrop-blur-xs shadow-2xs z-30"
      >
        {/* Left: Laporkan Petunjuk */}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            className="flex min-h-touch items-center gap-1.5 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Flag className="size-3.5 text-warning" />
            <span className="hidden xs:inline">Laporkan</span>
            <span>Petunjuk</span>
          </Button>
        </div>

        {/* Center: Offline/Save status indicator or Graded Status */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          {submissionStatus === "graded" ? (
            <>
              <span className="size-2 rounded-full bg-primary" />
              <span className="hidden sm:inline">
                Worksheet dinilai (Skor: {Math.round(overallScore ?? 0)}%)
              </span>
              <span className="sm:hidden">Dinilai</span>
            </>
          ) : (
            <>
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span className="hidden sm:inline">Tersimpan di perangkat</span>
              <span className="sm:hidden">Tersimpan</span>
            </>
          )}
        </div>

        {/* Right: Navigation (Sebelumnya & Selanjutnya / Kirim / Lihat Hasil) */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFirstQuestion}
            onClick={onPreviousQuestion}
            className="flex min-h-touch items-center gap-1 px-3 text-xs font-semibold disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </Button>

          {submissionStatus === "graded" && !isLastQuestion && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onViewResults ?? onSubmit}
              className="hidden sm:flex min-h-touch items-center gap-1.5 px-3 text-xs font-semibold"
            >
              <span>Lihat Hasil</span>
              <CheckCircle2 className="size-3.5 text-primary" />
            </Button>
          )}

          {submissionStatus === "graded" && isLastQuestion ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onViewResults ?? onSubmit}
              className="flex min-h-touch items-center gap-1.5 px-4 text-xs font-bold bg-primary text-primary-foreground shadow-xs"
            >
              <span>Lihat Hasil</span>
              <CheckCircle2 className="size-3.5" />
            </Button>
          ) : isLastQuestion ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isSubmitting || submissionStatus === "submitting"}
              onClick={() => setIsSubmitConfirmOpen(true)}
              className="flex min-h-touch items-center gap-1.5 px-4 text-xs font-bold bg-primary text-primary-foreground shadow-xs"
            >
              <span>{isSubmitting || submissionStatus === "submitting" ? "Menilai..." : "Kirim"}</span>
              <Send className="size-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onNextQuestion}
              className="flex min-h-touch items-center gap-1 px-3.5 text-xs font-bold"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </footer>

      {/* DIALOG 1: Laporkan Petunjuk */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-warning">
              <Flag className="size-5" />
              <DialogTitle>Laporkan Petunjuk / Soal</DialogTitle>
            </div>
            <DialogDescription>
              Jika petunjuk membingungkan, salah ketik, atau tidak membantu, kirim laporan untuk
              ditinjau tim dalam 24 jam.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="font-semibold text-foreground">Pilih alasan pelaporan:</p>
            {[
              { id: "petunjuk_tidak_jelas", label: "Petunjuk membingungkan atau ambigu" },
              { id: "petunjuk_bocor", label: "Petunjuk membocorkan jawaban langsung" },
              { id: "salah_konsep", label: "Terdapat kesalahan rumus atau konsep matematika" },
              { id: "masalah_tampilan", label: "Diagram / teks tidak tampil semestinya" },
            ].map((reason) => (
              <label
                key={reason.id}
                className={cn(
                  "flex min-h-touch items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                  reportReason === reason.id
                    ? "border-primary bg-secondary/80 font-semibold text-primary"
                    : "border-border hover:bg-muted/40 text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="report_reason"
                  value={reason.id}
                  checked={reportReason === reason.id}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="size-4 text-primary"
                />
                <span>{reason.label}</span>
              </label>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="min-h-touch"
              onClick={() => setIsReportOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="default"
              className="min-h-touch"
              onClick={() => {
                setIsReportOpen(false);
              }}
            >
              Kirim Laporan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Konfirmasi Pengumpulan Jawaban */}
      <Dialog open={isSubmitConfirmOpen} onOpenChange={setIsSubmitConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="size-5" />
              <DialogTitle>Kumpulkan Jawaban Worksheet?</DialogTitle>
            </div>
            <DialogDescription>
              Kamu telah menjawab soal pada worksheet ini. Setelah dikirim, jawaban akan dinilai
              oleh sistem dan pembahasan soal akan dibuka.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-xs space-y-1 text-muted-foreground">
            <p className="font-semibold text-foreground">Ringkasan Worksheet:</p>
            <p>• {worksheetTitle}</p>
            <p>• {totalQuestions} butir soal telah dikerjakan</p>
            <p>• Coretan tersimpan otomatis</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="min-h-touch"
              onClick={() => setIsSubmitConfirmOpen(false)}
            >
              Periksa Lagi
            </Button>
            <Button
              type="button"
              variant="default"
              className="min-h-touch bg-primary font-bold"
              onClick={() => {
                setIsSubmitConfirmOpen(false);
                onSubmit?.();
              }}
            >
              Kirim Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
