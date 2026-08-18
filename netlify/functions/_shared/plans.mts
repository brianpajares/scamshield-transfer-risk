export const checkoutPlans = {
  FULL_REPORT: {
    id: "FULL_REPORT",
    title: "Escudo Transferencia - Reporte completo",
    amount: 14.9,
    currency: "PEN",
    mode: "payment"
  },
  PLUS: {
    id: "PLUS",
    title: "Escudo Transferencia - Plus mensual",
    amount: 29.9,
    currency: "PEN",
    mode: "subscription"
  }
} as const;

export type CheckoutPlanId = keyof typeof checkoutPlans;

export function getCheckoutPlan(planId: string) {
  return checkoutPlans[planId as CheckoutPlanId] || null;
}
