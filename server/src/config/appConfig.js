/**
 * Central business configuration — every tunable number (commission,
 * discount cap, subscription plans, trial period, OTP, currency) is read
 * from `.env` so it can be changed WITHOUT touching the code.
 *
 * See `server/.env.example` for the documented list of variables.
 */

const toNum = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const config = {
  /* Doctor commission -------------------------------------------------- */
  // Commission % applied to a doctor when none is set on their profile.
  defaultCommissionPercent: clamp(toNum(process.env.DEFAULT_COMMISSION_PERCENT, 10), 0, 100),

  /* Billing ------------------------------------------------------------- */
  // Maximum discount (as % of the invoice amount) a report may carry.
  maxDiscountPercent: clamp(toNum(process.env.MAX_DISCOUNT_PERCENT, 50), 0, 100),
  // Currency symbol used in seeded settings / receipts.
  currencySymbol: process.env.CURRENCY_SYMBOL || '₹',

  /* Subscription plans --------------------------------------------------- */
  trialDays: clamp(toNum(process.env.TRIAL_DAYS, 7), 1, 365),
  monthlyPlanPrice: Math.max(0, toNum(process.env.MONTHLY_PLAN_PRICE, 799)),
  monthlyPlanDays: clamp(toNum(process.env.MONTHLY_PLAN_DAYS, 30), 1, 366),
  yearlyPlanPrice: Math.max(0, toNum(process.env.YEARLY_PLAN_PRICE, 7999)),
  yearlyPlanDays: clamp(toNum(process.env.YEARLY_PLAN_DAYS, 365), 1, 731),

  /* Auth ------------------------------------------------------------------ */
  // Internal OTP used by the current production-style challenge flow.
  internalOtp: String(process.env.INTERNAL_OTP || '123456'),
};

/** Safe subset exposed to the app via GET /api/config (never the OTP). */
function publicConfig() {
  return {
    defaultCommissionPercent: config.defaultCommissionPercent,
    maxDiscountPercent: config.maxDiscountPercent,
    currencySymbol: config.currencySymbol,
    trialDays: config.trialDays,
    plans: {
      monthly: { price: config.monthlyPlanPrice, days: config.monthlyPlanDays },
      yearly: { price: config.yearlyPlanPrice, days: config.yearlyPlanDays },
    },
  };
}

module.exports = { ...config, publicConfig };
