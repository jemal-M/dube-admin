"use client"

import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApiError } from "@/lib/api/client"
import { useDeletePaymentAccount, usePaymentAccounts, useSavePaymentAccount } from "@/lib/api/queries"
import type { PaymentAccount, PaymentProvider } from "@/lib/api/types"
import { PROVIDER_LABELS } from "@/lib/format"

const PROVIDERS = Object.entries(PROVIDER_LABELS).map(([value, label]) => ({ value: value as PaymentProvider, label }))

export default function PaymentAccountsPage() {
  const { data, isPending } = usePaymentAccounts()
  const save = useSavePaymentAccount()
  const remove = useDeletePaymentAccount()
  const [editing, setEditing] = React.useState<Partial<PaymentAccount> | null>(null)

  return (
    <>
      <PageHeader
        title="Payment accounts"
        description="Where merchants send their subscription payment. Active accounts appear as tabs in the app's pay screen."
        actions={
          <Button onClick={() => setEditing({ provider: "cbe", label: "CBE", is_active: true })}>
            <PlusIcon data-icon="inline-start" />
            Add account
          </Button>
        }
      />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Tab label</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Account name</TableHead>
              <TableHead>Account number</TableHead>
              <TableHead>Shown</TableHead>
              <TableHead className="pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && (
              <TableRow>
                <TableCell colSpan={6} className="px-4">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            )}
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No accounts yet. Merchants can&apos;t pay in the app until you add one.
                </TableCell>
              </TableRow>
            )}
            {data?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="pl-4 font-medium">{a.label}</TableCell>
                <TableCell>{PROVIDER_LABELS[a.provider]}</TableCell>
                <TableCell>{a.account_name}</TableCell>
                <TableCell className="font-mono">{a.account_number}</TableCell>
                <TableCell>
                  <Switch
                    checked={a.is_active}
                    onCheckedChange={(v) => save.mutate({ id: a.id, is_active: v }, { onError: (e) => toast.error(e.message) })}
                    aria-label={`Show ${a.label} to merchants`}
                  />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setEditing(a)}>
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    onClick={() => remove.mutate(a.id, { onSuccess: () => toast.success(`${a.label} removed`) })}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {data && !data.some((a) => a.is_active) && data.length > 0 && (
        <Badge variant="outline" className="text-destructive">No account is shown — merchants can&apos;t pay in the app.</Badge>
      )}
      {editing && <AccountDialog initial={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function AccountDialog({ initial, onClose }: { initial: Partial<PaymentAccount>; onClose: () => void }) {
  const [a, setA] = React.useState(initial)
  const save = useSavePaymentAccount()
  const err = save.error instanceof ApiError ? (Object.values(save.error.errors)[0]?.[0] ?? save.error.message) : save.error?.message

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{a.id ? "Edit account" : "Add account"}</DialogTitle>
          <DialogDescription>Double-check the number: merchants copy it straight into their banking app.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Provider</FieldLabel>
              <Select
                items={PROVIDERS}
                value={a.provider}
                onValueChange={(v) => v && setA({ ...a, provider: v as PaymentProvider, label: a.label || PROVIDER_LABELS[v] })}
              >
                <SelectTrigger className="w-full" aria-label="Provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="acc-label">Tab label</FieldLabel>
              <Input id="acc-label" value={a.label ?? ""} onChange={(e) => setA({ ...a, label: e.target.value })} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="acc-name">Account holder name</FieldLabel>
            <Input id="acc-name" value={a.account_name ?? ""} onChange={(e) => setA({ ...a, account_name: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="acc-number">Account / phone number</FieldLabel>
            <Input id="acc-number" className="font-mono" value={a.account_number ?? ""} onChange={(e) => setA({ ...a, account_number: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="acc-instr">Extra instructions (optional)</FieldLabel>
            <Input id="acc-instr" value={a.instructions ?? ""} onChange={(e) => setA({ ...a, instructions: e.target.value })} />
          </Field>
        </FieldGroup>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <DialogFooter>
          <Button
            disabled={save.isPending}
            onClick={() =>
              save.mutate(a, {
                onSuccess: () => {
                  toast.success("Account saved")
                  onClose()
                },
              })
            }
          >
            {save.isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
