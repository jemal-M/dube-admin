import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"

import { MerchantDetail } from "./merchant-detail"

export const metadata: Metadata = { title: "Merchant" }

/**
 * Static export cannot prerender one page per merchant ID, so the ID travels as
 * `?id=`. useSearchParams must sit under Suspense so the shell still prerenders.
 */
export default function MerchantViewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <MerchantDetail />
    </Suspense>
  )
}
