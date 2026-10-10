// Database types generated from the Supabase schema (TIP Fase 34).
// Regenerate after every migration: pnpm --filter @coreta/db gen:types
export type {
  CompositeTypes,
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./types";

// Masuk siswa dengan kode + PIN (TIP Fase 36), dipakai server web dan generator seed.
export {
  derivePinPassword,
  formatLoginCode,
  generateLoginCode,
  isValidPin,
  isWeakPin,
  LOGIN_CODE_ALPHABET,
  LOGIN_CODE_LENGTH,
  normalizeLoginCode,
  PIN_LENGTH,
  STUDENT_EMAIL_DOMAIN,
  studentAuthEmail,
} from "./student-login";
