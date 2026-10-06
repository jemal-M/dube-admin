"use client"

import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Textarea } from "@/components/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/lib/api/client"
import { useDeletePlan, usePlans, useSavePlan } from "@/lib/api/queries"
import type { Plan } from "@/lib/api/types"
import { formatMoney, parseBirr } from "@/lib/format"

type Draft = {
  id?: number
  name: string
  description: string
  monthly: string
  features: string
  is_active: boolean
  prices: { months: string; price: string }[]
}

const birr = (santim: number) => (santim / 100).toString()

function toDraft(p?: Plan): Draft {
  return p
    ? {
        id: p.id,
        name: p.name,
        description: p.description ?? "",
        monthly: birr(p.monthly_price),
        features: p.features.join("\n"),
        is_active: p.is_active,
        prices: p.prices.map((x) => ({ months: String(x.months), price: birr(x.price) })),
      }
    : { name: "", description: "", monthly: "599", features: "", is_active: true, prices: [{ months: "1", price: "599" }] }
}

export default function PlansPage() {
  const { data, isPending } = usePlans()
  const [editing, setEditing] = React.useState<Draft | null>(null)

  return (
    <>
      <PageHeader
        title="Plans"
        description="What merchants pay. Change prices, add longer durations with a discount, or add a new plan any time."
        actions={
          <Button onClick={() => setEditing(toDraft())}>
            <PlusIcon data-icon="inline-start" />
            New plan
          </Button>
        }
      />
      {isPending && <Skeleton className="h-40 w-full" />}
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.map((p) => (
          <PlanCard key={p.id} plan={p} onEdit={() => setEditing(toDraft(p))} />
        ))}
      </div>
      {editing && <PlanDialog draft={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function PlanCard({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
  const remove = useDeletePlan()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {plan.name}
          {plan.is_active ? <Badge className="bg-primary/10 text-primary">Active</Badge> : <Badge variant="outline">Hidden</Badge>}
        </CardTitle>
        <CardDescription>
          {formatMoney(plan.monthly_price)} / month · {plan.merchant_count ?? 0} merchant{plan.merchant_count === 1 ? "" : "s"} on this plan
        </CardDescription>
        <CardAction className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Edit plan" onClick={onEdit}>
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete plan"
            onClick={() =>
              remove.mutate(plan.id, {
                onSuccess: () => toast.success(`${plan.name} deleted`),
                onError: (e) => toast.error(e.message),
              })
            }
          >
            <Trash2Icon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
        <ul className="divide-y rounded-lg border text-sm">
          {plan.prices.map((p) => (
            <li key={p.months} className="flex items-center justify-between px-3 py-2">
              <span>{p.months === 1 ? "1 month" : `${p.months} months`}</span>
              <span className="flex items-center gap-2 tabular-nums">
                {!!p.discount_percent && <Badge variant="secondary">−{p.discount_percent}%</Badge>}
                <span className="font-medium">{formatMoney(p.price)}</span>
              </span>
            </li>
          ))}
        </ul>
        {plan.features.length > 0 && (
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {plan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function PlanDialog({ draft: initial, onClose }: { draft: Draft; onClose: () => void }) {
  const [d, setD] = React.useState(initial)
  const save = useSavePlan()
  const monthly = parseBirr(d.monthly) ?? 0
  const errorText = save.error instanceof ApiError ? (Object.values(save.error.errors)[0]?.[0] ?? save.error.message) : save.error?.message

  function setPrice(i: number, patch: Partial<Draft["prices"][number]>) {
    setD((x) => ({ ...x, prices: x.prices.map((p, j) => (j === i ? { ...p, ...patch } : p)) }))
  }

  function submit() {
    const prices = d.prices
      .map((p) => ({ months: Number(p.months), price: parseBirr(p.price) }))
      .filter((p): p is { months: number; price: number } => p.months > 0 && p.price !== null)
    save.mutate(
      {
        id: d.id,
        name: d.name.trim(),
        description: d.description.trim() || null,
        monthly_price: monthly,
        features: d.features.split("\n").map((f) => f.trim()).filter(Boolean),
        is_active: d.is_active,
        sort: 0,
        prices,
      },
      {
        onSuccess: () => {
          toast.success(`${d.name} saved`)
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{d.id ? "Edit plan" : "New plan"}</DialogTitle>
          <DialogDescription>Prices apply to new payments; current subscriptions keep what they paid.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="plan-name">Name</FieldLabel>
              <Input id="plan-name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="plan-monthly">Monthly price (ETB)</FieldLabel>
              <Input id="plan-monthly" inputMode="decimal" value={d.monthly} onChange={(e) => setD({ ...d, monthly: e.target.value })} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="plan-desc">Description</FieldLabel>
            <Input id="plan-desc" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel>Durations merchants can buy</FieldLabel>
            <div className="space-y-2">
              {d.prices.map((p, i) => {
                const months = Number(p.months) || 0
                const price = parseBirr(p.price)
                const off = months && price !== null && monthly ? Math.round(100 - (price * 100) / (monthly * months)) : 0
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Input className="w-20" inputMode="numeric" value={p.months} onChange={(e) => setPrice(i, { months: e.target.value.replace(/\D/g, "") })} aria-label="Months" />
                    <span className="text-sm text-muted-foreground">months for ETB</span>
                    <Input className="w-32" inputMode="decimal" value={p.price} onChange={(e) => setPrice(i, { price: e.target.value })} aria-label="Total price" />
                    <span className="w-14 text-xs text-muted-foreground">{off > 0 ? `−${off}%` : ""}</span>
                    <Button variant="ghost" size="icon-xs" aria-label="Remove duration" onClick={() => setD({ ...d, prices: d.prices.filter((_, j) => j !== i) })}>
                      <Trash2Icon />
                    </Button>
                  </div>
                )
              })}
              <div className="flex flex-wrap gap-2">
                {[
                  ["Add 6 months −10%", 6, 0.9],
                  ["Add 12 months −20%", 12, 0.8],
                ].map(([label, m, f]) => (
                  <Button
                    key={label as string}
                    variant="outline"
                    size="sm"
                    disabled={d.prices.some((p) => Number(p.months) === m)}
                    onClick={() =>
                      setD({ ...d, prices: [...d.prices, { months: String(m), price: ((monthly * (m as number) * (f as number)) / 100).toFixed(0) }] })
                    }
                  >
                    {label as string}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setD({ ...d, prices: [...d.prices, { months: "", price: "" }] })}>
                  <PlusIcon data-icon="inline-start" />
                  Custom
                </Button>
              </div>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="plan-features">Features (one per line)</FieldLabel>
            <Textarea id="plan-features" rows={3} value={d.features} onChange={(e) => setD({ ...d, features: e.target.value })} />
            <FieldDescription>Shown to merchants on the subscription screen.</FieldDescription>
          </Field>
          <Field orientation="horizontal" className="items-center justify-between rounded-lg border px-3 py-2">
            <FieldLabel htmlFor="plan-active">Offered to merchants</FieldLabel>
            <Switch id="plan-active" checked={d.is_active} onCheckedChange={(v) => setD({ ...d, is_active: v })} />
          </Field>
        </FieldGroup>
        {errorText && <p className="text-sm text-destructive">{errorText}</p>}
        <DialogFooter>
          <Button onClick={submit} disabled={save.isPending || !d.name.trim() || d.prices.length === 0}>
            {save.isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Save plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
