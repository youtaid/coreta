import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import ConsentPage from "./persetujuan/[token]/page";
import RegisterPage from "./daftar/page";
import LoginPage from "./masuk/page";
import Home from "./page";

// Mock next/navigation for server/static tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ token: "demo-token-123" }),
  redirect: vi.fn(),
}));

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
    it("renders role selector tabs and essential authentication form inputs", () => {
      const html = renderToStaticMarkup(createElement(LoginPage));
      expect(html).toContain("Masuk ke Coreta");
      expect(html).toContain("Orang Tua / Wali");
      expect(html).toContain("Siswa");
      expect(html).toContain("Kata Sandi");
      expect(html).toContain("Daftar gratis di sini");
    });
  });

  describe("RegisterPage (/daftar)", () => {
    it("renders parent information, student profile, and terms agreement fields", () => {
      const html = renderToStaticMarkup(createElement(RegisterPage));
      expect(html).toContain("Daftar Akun Orang Tua");
      expect(html).toContain("Informasi Orang Tua / Wali");
      expect(html).toContain("Profil Awal Siswa (Anak)");
      expect(html).toContain("Ketentuan Layanan");
      expect(html).toContain("Kebijakan Privasi");
      expect(html).toContain("Daftar &amp; Mulai Uji Coba Gratis");
    });
  });

  describe("ConsentPage (/persetujuan/[token])", () => {
    it("renders parental consent verification token and permission details", () => {
      const html = renderToStaticMarkup(createElement(ConsentPage));
      expect(html).toContain("Persetujuan Wali: Pemrosesan Data Siswa");
      expect(html).toContain("Token: demo-token-123");
      expect(html).toContain("Budi Pratama");
      expect(html).toContain("Setujui &amp; Aktifkan Akun Siswa");
      expect(html).toContain("Tolak Izin");
    });
  });
});
