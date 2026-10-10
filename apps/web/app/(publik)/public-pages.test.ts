import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

import ConsentPage from "./persetujuan/[token]/page";
import { ConsentView } from "./persetujuan/[token]/consent-view";
import RegisterPage from "./daftar/page";
import LoginPage from "./masuk/page";
import StudentLoginPage from "./masuk/siswa/page";
import Home from "./page";

vi.mock("server-only", () => ({}));

// Mock next/navigation for server/static tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ token: "demo-token-123" }),
  redirect: vi.fn(),
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "kunci-anon-uji";
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= "kunci-service-role-uji";
});

describe("Halaman Publik (Fase 19)", () => {
  describe("Home (Halaman Jual / Landing Page)", () => {
    it("renders hero section with primary CTAs, benefits, steps, and FAQs", async () => {
      const pageJsx = await Home({
        searchParams: Promise.resolve({}),
      });
      const html = renderToStaticMarkup(pageJsx);

      // Hero
      expect(html).toContain("Kuasai Matematika UTBK");
      expect(html).toContain("Coba Gratis 7 Hari");
      expect(html).toContain("Coba Demo Ruang Kerja");
      expect(html).toContain("Lihat Paket Harga");

      // Manfaat
      expect(html).toContain("Ruang Coret Kertas Berpetak Asli");
      expect(html).toContain("AI Menganalisis Langkah Coretan");

      // Cara Kerja
      expect(html).toContain("Terima Worksheet Mingguan");
      expect(html).toContain("Buktikan &amp; Coret di Layar Tablet");

      // FAQ
      expect(html).toContain("Pertanyaan yang Sering Diajukan");
      expect(html).toContain("Perangkat apa saja yang didukung oleh Coreta?");
    });
  });

  describe("LoginPage (/masuk)", () => {
    it("renders role selector tabs and essential authentication form inputs", async () => {
      const html = renderToStaticMarkup(
        await LoginPage({ searchParams: Promise.resolve({}), params: Promise.resolve({}) }),
      );
      expect(html).toContain("Masuk ke Coreta");
      expect(html).toContain("Orang Tua / Wali");
      expect(html).toContain("Siswa");
      expect(html).toContain("Kata Sandi");
      expect(html).toContain('name="email"');
      expect(html).toContain('name="password"');
      expect(html).toContain("Daftar gratis di sini");
      expect(html).not.toContain("Masuk dengan Google");
    });

    it("keeps the destination and explains why the user must sign in", async () => {
      const html = renderToStaticMarkup(
        await LoginPage({
          searchParams: Promise.resolve({ next: "/ortu/laporan" }),
          params: Promise.resolve({}),
        }),
      );
      expect(html).toContain('name="next" value="/ortu/laporan"');
      expect(html).toContain("Silakan masuk untuk membuka halaman itu.");
    });

    it("shows the Google button only when Google sign-in is enabled", async () => {
      process.env.AUTH_GOOGLE_ENABLED = "true";
      const html = renderToStaticMarkup(
        await LoginPage({ searchParams: Promise.resolve({}), params: Promise.resolve({}) }),
      );
      delete process.env.AUTH_GOOGLE_ENABLED;
      expect(html).toContain("Masuk dengan Google");
    });
  });

  describe("StudentLoginPage (/masuk/siswa)", () => {
    it("renders the login code and PIN fields without any email or Google option", async () => {
      process.env.AUTH_GOOGLE_ENABLED = "true";
      const html = renderToStaticMarkup(
        await StudentLoginPage({
          searchParams: Promise.resolve({ next: "/belajar/worksheet" }),
          params: Promise.resolve({}),
        }),
      );
      delete process.env.AUTH_GOOGLE_ENABLED;
      expect(html).toContain("Masuk sebagai Siswa");
      expect(html).toContain('name="code"');
      expect(html).toContain('name="pin"');
      expect(html).toContain('inputMode="numeric"');
      expect(html).toContain('name="next" value="/belajar/worksheet"');
      expect(html).not.toContain("Google");
      expect(html).not.toContain('type="email"');
    });
  });

  describe("RegisterPage (/daftar)", () => {
    it("renders parent information, exam target, and the versioned consent text", async () => {
      const html = renderToStaticMarkup(
        await RegisterPage({
          searchParams: Promise.resolve({ paket: "semester" }),
          params: Promise.resolve({}),
        }),
      );
      expect(html).toContain("Daftar Akun Orang Tua");
      expect(html).toContain("Informasi Orang Tua / Wali");
      expect(html).toContain("Target Ujian Anak");
      expect(html).toContain("Paket Semester");
      expect(html).toContain("persetujuan-v1-2026-10");
      expect(html).toContain("Penyimpanan Coretan Digital");
      expect(html).toContain('name="consent"');
      expect(html).toContain("Ketentuan Layanan");
      expect(html).toContain("Kebijakan Privasi");
      expect(html).toContain("Daftar &amp; Mulai Uji Coba Gratis");
    });
  });

  describe("ConsentPage (/persetujuan/[token])", () => {
    it("NEGATIF: a token that was not signed by the server shows an invalid-link page", async () => {
      const html = renderToStaticMarkup(
        await ConsentPage({
          params: Promise.resolve({ token: "demo-persetujuan" }),
          searchParams: Promise.resolve({}),
        }),
      );
      expect(html).toContain("Tautan Persetujuan Tidak Valid");
      expect(html).not.toContain("Setujui &amp; Aktifkan Akun Siswa");
    });

    it("renders the versioned consent text, parent data, and decision buttons", () => {
      const html = renderToStaticMarkup(
        createElement(ConsentView, {
          token: "tok.sig",
          version: "persetujuan-v1-2026-10",
          parentName: "Rina Wijaya",
          parentEmail: "r***@contoh.com",
          childrenList: [{ name: "Raka Wijaya", goal: "utbk" }],
          initialDecision: "pending",
        }),
      );
      expect(html).toContain("Persetujuan Wali: Pemrosesan Data Siswa");
      expect(html).toContain("Versi: persetujuan-v1-2026-10");
      expect(html).toContain("Rina Wijaya");
      expect(html).toContain("Raka Wijaya");
      expect(html).toContain("UTBK-SNBT");
      expect(html).toContain("Setujui &amp; Aktifkan Akun Siswa");
      expect(html).toContain("Tolak Izin");
    });

    it("shows the recorded decision instead of the buttons", () => {
      const html = renderToStaticMarkup(
        createElement(ConsentView, {
          token: "tok.sig",
          version: "persetujuan-v1-2026-10",
          parentName: "Rina Wijaya",
          parentEmail: "r***@contoh.com",
          childrenList: [],
          initialDecision: "approved",
        }),
      );
      expect(html).toContain("Persetujuan Tercatat");
      expect(html).toContain('href="/ortu/anak"');
      expect(html).not.toContain("Setujui &amp; Aktifkan Akun Siswa");
    });
  });
});
