"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { PaymentMethod, SubscriptionStatus } from "@/lib/api/types"

export type MerchantStatusFilter = "all" | "active" | "suspended"
export type SubscriptionStatusFilter = "all" | SubscriptionStatus
export type PaymentMethodFilter = "all" | PaymentMethod

type FiltersState = {
  merchants: { search: string; status: MerchantStatusFilter; page: number }
  setMerchantFilters: (patch: Partial<Omit<FiltersState["merchants"], "page">>) => void
  setMerchantPage: (page: number) => void
  subscriptions: { search: string; status: SubscriptionStatusFilter; page: number }
  payments: { merchantId: number | null; method: PaymentMethodFilter; from: string; to: string; page: number }
  setSubscriptionFilters: (patch: Partial<Omit<FiltersState["subscriptions"], "page">>) => void
  setSubscriptionPage: (page: number) => void
  setPaymentFilters: (patch: Partial<Omit<FiltersState["payments"], "page">>) => void
  setPaymentPage: (page: number) => void
}

/**
 * List filters live here (not in component state) so they survive navigating
 * to a detail page and back. Changing a filter always resets to page 1.
 * Kept in sessionStorage: per-tab, cleared when the tab closes.
 */
export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      merchants: { search: "", status: "all", page: 1 },
      setMerchantFilters: (patch) =>
        set((s) => ({ merchants: { ...s.merchants, ...patch, page: 1 } })),
      setMerchantPage: (page) => set((s) => ({ merchants: { ...s.merchants, page } })),
      subscriptions: { search: "", status: "all", page: 1 },
      payments: { merchantId: null, method: "all", from: "", to: "", page: 1 },
      setSubscriptionFilters: (patch) =>
        set((s) => ({ subscriptions: { ...s.subscriptions, ...patch, page: 1 } })),
      setSubscriptionPage: (page) => set((s) => ({ subscriptions: { ...s.subscriptions, page } })),
      setPaymentFilters: (patch) => set((s) => ({ payments: { ...s.payments, ...patch, page: 1 } })),
      setPaymentPage: (page) => set((s) => ({ payments: { ...s.payments, page } })),
    }),
    {
      name: "dube-admin-filters",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ merchants, subscriptions, payments }) => ({ merchants, subscriptions, payments }),
    }
  )
)
