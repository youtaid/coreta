import {
  SUBSCRIPTION_STATUSES,
  type SubscriptionAction,
  type SubscriptionStatus,
} from "@/lib/domain";

/**
 * Buttons offered for each status, primary action first. Rules behind them (TIP, phase 16 backend):
 * a trial needs no payment data, pausing lasts 1–4 weeks, cancelling keeps access until the period
 * ends, and a lapsed payment has a 3-day grace period before the subscription expires.
 */
const actionsByStatus: Record<SubscriptionStatus, readonly SubscriptionAction[]> = {
  trialing: ["subscribe"],
  active: ["change_plan", "pause", "cancel"],
  paused: ["resume", "cancel"],
  past_due: ["update_payment", "cancel"],
  canceled: ["reactivate"],
  expired: ["subscribe"],
};

export function getSubscriptionActions(status: SubscriptionStatus): readonly SubscriptionAction[] {
  return actionsByStatus[status];
}

export const subscriptionActionLabels: Record<SubscriptionAction, string> = {
  subscribe: "Pilih paket",
  change_plan: "Ganti paket",
  pause: "Jeda langganan",
  resume: "Lanjutkan sekarang",
  update_payment: "Perbarui metode bayar",
  cancel: "Batalkan langganan",
  reactivate: "Aktifkan kembali",
};

/** Reads a status from a query value; undefined when it is not one of the six statuses. */
export function parseSubscriptionStatus(
  value: string | string[] | undefined,
): SubscriptionStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return SUBSCRIPTION_STATUSES.find((status) => status === raw);
}
