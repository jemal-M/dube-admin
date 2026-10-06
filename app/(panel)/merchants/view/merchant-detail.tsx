"use client"

import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { MerchantBilling } from "@/components/billing/merchant-billing"
import { StatTile } from "@/components/dashboard/stat-tile"
import { StatusBadge } from "@/components/merchants/status-badge"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useMerchant, useUpdateMerchant } from "@/lib/api/queries"
import { formatDate, formatPhone, formatRelative } from "@/lib/format"

export function MerchantDetail() {
  const raw = useSearchParams().get("id")
  const id = raw && /^\d+$/.test(raw) ? Number(raw) : null

  const { data: merchant, isPending, isError, error } = useMerchant(id)
  const update = useUpdateMerchant()
  const [confirmSuspend, setConfirmSuspend] = React.useState(false)

  if (id === null || isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Merchant not found</CardTitle>
          <CardDescription>{isError ? error.message : "This link is missing a merchant ID."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" nativeButton={false} render={<Link href="/merchants/" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to merchants
          </Button>
        </CardContent>
      </Card>
    )
  }

  function setActive(isActive: boolean) {
    if (!merchant) return
    update.mutate(
      { id: merchant.id, is_active: isActive },
      {
        onSuccess: (m) =>
          toast.success(isActive ? `${m.shop_name ?? m.name} reactivated` : `${m.shop_name ?? m.name} suspended and signed out`),
        onError: (e) => toast.error(e.message),
      }
    )
    setConfirmSuspend(false)
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" nativeButton={false} render={<Link href="/merchants/" />}>
        <ArrowLeftIcon data-icon="inline-start" />
        Merchants
      </Button>

      <PageHeader
        title={isPending ? <Skeleton className="h-8 w-56" /> : (merchant.shop_name ?? merchant.name)}
        description={
          merchant && (
            <span className="inline-flex flex-wrap items-center gap-2">
              {merchant.name} · {merchant.email} · joined {formatDate(merchant.created_at)}
              <StatusBadge active={merchant.is_active} />
            </span>
          )
        }
        actions={
          merchant && (
            <>
              <label className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
                <Switch
                  checked={merchant.is_active}
                  disabled={update.isPending}
                  onCheckedChange={(checked) => (checked ? setActive(true) : setConfirmSuspend(true))}
                />
                Active
              </label>
            </>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Phone" value={merchant && (merchant.phone ? formatPhone(merchant.phone) : "—")} loading={isPending} />
        <StatTile label="App last active" value={merchant && formatRelative(merchant.last_active_at)} loading={isPending} />
        <StatTile label="Joined" value={merchant && formatDate(merchant.created_at)} loading={isPending} />
      </div>

      {merchant ? <MerchantBilling merchant={merchant} /> : <Skeleton className="h-56 w-full" />}

      <Dialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend {merchant?.shop_name ?? merchant?.name}?</DialogTitle>
            <DialogDescription>
              All of this merchant&apos;s devices are signed out immediately and cannot sync until you reactivate
              the account. Their local data on the phone is not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={() => setActive(false)}>
              Suspend merchant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
