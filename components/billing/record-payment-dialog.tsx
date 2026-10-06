"use client"

import { Loader2Icon, ReceiptIcon } from "lucide-react"
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiError } from "@/lib/api/client"
import { useBillingConfig, useRecordPayment } from "@/lib/api/queries"
import type { PaymentMethod, SubscriptionSummary } from "@/lib/api/types"
import { extensionPeriod, formatDate, formatMoney, PAYMENT_METHOD_LABELS, parseBirr } from "@/lib/format"

const MONTH_OPTIONS = [1, 2, 3, 6, 12].map((m) => ({ value: String(m), label: m === 1 ? "1 month" : `${m} months` }))

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Records a manual payment (cash, Telebirr, bank …) and extends the subscription.
 * The amount defaults to monthly fee × months but stays editable for discounts.
 */
export function RecordPaymentDialog({
  merchant,
  trigger,
}: {
  merchant: { id: number; name: string; shop_name: string | null; subscription: SubscriptionSummary }
  trigger?: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  const [months, setMonths] = React.useState("1")
  const [amount, setAmount] = React.useState("")
  const [amountTouched, setAmountTouched] = React.useState(false)
  const [method, setMethod] = React.useState<PaymentMethod>("cash")
  const config = useBillingConfig()
  const record = useRecordPayment(merchant.id)

  const fee = merchant.subscription.monthly_fee
  const suggested = ((fee * Number(months)) / 100).toFixed(2).replace(/\.00$/, "")
  const shownAmount = amountTouched ? amount : suggested
  const period = extensionPeriod(merchant.subscription.ends_at, Number(months))
  const fieldError = (name: string) => (record.error instanceof ApiError ? record.error.firstError(name) : undefined)
  const name = merchant.shop_name ?? merchant.name

  function reset() {
    setMonths("1")
    setAmount("")
    setAmountTouched(false)
    setMethod("cash")
    record.reset()
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const santim = parseBirr(shownAmount)
    if (santim === null) return
    record.mutate(
      {
        months: Number(months),
        amount: santim,
        method,
        reference: String(form.get("reference") ?? "").trim() || undefined,
        note: String(form.get("note") ?? "").trim() || undefined,
        paid_on: String(form.get("paid_on") ?? "") || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(`${formatMoney(santim)} recorded for ${name}. Paid until ${formatDate(res.subscription.ends_at!)}.`)
          setOpen(false)
          reset()
        },
      }
    )
  }

  const methods = (config.data?.payment_methods ?? ["cash", "telebirr", "cbe_birr", "bank_transfer", "other"]).map(
    (m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] ?? m })
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={trigger ?? <Button size="sm" />}>
        <ReceiptIcon data-icon="inline-start" />
        Record payment
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {name} · {formatMoney(fee)} / month
          </DialogDescription>
        </DialogHeader>
        <form id={`payment-${merchant.id}`} onSubmit={onSubmit}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Months</FieldLabel>
                <Select items={MONTH_OPTIONS} value={months} onValueChange={(v) => v && setMonths(v)}>
                  <SelectTrigger className="w-full" aria-label="Months">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field data-invalid={!!fieldError("amount") || undefined}>
                <FieldLabel htmlFor={`amount-${merchant.id}`}>Amount (ETB)</FieldLabel>
                <Input
                  id={`amount-${merchant.id}`}
                  inputMode="decimal"
                  value={shownAmount}
                  onChange={(e) => {
                    setAmountTouched(true)
                    setAmount(e.target.value)
                  }}
                  aria-invalid={parseBirr(shownAmount) === null || undefined}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Method</FieldLabel>
              <Select items={methods} value={method} onValueChange={(v) => v && setMethod(v as PaymentMethod)}>
                <SelectTrigger className="w-full" aria-label="Payment method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!fieldError("reference") || undefined}>
                <FieldLabel htmlFor={`reference-${merchant.id}`}>Reference</FieldLabel>
                <Input id={`reference-${merchant.id}`} name="reference" placeholder="Txn ID / receipt no." maxLength={120} />
              </Field>
              <Field data-invalid={!!fieldError("paid_on") || undefined}>
                <FieldLabel htmlFor={`paid-on-${merchant.id}`}>Paid on</FieldLabel>
                <Input id={`paid-on-${merchant.id}`} name="paid_on" type="date" defaultValue={today()} max={today()} />
                {fieldError("paid_on") && <FieldError>{fieldError("paid_on")}</FieldError>}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor={`note-${merchant.id}`}>Note</FieldLabel>
              <Input id={`note-${merchant.id}`} name="note" placeholder="Optional" maxLength={255} />
              <FieldDescription>
                Extends the subscription from {formatDate(period.start.toISOString())} to{" "}
                <span className="font-medium text-foreground">{formatDate(period.end.toISOString())}</span>.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        {record.error && !(record.error instanceof ApiError && record.error.status === 422) && (
          <p className="text-sm text-destructive">{record.error.message}</p>
        )}
        <DialogFooter>
          <Button type="submit" form={`payment-${merchant.id}`} disabled={record.isPending || parseBirr(shownAmount) === null}>
            {record.isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Record {parseBirr(shownAmount) !== null ? formatMoney(parseBirr(shownAmount)!) : "payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
