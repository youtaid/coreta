import { z } from "zod";

/**
 * Bentuk uuid apa pun yang diterima Postgres (8-4-4-4-12 heksadesimal). z.uuid() lebih ketat
 * (memeriksa bit versi RFC 9562) dan menolak id seed md5 (`seedUuid`), padahal itu id sah di
 * basis data. Dipakai untuk id yang dikirim balik dari browser.
 */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const uuidLike = (message = "Id tidak valid.") => z.string().regex(UUID_PATTERN, message);
