const whole = new Intl.NumberFormat("en", { maximumFractionDigits: 0 })
const exact = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" })

/** Minor units (santim) → "ETB 1,500" / "ETB 1,500.50" / "−ETB 200" (customer paid in advance). */
export function formatMoney(minor: number): string {
  const abs = Math.abs(minor)
  const body = abs % 100 === 0 ? whole.format(abs / 100) : exact.format(abs / 100)
  return `${minor < 0 ? "−" : ""}ETB ${body}`
}

/** Minor units split for display: a small "ETB" prefix next to a large figure. */
export function moneyParts(minor: number): { currency: string; amount: string } {
  const [, sign, amount] = /^(−?)ETB (.*)$/.exec(formatMoney(minor))!
  return { currency: "ETB", amount: `${sign}${amount}` }
}

/** Minor units → "ETB 12.9K" for tiles and axis ticks. */
export const formatMoneyCompact = (minor: number) => `ETB ${compact.format(minor / 100)}`

/** "+251911234567" → "0911 234 567", the way Ethiopian merchants write numbers. */
export function formatPhone(e164: string): string {
  const m = /^\+251([79]\d{8})$/.exec(e164)
  if (!m) return e164
  const local = `0${m[1]}`
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
}

export const formatCount = (n: number) => compact.format(n)

export const formatDate = (iso: string) => dateFmt.format(new Date(iso))

export const formatShortDate = (iso: string) => shortDate.format(new Date(iso))

export function formatRelative(iso: string | null): string {
  if (!iso) return "Never"
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  if (minutes < 43_200) return `${Math.round(minutes / 1440)}d ago`
  return formatDate(iso)
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  telebirr: "Telebirr",
  cbe_birr: "CBE Birr",
  bank_transfer: "Bank transfer",
  other: "Other",
}

/** "in 12 days" / "today" / "3 days ago" — for subscription end dates. */
export function formatDueIn(iso: string | null): string {
  if (!iso) return "—"
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days === 0) return "today"
  if (days > 0) return days === 1 ? "tomorrow" : `in ${days} days`
  return days === -1 ? "yesterday" : `${-days} days ago`
}

/** Birr string typed by an admin ("1,500.50") → santim, or null if invalid. */
export function parseBirr(input: string): number | null {
  const n = Number(input.replace(/,/g, "").trim())
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}

/** Mirrors SubscriptionService::recordPayment: extends from the later of now and the current end. */
export function extensionPeriod(endsAt: string | null, months: number): { start: Date; end: Date } {
  const now = new Date()
  const current = endsAt ? new Date(endsAt) : now
  const start = current > now ? current : now
  const end = new Date(start)
  const day = end.getDate()
  end.setMonth(end.getMonth() + months)
  if (end.getDate() < day) end.setDate(0) // no overflow: Jan 31 + 1 month → Feb 28/29
  return { start, end }
}

export const PROVIDER_LABELS: Record<string, string> = {
  cbe: "CBE",
  telebirr: "Telebirr",
  awash: "Awash Bank",
  boa: "Bank of Abyssinia",
  dashen: "Dashen Bank",
  mpesa: "M-Pesa",
  other: "Other",
}

export const CHANNEL_LABELS: Record<string, string> = { inapp: "In-app", push: "Push", email: "Email", sms: "SMS" }
