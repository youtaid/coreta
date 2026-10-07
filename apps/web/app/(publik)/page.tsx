import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Layout,
  Pencil,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MathFormula } from "@/components/workspace/media/math-formula";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDevRoleLanding } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const benefits = [
  {
    icon: Pencil,
    title: "Ruang Coret Kertas Berpetak Asli",
    description:
      "Dirancang khusus untuk Apple Pencil di iPad dan S Pen di Samsung Galaxy Tab. Menuliskan perhitungan matematika terasa alami dan responsif tanpa distraksi.",
  },
  {
    icon: Layout,
    title: "Satu Layar Utuh Bebas Scroll (100dvh)",
    description:
      "Soal, diagram geometri, dan bidang coretan tampil berdampingan dalam satu layar. Siswa tidak perlu lagi bolak-balik scroll yang membuyarkan konsentrasi berhitung.",
  },
  {
    icon: BrainCircuit,
    title: "AI Menganalisis Langkah Coretan",
    description:
      "Bukan sekadar mencocokkan kunci jawaban akhir. AI membaca langkah coretan siswa untuk mendeteksi di mana letak kekeliruan konsep dan memberikan petunjuk pemahaman.",
  },
  {
    icon: Users,
    title: "Laporan Mingguan untuk Orang Tua",
    description:
      "Setiap Senin pagi, orang tua menerima laporan kemajuan penguasaan kompetensi anak di portal orang tua untuk memantau persiapan UTBK tanpa rasa cemas.",
  },
];

const steps = [
  {
    number: "01",
    title: "Terima Worksheet Mingguan",
    description:
      "Setiap minggu, siswa menerima 8 butir soal terkurasi bertahap (Tahap 0–8) yang memetakan kemampuan aljabar, geometri, dan pemodelan fungsi.",
  },
  {
    number: "02",
    title: "Buktikan & Coret di Layar Tablet",
    description:
      "Uraikan pembuktian rumus, gambar kurva parabola, atau eliminasi variabel langsung di kanvas digital berpetak 24px yang bebas lag.",
  },
  {
    number: "03",
    title: "Evaluasi Instan & Petunjuk Konsep",
    description:
      "Jawaban dinilai seketika oleh mesin penilaian deterministik, disusul petunjuk pengecoh terarah untuk butir yang belum tepat.",
  },
];

const faqs = [
  {
    question: "Perangkat apa saja yang didukung oleh Coreta?",
    answer:
      "Coreta diutamakan untuk tablet dengan stylus aktif: iPad (Apple Pencil) melalui browser Safari dan Samsung Galaxy Tab (S Pen) melalui browser Chrome. Coreta juga dapat diakses melalui laptop dan komputer desktop modern dengan input mouse atau drawing tablet.",
  },
  {
    question: "Bagaimana cara kerja uji coba gratis 7 hari?",
    answer:
      "Orang tua dapat mendaftarkan akun secara gratis tanpa perlu memasukkan informasi kartu kredit di awal. Siswa langsung mendapatkan akses penuh ke worksheet minggu pertama dan ruang coret digital. Jika cocok, langganan dapat dilanjutkan mulai dari Rp29.900 per bulan.",
  },
  {
    question: "Apakah kecerdasan buatan (AI) yang menentukan nilai anak saya?",
    answer:
      "Sama sekali tidak! Sesuai prinsip etika Coreta, penilaian skor dilakukan 100% oleh sistem penilaian deterministik berdasarkan kunci jawaban yang tervalidasi. AI hanya bertugas membaca langkah coretan untuk merumuskan petunjuk belajar personal, tidak pernah memengaruhi nilai akhir.",
  },
  {
    question: "Apakah Coreta mendukung soal cerita dengan bacaan panjang dan stimulus media?",
    answer:
      "Ya. Coreta memiliki tiga mode tata letak ruang kerja: Mode Standar, Mode Media (diagram vektor HD, tabel KaTeX, audio transkrip, video takarir), dan Mode Bacaan panjang (hingga 600 kata dengan scroll internal mandiri).",
  },
  {
    question: "Kapan laporan perkembangan belajar dikirimkan kepada orang tua?",
    answer:
      "Laporan mingguan terbit setiap hari Senin pagi di portal orang tua. Laporan memuat persentase penguasaan kompetensi, grafik keaktifan, topik yang memerlukan perhatian khusus, serta contoh coretan anak.",
  },
  {
    question: "Bagaimana perlindungan data pribadi dan privasi siswa di bawah umur?",
    answer:
      "Coreta mematuhi regulasi perlindungan data pribadi (UU PDP). Pendaftaran akun siswa memerlukan persetujuan orang tua melalui tautan verifikasi resmi. Data nama, email, dan coretan siswa dienkripsi dan tidak pernah diperjualbelikan kepada pihak ketiga.",
  },
];

export default async function Home({ searchParams }: HomePageProps) {
  const { peran } = await searchParams;
  const landing = getDevRoleLanding(peran);

  if (process.env.NODE_ENV === "development" && landing && landing !== "/") {
    redirect(`${landing}?peran=${Array.isArray(peran) ? peran[0] : peran}`);
  }

  return (
    <div className="flex flex-col gap-16 sm:gap-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-6 sm:pt-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 px-3 py-1 text-xs font-semibold tracking-wide uppercase shadow-2xs"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>Platform Worksheet Matematika TKA / UTBK dengan Ruang Coret</span>
          </Badge>

          <h1 className="font-heading max-w-4xl text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl sm:leading-tight lg:text-6xl">
            Kuasai Matematika UTBK dengan{" "}
            <span className="text-primary underline decoration-primary/40 underline-offset-8">
              Mencoret Langsung
            </span>{" "}
            di Layar Tablet
          </h1>

          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Lupakan tumpukan kertas buram yang mudah hilang. Di Coreta, setiap butir soal dilengkapi
            ruang coret digital berpetak, koreksi instan otomatis, dan analisis langkah berpikir
            oleh AI untuk mendeteksi letak kekeliruan konsep secara mendalam.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/daftar"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-touch gap-2 px-6 font-bold shadow-sm",
              )}
            >
              <span>Coba Gratis 7 Hari</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/belajar/kerjakan/demo-assignment"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-touch gap-2 px-5 font-semibold",
              )}
            >
              <Pencil className="size-4 text-primary" />
              <span>Coba Demo Ruang Kerja</span>
            </Link>

            <Link
              href="/harga"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "min-h-touch px-4 font-semibold text-muted-foreground hover:text-foreground",
              )}
            >
              <span>Lihat Paket Harga</span>
            </Link>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Tanpa perlu kartu kredit · Akses instan di iPad & Tablet Android · Batalkan kapan saja
          </p>

          {/* Interactive Hero Visual Mockup */}
          <div className="mt-12 w-full max-w-4xl rounded-2xl border border-border/80 bg-card p-3 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-destructive/80" />
                <span className="size-3 rounded-full bg-warning/80" />
                <span className="size-3 rounded-full bg-success/80" />
                <span className="ml-2 font-mono text-[11px] text-foreground">
                  Ruang Kerja Coreta — Mode Standar (100dvh)
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold">
                Tablet 1180 × 820
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-left">
              {/* Left Column: Problem & KaTeX */}
              <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-[10px]">
                    Soal 1 · Mahir
                  </Badge>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    MAT-SMA-ALJ-01
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  Diketahui fungsi kuadrat f(x) = 2x² - 4x + (k - 1). Jika grafik kurva memotong
                  sumbu-X di dua titik berlainan, tentukan batasan nilai k!
                </p>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-center dark:bg-primary/10">
                  <MathFormula
                    formula="D = b^2 - 4ac > 0 \implies (-4)^2 - 4(2)(k - 1) > 0"
                    displayMode
                  />
                </div>
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 font-medium text-primary flex items-center justify-between">
                    <span>A. k &lt; 3</span>
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/60 px-3 py-1.5 text-muted-foreground">
                    B. k &gt; 3
                  </div>
                </div>
              </div>

              {/* Right Column: Scratch Canvas simulation */}
              <div className="relative flex min-h-[220px] flex-col justify-between rounded-xl border border-border/60 bg-background p-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[11px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Pencil className="size-3 text-primary" />
                    <span>Area Coretan Siswa (Kotak 24px)</span>
                  </span>
                  <span className="font-mono text-[10px] text-success font-bold">
                    ✓ Terdeteksi Stylus
                  </span>
                </div>

                <div className="my-auto py-2 font-hand text-base sm:text-lg leading-relaxed text-ink space-y-1">
                  <p className="text-foreground/90">Langkah 1: b = -4, a = 2, c = k - 1</p>
                  <p className="text-foreground/90">16 - 8(k - 1) &gt; 0</p>
                  <p className="text-foreground/90">16 - 8k + 8 &gt; 0 ⇒ 24 &gt; 8k ⇒ k &lt; 3</p>
                </div>

                <div className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground border border-border/40">
                  <span>Petunjuk AI: Langkah diskriminan sudah benar!</span>
                  <span className="font-semibold text-primary">Tuntas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MANFAAT (VALUE PROPOSITIONS) */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
            Mengapa Coreta?
          </Badge>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Solusi Berpikir Matematis yang Diciptakan Khusus untuk Tablet
          </h2>
          <p className="text-sm text-muted-foreground">
            Bukan sekadar lembar soal PDF digital. Coreta menggabungkan presisi tinta stylus dengan
            kecerdasan sistem untuk melatih penalaran siswa.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <Card key={`benefit-${idx}`} className="flex flex-col justify-between">
                <CardContent className="p-6 space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. CARA KERJA (HOW IT WORKS) */}
      <section className="bg-muted/30 py-12 sm:py-16 border-y border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
              Alur Belajar
            </Badge>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Tiga Langkah Mudah Menguasai Tiap Kompetensi
            </h2>
            <p className="text-sm text-muted-foreground">
              Alur terstruktur yang membantu siswa membangun konsistensi latihan soal setiap minggu.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {steps.map((step, idx) => (
              <div
                key={`step-${idx}`}
                className="relative flex flex-col items-start rounded-xl border border-border/80 bg-card p-6 shadow-xs"
              >
                <span className="font-heading text-3xl font-extrabold text-primary/40 mb-2">
                  {step.number}
                </span>
                <h3 className="font-heading text-base font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/belajar/kerjakan/demo-assignment"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-touch gap-2 font-semibold",
              )}
            >
              <span>Jelajahi Demo Ruang Kerja Langsung</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. RAGAM MEDIA STIMULUS (Fase 12 Showcase Highlight) */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 via-card to-background p-6 sm:p-10 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <Badge variant="secondary" className="gap-1.5 text-xs font-semibold">
                <BookOpenCheck className="size-3.5 text-primary" />
                <span>Stimulus Soal Kaya & Multimodal</span>
              </Badge>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Mendukung Diagram Geometri, Tabel Data, Audio, hingga Video Simulasi
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Soal UTBK modern menuntut literasi visual dan numerasi terapan. Coreta dilengkapi
                panel media khusus dengan kontrol zoom gambar, tabel rumus KaTeX beresolusi tinggi,
                audio narasumber bertranskrip, serta video simulasi dengan takarir bahasa Indonesia.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline">Diagram Vektor HD</Badge>
                <Badge variant="outline">Tabel Rumus KaTeX</Badge>
                <Badge variant="outline">Audio + Transkrip</Badge>
                <Badge variant="outline">Video MP4 + Takarir CC</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-5 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="font-bold text-foreground">Uji Coba Langganan Terjangkau</span>
                <span className="text-primary font-semibold">Mulai Rp29.900/bln</span>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success shrink-0" />
                  <span>Akses penuh 8 butir worksheet mingguan berjenjang</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success shrink-0" />
                  <span>Petunjuk koreksi cerdas dari analisis coretan</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success shrink-0" />
                  <span>Laporan mingguan terperinci langsung ke orang tua</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/harga"
                  className={cn(buttonVariants({ size: "sm" }), "w-full min-h-touch font-bold")}
                >
                  <span>Bandingkan Pilihan Paket Harga</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ (PERTANYAAN YANG SERING DIAJUKAN) */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center space-y-2 mb-8">
          <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
            FAQ
          </Badge>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-sm text-muted-foreground">
            Semua hal yang perlu Anda ketahui tentang metode belajar, perangkat, dan langganan
            Coreta.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details
              key={`faq-${idx}`}
              className="group rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 open:border-primary/60 open:bg-card/90"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-foreground focus-visible:outline-2 focus-visible:outline-ring rounded-lg">
                <span className="pr-4">{faq.question}</span>
                <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 6. BOTTOM CTA BANNER */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center sm:p-12 sm:text-left sm:flex-row">
          <div className="space-y-2 max-w-xl">
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Siap Raih Skor Maksimal di UTBK Mendatang?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Mulai uji coba gratis 7 hari sekarang. Rasakan pengalaman mengerjakan matematika
              dengan ruang coret digital yang dirancang untuk mengasah pemahaman sejati.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/daftar"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-touch w-full sm:w-auto px-6 font-bold shadow-xs",
              )}
            >
              <span>Daftar Sekarang</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/masuk"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-touch w-full sm:w-auto px-5 font-semibold",
              )}
            >
              <span>Masuk Akun</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
