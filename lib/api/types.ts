/** All money values are integers in minor units (santim), exactly as the API sends them. */

export type Paginated<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export type AdminUser = {
  id: number
  name: string
  email: string
}

export type SubscriptionStatus = "trial" | "active" | "due" | "expired"

export type SubscriptionSummary = {
  status: SubscriptionStatus
  ends_at: string | null
  grace_ends_at: string | null
  /** Effective monthly price in santim. */
  monthly_fee: number
}

export type PaymentMethod = "cash" | "telebirr" | "cbe_birr" | "bank_transfer" | "other"

export type BillingConfig = {
  monthly_fee: number
  trial_days: number
  grace_days: number
  payment_methods: PaymentMethod[]
}

export type SubscriptionRow = {
  id: number
  name: string
  shop_name: string | null
  phone: string | null
  is_active: boolean
  subscription: SubscriptionSummary
  monthly_fee_is_custom: boolean
  last_paid_on: string | null
  total_paid: number
}

export type Payment = {
  id: number
  amount: number
  months: number
  method: PaymentMethod
  reference: string | null
  note: string | null
  period_start: string
  period_end: string
  paid_on: string
  recorded_by: string | null
  merchant?: { id: number; name: string; shop_name: string | null; phone: string | null }
}

export type PaymentsPage = Paginated<Payment> & {
  totals: { count: number; amount: number; months: number }
}

/** Platform KPIs only: no figures from merchants' books. */
export type Stats = {
  merchants_total: number
  merchants_active: number
  merchants_new_30d: number
  subscriptions: Record<SubscriptionStatus, number> & {
    revenue_30d: number
    revenue_prev_30d: number
    revenue_total: number
  }
  revenue_monthly: { month: string; amount: number }[]
}

export type Merchant = {
  id: number
  name: string
  shop_name: string | null
  email: string | null
  phone: string | null
  is_active: boolean
  /** Last time the merchant's app used its login (not derived from their ledger). */
  last_active_at: string | null
  created_at: string
  subscription: SubscriptionSummary
}

export type ReleaseFile = {
  id: number
  abi: "arm64-v8a" | "armeabi-v7a" | "x86_64" | "universal"
  version_code: number
  size: number
  sha256: string
  downloads: number
  url: string
}

export type AppRelease = {
  id: number
  build_number: number
  version_name: string
  changelog: string | null
  is_mandatory: boolean
  min_supported_build: number | null
  published_at: string | null
  created_at: string
  created_by: string | null
  downloads: number
  files: ReleaseFile[]
}

export type ReleasesResponse = {
  data: AppRelease[]
  package: string
  max_upload_mb: number
  download_page: string
}

// ---- Plans, payment accounts, payment review --------------------------------------

export type PlanPrice = { id?: number; months: number; price: number; discount_percent?: number }

export type Plan = {
  id: number
  name: string
  description: string | null
  monthly_price: number
  features: string[]
  is_active: boolean
  sort: number
  prices: PlanPrice[]
  merchant_count?: number
}

export type PaymentProvider = "cbe" | "telebirr" | "awash" | "boa" | "dashen" | "mpesa" | "other"

export type PaymentAccount = {
  id: number
  provider: PaymentProvider
  label: string
  account_name: string
  account_number: string
  instructions: string | null
  is_active: boolean
  sort: number
}

export type PaymentRequestStatus = "pending" | "approved" | "rejected"

export type PaymentRequestRow = {
  id: number
  status: PaymentRequestStatus
  months: number
  amount: number
  reference: string | null
  has_screenshot: boolean
  rejection_reason: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  plan: { id: number; name: string } | null
  account: { id: number; provider: PaymentProvider; label: string; account_number: string } | null
  merchant: { id: number; name: string; shop_name: string | null; phone: string | null; subscription: SubscriptionSummary } | null
}

export type PaymentRequestsPage = Paginated<PaymentRequestRow> & { pending_count: number }

// ---- Messaging ---------------------------------------------------------------------

export type Channel = "inapp" | "push" | "email" | "sms"

export type MessageTemplate = {
  id: number
  key: string | null
  name: string
  subject: string
  body: string
  sms_body: string | null
  channels: Channel[]
}

export type TemplatesResponse = { data: MessageTemplate[]; placeholders: string[]; channels: Channel[] }

export type Audience =
  | { type: "all" }
  | { type: "status"; status: SubscriptionStatus }
  | { type: "merchants"; ids: number[] }

export type AnnouncementRow = {
  id: number
  kind: "broadcast" | "system"
  title: string
  body: string
  channels: Channel[]
  audience: Audience
  template: { id: number; name: string; key: string | null } | null
  created_by: string | null
  sent_at: string | null
  recipient_count: number
  read_count: number
  email_sent: number
  sms_sent: number
  push_sent: number
  failed_count: number
}

export type AnnouncementDraft = {
  template_id?: number | null
  title: string
  body: string
  sms_body?: string | null
  channels: Channel[]
  audience: Audience
}

export type AnnouncementPreview = {
  recipient_count: number
  sample: { shop_name: string | null; title: string; body: string; sms: string } | null
}
