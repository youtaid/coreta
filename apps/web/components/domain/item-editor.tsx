"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";

import { NotConnectedButton } from "@/components/domain/not-connected-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { itemStatusLabels, validateItem } from "@/lib/admin-content";
import type {
  AdminItem,
  AnswerType,
  ItemOption,
  QuestionTier,
  WorkspaceLayoutMode,
} from "@/lib/domain";
import { resolveLayout } from "@/lib/workspace-fit";

const selectClass =
  "h-touch w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring";

const textareaClass =
  "min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring";

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

const answerTypes: { value: AnswerType; label: string }[] = [
  { value: "pg", label: "Pilihan ganda" },
  { value: "pgk", label: "PG kompleks" },
  { value: "bs", label: "Benar-salah" },
  { value: "isian", label: "Isian singkat" },
];

const tiers: { value: QuestionTier; label: string }[] = [
  { value: "dasar", label: "Dasar" },
  { value: "mahir", label: "Mahir" },
  { value: "ujian", label: "Ujian" },
];

const layoutModes: { value: WorkspaceLayoutMode; label: string }[] = [
  { value: "standar", label: "Standar" },
  { value: "media", label: "Media" },
  { value: "bacaan", label: "Bacaan" },
];

/** Form for every field of the `items` model, with live validation. Nothing is saved yet. */
export function ItemEditor({ item }: { item: AdminItem }) {
  const [draft, setDraft] = useState<AdminItem>(item);
  const patch = (changes: Partial<AdminItem>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const issues = validateItem(draft);
  const publishable = issues.length === 0;
  const hasOptions = draft.answerType !== "isian";
  const resolved = resolveLayout(draft);

  function patchOption(id: string, changes: Partial<ItemOption>) {
    patch({
      options: draft.options.map((option) =>
        option.id === id ? { ...option, ...changes } : option,
      ),
    });
  }

  function toggleKey(id: string) {
    if (draft.answerType === "pg") return patch({ answerKey: [id] });
    patch({
      answerKey: draft.answerKey.includes(id)
        ? draft.answerKey.filter((entry) => entry !== id)
        : [...draft.answerKey, id],
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Data butir</CardTitle>
            <CardDescription>Bidang-bidang tabel items.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Kode (code)">
              {(id) => <Input id={id} value={draft.code} readOnly />}
            </Field>
            <Field label="Kompetensi (competency)">
              {(id) => (
                <Input
                  id={id}
                  value={`${draft.competencyCode} · ${draft.competencyName}`}
                  readOnly
                />
              )}
            </Field>
            <Field label="Tingkat (tier)">
              {(id) => (
                <select
                  id={id}
                  className={selectClass}
                  value={draft.tier}
                  onChange={(event) => patch({ tier: event.target.value as QuestionTier })}
                >
                  {tiers.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Tipe jawaban (answer_type)">
              {(id) => (
                <select
                  id={id}
                  className={selectClass}
                  value={draft.answerType}
                  onChange={(event) => patch({ answerType: event.target.value as AnswerType })}
                >
                  {answerTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field
              label="Tata letak (layout_mode)"
              hint={`Isi butir ini membutuhkan mode "${resolved.mode}".`}
            >
              {(id) => (
                <select
                  id={id}
                  className={selectClass}
                  value={draft.layoutMode}
                  onChange={(event) =>
                    patch({ layoutMode: event.target.value as WorkspaceLayoutMode })
                  }
                >
                  {layoutModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Kesulitan (difficulty)" hint="0 = mudah, 1 = sulit.">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft.difficulty}
                  onChange={(event) => patch({ difficulty: Number(event.target.value) })}
                />
              )}
            </Field>
            <Field label="Stimulus (stimulus_id)" hint="Kosongkan jika butir berdiri sendiri.">
              {(id) => (
                <Input
                  id={id}
                  value={draft.stimulusId ?? ""}
                  onChange={(event) => patch({ stimulusId: event.target.value || undefined })}
                />
              )}
            </Field>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Status dan versi</p>
              <p className="flex items-center gap-2">
                <Badge variant="secondary">{itemStatusLabels[draft.status]}</Badge>
                <span className="text-muted-foreground tabular-nums">versi {draft.version}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Soal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Teks soal (stem)">
              {(id) => (
                <textarea
                  id={id}
                  className={textareaClass}
                  value={draft.stem}
                  onChange={(event) => patch({ stem: event.target.value })}
                />
              )}
            </Field>
            <Field label="Rumus (LaTeX)" hint="Opsional.">
              {(id) => (
                <Input
                  id={id}
                  className="font-mono"
                  value={draft.formula ?? ""}
                  onChange={(event) => patch({ formula: event.target.value || undefined })}
                />
              )}
            </Field>
            {draft.media && (
              <Field label="Teks alternatif media" hint="Wajib untuk setiap media.">
                {(id) => (
                  <textarea
                    id={id}
                    className={textareaClass}
                    value={draft.media?.altText ?? ""}
                    onChange={(event) =>
                      draft.media &&
                      patch({ media: { ...draft.media, altText: event.target.value } })
                    }
                  />
                )}
              </Field>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              {hasOptions ? "Opsi, kunci, dan petunjuk" : "Jawaban"}
            </CardTitle>
            <CardDescription>
              {hasOptions
                ? "Centang kunci jawaban. Setiap pengecoh butuh petunjuk yang tidak membocorkan jawaban."
                : "Jawaban yang diterima untuk isian singkat."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasOptions ? (
              <ul className="space-y-4">
                {draft.options.map((option) => {
                  const isKey = draft.answerKey.includes(option.id);
                  return (
                    <li key={option.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <input
                          type={draft.answerType === "pg" ? "radio" : "checkbox"}
                          name="answer-key"
                          checked={isKey}
                          onChange={() => toggleKey(option.id)}
                          aria-label={`Opsi ${option.label} adalah kunci`}
                          className="size-5 accent-primary"
                        />
                        <span className="w-6 font-semibold">{option.label}</span>
                        <Input
                          value={option.text}
                          onChange={(event) => patchOption(option.id, { text: event.target.value })}
                          aria-label={`Teks opsi ${option.label}`}
                        />
                        {isKey && <Badge variant="success">Kunci</Badge>}
                      </div>
                      {!isKey && draft.answerType !== "bs" && (
                        <textarea
                          className={textareaClass}
                          value={option.hint ?? ""}
                          onChange={(event) => patchOption(option.id, { hint: event.target.value })}
                          aria-label={`Petunjuk untuk pengecoh ${option.label}`}
                          placeholder={`Petunjuk jika siswa memilih ${option.label}`}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <>
                <Field label="Kunci jawaban (answer_key)">
                  {(id) => (
                    <Input
                      id={id}
                      value={draft.answerKey[0] ?? ""}
                      onChange={(event) => patch({ answerKey: [event.target.value] })}
                    />
                  )}
                </Field>
                <Field label="Jawaban setara (equivalents)" hint="Satu per baris.">
                  {(id) => (
                    <textarea
                      id={id}
                      className={textareaClass}
                      value={draft.equivalents.join("\n")}
                      onChange={(event) =>
                        patch({ equivalents: event.target.value.split("\n").map((v) => v.trim()) })
                      }
                    />
                  )}
                </Field>
                <Field label="Toleransi (tolerance)" hint="Selisih yang masih dianggap benar.">
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      step="any"
                      className="max-w-40"
                      value={draft.tolerance ?? ""}
                      onChange={(event) =>
                        patch({
                          tolerance:
                            event.target.value === "" ? undefined : Number(event.target.value),
                        })
                      }
                    />
                  )}
                </Field>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Pembahasan</CardTitle>
          </CardHeader>
          <CardContent>
            <Field label="Pembahasan (explanation)">
              {(id) => (
                <textarea
                  id={id}
                  className={textareaClass}
                  value={draft.explanation}
                  onChange={(event) => patch({ explanation: event.target.value })}
                />
              )}
            </Field>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Validator</CardTitle>
            <CardDescription>Diperiksa ulang setiap kali formulir berubah.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {publishable ? (
              <p className="flex items-center gap-2 font-medium text-success">
                <CheckCircle2 className="size-5" aria-hidden />
                Semua pemeriksaan lolos
              </p>
            ) : (
              <ul className="space-y-3" aria-label="Masalah yang ditemukan">
                {issues.map((issue) => (
                  <li key={`${issue.rule}-${issue.message}`} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-3">
              <NotConnectedButton
                disabled={!publishable}
                description="Menerbitkan butir dihubungkan setelah database siap."
              >
                Terbitkan
              </NotConnectedButton>
              <NotConnectedButton
                variant="outline"
                description="Menyimpan butir dihubungkan setelah database siap."
              >
                Simpan draf
              </NotConnectedButton>
            </div>
            <p className="text-sm text-muted-foreground">
              Belum menyimpan apa pun. Perubahan hilang saat halaman ditutup.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
