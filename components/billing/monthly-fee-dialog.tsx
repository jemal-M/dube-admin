"use client"

import { Loader2Icon, PencilIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useBillingConfig, useUpdateMerchant } from "@/lib/api/queries"
import { formatMoney, parseBirr } from "@/lib/format"

/** Per-merchant price override (e.g. a negotiated rate); empty resets to the platform default. */
export function MonthlyFeeDialog({ merchantId, currentFee }: { merchantId: number; currentFee: number }) {
  const [open, setOpen] = React.useState(false)
  const config = useBillingConfig()
  const update = useUpdateMerchant()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = String(new FormData(event.currentTarget).get("fee") ?? "").trim()
    const fee = raw === "" ? null : parseBirr(raw)
    if (raw !== "" && fee === null) return
    update.mutate(
      { id: merchantId, monthly_fee: fee },
      {
        onSuccess: (m) => {
          toast.success(`Monthly fee set to ${formatMoney(m.subscription.monthly_fee)}`)
          setOpen(false)
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Edit monthly fee" />}>
        <PencilIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Monthly fee</DialogTitle>
          <DialogDescription>Applies to payments recorded from now on.</DialogDescription>
        </DialogHeader>
        <form id={`fee-${merchantId}`} onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`fee-input-${merchantId}`}>Amount per month (ETB)</FieldLabel>
              <Input
                id={`fee-input-${merchantId}`}
                name="fee"
                inputMode="decimal"
                defaultValue={(currentFee / 100).toString()}
              />
              <FieldDescription>
                Leave empty to use the platform default
                {config.data ? ` (${formatMoney(config.data.monthly_fee)})` : ""}.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form={`fee-${merchantId}`} disabled={update.isPending}>
            {update.isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
