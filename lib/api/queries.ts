"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, uploadWithProgress } from "@/lib/api/client"
import type {
  AnnouncementDraft,
  AnnouncementPreview,
  AnnouncementRow,
  AppRelease,
  BillingConfig,
  MessageTemplate,
  PaymentAccount,
  PaymentRequestRow,
  PaymentRequestsPage,
  PaymentRequestStatus,
  Plan,
  TemplatesResponse,
  Merchant,
  Paginated,
  Payment,
  PaymentMethod,
  PaymentsPage,
  ReleasesResponse,
  Stats,
  SubscriptionRow,
  SubscriptionSummary,
} from "@/lib/api/types"
import type {
  MerchantStatusFilter,
  PaymentMethodFilter,
  SubscriptionStatusFilter,
} from "@/lib/stores/filters-store"

/** TanStack Query owns server data (cache, refetch, pagination); Zustand owns client state. */
export const queryKeys = {
  stats: ["stats"] as const,
  merchants: (f: object) => ["merchants", f] as const,
  merchant: (id: number) => ["merchant", id] as const,
  billingConfig: ["billing-config"] as const,
  releases: ["releases"] as const,
  subscriptions: (f: object) => ["subscriptions", f] as const,
  payments: (f: object) => ["payments", f] as const,
  merchantPayments: (id: number, page: number) => ["merchant", id, "payments", page] as const,
}

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats, queryFn: () => api<Stats>("admin/stats") })
}

export function useMerchants(filters: { search: string; status: MerchantStatusFilter; page: number }) {
  return useQuery({
    queryKey: queryKeys.merchants(filters),
    queryFn: () =>
      api<Paginated<Merchant>>("admin/merchants", {
        query: {
          search: filters.search,
          status: filters.status === "all" ? null : filters.status,
          page: filters.page,
        },
      }),
    placeholderData: keepPreviousData,
  })
}

export function useMerchant(id: number | null) {
  return useQuery({
    queryKey: queryKeys.merchant(id ?? 0),
    queryFn: () => api<Merchant>(`admin/merchants/${id}`),
    enabled: id !== null,
  })
}

export type NewMerchant = { name: string; shop_name: string; email: string; password: string }

export function useCreateMerchant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewMerchant) => api<Merchant>("admin/merchants", { method: "POST", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchants"] })
      qc.invalidateQueries({ queryKey: ["subscriptions"] })
      qc.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

export function useUpdateMerchant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number
      name?: string
      shop_name?: string
      is_active?: boolean
      /** Santim per month; null resets to the platform default. */
      monthly_fee?: number | null
    }) =>
      api<Merchant>(`admin/merchants/${id}`, { method: "PATCH", body: data }),
    onSuccess: (merchant) => {
      qc.setQueryData(queryKeys.merchant(merchant.id), merchant)
      qc.invalidateQueries({ queryKey: ["merchants"] })
      qc.invalidateQueries({ queryKey: ["subscriptions"] })
      qc.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

// ---- Billing ------------------------------------------------------------------

export function useBillingConfig() {
  return useQuery({
    queryKey: queryKeys.billingConfig,
    queryFn: () => api<BillingConfig>("admin/billing/config"),
    staleTime: Infinity,
  })
}

export function useSubscriptions(filters: { search: string; status: SubscriptionStatusFilter; page: number }) {
  return useQuery({
    queryKey: queryKeys.subscriptions(filters),
    queryFn: () =>
      api<Paginated<SubscriptionRow>>("admin/subscriptions", {
        query: { search: filters.search, status: filters.status === "all" ? null : filters.status, page: filters.page },
      }),
    placeholderData: keepPreviousData,
  })
}

export function usePayments(filters: {
  merchantId: number | null
  method: PaymentMethodFilter
  from: string
  to: string
  page: number
}) {
  return useQuery({
    queryKey: queryKeys.payments(filters),
    queryFn: () =>
      api<PaymentsPage>("admin/payments", {
        query: {
          merchant_id: filters.merchantId,
          method: filters.method === "all" ? null : filters.method,
          from: filters.from,
          to: filters.to,
          page: filters.page,
        },
      }),
    placeholderData: keepPreviousData,
  })
}

export function useMerchantPayments(id: number | null, page: number) {
  return useQuery({
    queryKey: queryKeys.merchantPayments(id ?? 0, page),
    queryFn: () => api<Paginated<Payment>>(`admin/merchants/${id}/payments`, { query: { page } }),
    enabled: id !== null,
    placeholderData: keepPreviousData,
  })
}

export type NewPayment = {
  months: number
  amount: number
  method: PaymentMethod
  reference?: string
  note?: string
  paid_on?: string
}

export function useRecordPayment(merchantId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewPayment) =>
      api<{ payment: Payment; subscription: SubscriptionSummary }>(`admin/merchants/${merchantId}/payments`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      // A payment changes the merchant, both billing lists and the dashboard.
      for (const key of [["merchant", merchantId], ["merchants"], ["subscriptions"], ["payments"], queryKeys.stats]) {
        qc.invalidateQueries({ queryKey: key })
      }
    },
  })
}

// ---- App releases (APK manager) ----------------------------------------------------

export function useReleases() {
  return useQuery({ queryKey: queryKeys.releases, queryFn: () => api<ReleasesResponse>("admin/releases") })
}

export type ReleaseUpload = {
  apks: File[]
  changelog: string
  is_mandatory: boolean
  min_supported_build: number | null
  publish: boolean
  onProgress: (fraction: number) => void
}

export function useUploadRelease() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ apks, changelog, is_mandatory, min_supported_build, publish, onProgress }: ReleaseUpload) => {
      const form = new FormData()
      apks.forEach((f) => form.append("apks[]", f))
      if (changelog) form.append("changelog", changelog)
      form.append("is_mandatory", is_mandatory ? "1" : "0")
      if (min_supported_build !== null) form.append("min_supported_build", String(min_supported_build))
      form.append("publish", publish ? "1" : "0")
      return uploadWithProgress<AppRelease>("admin/releases", form, onProgress)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.releases }),
  })
}

export function useUpdateRelease() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number
      published?: boolean
      is_mandatory?: boolean
      changelog?: string | null
      min_supported_build?: number | null
    }) => api<AppRelease>(`admin/releases/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.releases }),
  })
}

export function useDeleteRelease() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`admin/releases/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.releases }),
  })
}

// ---- Plans --------------------------------------------------------------------------

export function usePlans() {
  return useQuery({ queryKey: ["plans"], queryFn: () => api<Plan[]>("admin/plans") })
}

export type PlanInput = Omit<Plan, "id" | "prices" | "merchant_count"> & { prices: { months: number; price: number }[] }

export function useSavePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: PlanInput & { id?: number }) =>
      id ? api<Plan>(`admin/plans/${id}`, { method: "PATCH", body: data }) : api<Plan>("admin/plans", { method: "POST", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] })
      qc.invalidateQueries({ queryKey: ["subscriptions"] })
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`admin/plans/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  })
}

// ---- Payment accounts ---------------------------------------------------------------

export function usePaymentAccounts() {
  return useQuery({ queryKey: ["payment-accounts"], queryFn: () => api<PaymentAccount[]>("admin/payment-accounts") })
}

export function useSavePaymentAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<PaymentAccount> & { id?: number }) =>
      id
        ? api<PaymentAccount>(`admin/payment-accounts/${id}`, { method: "PATCH", body: data })
        : api<PaymentAccount>("admin/payment-accounts", { method: "POST", body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-accounts"] }),
  })
}

export function useDeletePaymentAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`admin/payment-accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-accounts"] }),
  })
}

// ---- Payment review -----------------------------------------------------------------

export function usePaymentRequests(status: PaymentRequestStatus | "all", page: number) {
  return useQuery({
    queryKey: ["payment-requests", status, page],
    queryFn: () => api<PaymentRequestsPage>("admin/payment-requests", { query: { status, page } }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}

export function useReviewPaymentRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: "approve" | "reject"; reason?: string }) =>
      api<PaymentRequestRow>(`admin/payment-requests/${id}/${action}`, { method: "POST", body: reason ? { reason } : {} }),
    onSuccess: () => {
      for (const key of [["payment-requests"], ["subscriptions"], ["payments"], ["merchants"], ["merchant"], queryKeys.stats]) {
        qc.invalidateQueries({ queryKey: key })
      }
    },
  })
}

// ---- Messaging ----------------------------------------------------------------------

export function useTemplates() {
  return useQuery({ queryKey: ["message-templates"], queryFn: () => api<TemplatesResponse>("admin/message-templates") })
}

export function useSaveTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MessageTemplate> & { id?: number }) =>
      id
        ? api<MessageTemplate>(`admin/message-templates/${id}`, { method: "PATCH", body: data })
        : api<MessageTemplate>("admin/message-templates", { method: "POST", body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message-templates"] }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`admin/message-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message-templates"] }),
  })
}

export function useAnnouncements(page: number) {
  return useQuery({
    queryKey: ["announcements", page],
    queryFn: () => api<Paginated<AnnouncementRow>>("admin/announcements", { query: { page } }),
    placeholderData: keepPreviousData,
  })
}

export function usePreviewAnnouncement() {
  return useMutation({
    mutationFn: (draft: AnnouncementDraft) => api<AnnouncementPreview>("admin/announcements/preview", { method: "POST", body: draft }),
  })
}

export function useSendAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draft: AnnouncementDraft) =>
      api<{ id: number; recipient_count: number }>("admin/announcements", { method: "POST", body: draft }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  })
}
