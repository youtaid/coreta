import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InvoiceList } from "../../components/domain/invoice-list";
import { PriceCard } from "../../components/domain/price-card";
import { SUBSCRIPTION_STATUSES } from "../domain";
import { getSubscriptionActions, parseSubscriptionStatus } from "../subscription";
import { getPlan, invoices, plans, subscriptionViews } from "./billing";

describe("plans", () => {
  it("matches the phase 16 prices", () => {
    expect(plans.map((p) => [p.id, p.price, p.strikePrice])).toEqual([
      ["monthly", 29_900, undefined],
      ["semester", 149_000, 179_400],
      ["annual", 249_000, 358_800],
    ]);
  });

  it("shows a strike-through price only on plans that have one", () => {
    const html = (id: "monthly" | "semester" | "annual") =>
      renderToStaticMarkup(
        createElement(PriceCard, { ...getPlan(id), ctaLabel: "Coba", ctaHref: "/daftar" }),
      );
    expect(html("monthly")).not.toMatch(/<s[ >]/);
    expect(html("semester")).toContain("Rp179.400");
    expect(html("annual")).toContain("Rp358.800");
  });
});

describe("subscriptionViews", () => {
  it("covers all six statuses, each describing itself", () => {
    expect(Object.keys(subscriptionViews).sort()).toEqual([...SUBSCRIPTION_STATUSES].sort());
    for (const status of SUBSCRIPTION_STATUSES) {
      const view = subscriptionViews[status];
      expect(view.status).toBe(status);
      expect(view.summary.length).toBeGreaterThan(30);
      expect(view.facts.length).toBeGreaterThan(0);
      expect(() => getPlan(view.planId)).not.toThrow();
    }
  });

  it("has no payment method during the trial, as the free trial asks for no payment data", () => {
    expect(subscriptionViews.trialing.paymentMethod).toBeNull();
    expect(subscriptionViews.active.paymentMethod).not.toBeNull();
  });
});

describe("getSubscriptionActions", () => {
  it.each([
    ["trialing", ["subscribe"]],
    ["active", ["change_plan", "pause", "cancel"]],
    ["paused", ["resume", "cancel"]],
    ["past_due", ["update_payment", "cancel"]],
    ["canceled", ["reactivate"]],
    ["expired", ["subscribe"]],
  ] as const)("%s → %j", (status, expected) => {
    expect(getSubscriptionActions(status)).toEqual(expected);
  });

  it("never offers pause or plan changes outside an active subscription", () => {
    for (const status of SUBSCRIPTION_STATUSES.filter((s) => s !== "active")) {
      expect(getSubscriptionActions(status)).not.toContain("pause");
      expect(getSubscriptionActions(status)).not.toContain("change_plan");
    }
  });
});

describe("parseSubscriptionStatus", () => {
  it("accepts the six statuses and rejects anything else", () => {
    expect(parseSubscriptionStatus("past_due")).toBe("past_due");
    expect(parseSubscriptionStatus(["paused", "active"])).toBe("paused");
    expect(parseSubscriptionStatus("hacked")).toBeUndefined();
    expect(parseSubscriptionStatus(undefined)).toBeUndefined();
  });
});

describe("InvoiceList", () => {
  const html = renderToStaticMarkup(createElement(InvoiceList, { invoices }));

  it("lists every invoice with its amount", () => {
    expect(html.match(/<li /g)).toHaveLength(invoices.length);
    for (const invoice of invoices) expect(html).toContain(invoice.number);
    expect(html).toContain("Rp149.000");
    expect(html).toContain("Rp29.900");
  });

  it("offers a PDF only for paid and refunded invoices", () => {
    const withPdf = invoices.filter((i) => i.status === "paid" || i.status === "refunded");
    expect(html.match(/Unduh PDF/g)).toHaveLength(withPdf.length * 2); // aria-label + text
  });
});
