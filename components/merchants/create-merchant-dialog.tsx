"use client"

import { Loader2Icon, PlusIcon } from "lucide-react"
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
import { ApiError } from "@/lib/api/client"
import { type NewMerchant, useCreateMerchant } from "@/lib/api/queries"

const FIELDS: { name: keyof NewMerchant; label: string; type?: string; hint?: string }[] = [
  { name: "shop_name", label: "Shop name", hint: "Shown in customers' SMS reminders." },
  { name: "name", label: "Owner name" },
  { name: "email", label: "Login email", type: "email" },
  { name: "password", label: "Temporary PIN", type: "password", hint: "6–12 digits (the app uses a number keypad). Share it with the merchant securely." },
]

export function CreateMerchantDialog() {
  const [open, setOpen] = React.useState(false)
  const create = useCreateMerchant()
  const fieldError = (name: string) => (create.error instanceof ApiError ? create.error.firstError(name) : undefined)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget)) as NewMerchant
    create.mutate(data, {
      onSuccess: (merchant) => {
        toast.success(`${merchant.shop_name ?? merchant.name} can now sign in on the mobile app.`)
        setOpen(false)
        create.reset()
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) create.reset()
      }}
    >
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Add merchant
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add merchant</DialogTitle>
          <DialogDescription>Creates the account the merchant uses to sign in on the mobile app.</DialogDescription>
        </DialogHeader>
        <form id="create-merchant" onSubmit={onSubmit}>
          <FieldGroup>
            {FIELDS.map((f) => {
              const error = fieldError(f.name)
              return (
                <Field key={f.name} data-invalid={!!error || undefined}>
                  <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
                  <Input
                    id={f.name}
                    name={f.name}
                    type={f.type ?? "text"}
                    required
                    aria-invalid={!!error || undefined}
                    {...(f.name === "password" && { inputMode: "numeric", pattern: "\\d{6,12}", maxLength: 12 })}
                  />
                  {error ? <FieldError>{error}</FieldError> : f.hint && <FieldDescription>{f.hint}</FieldDescription>}
                </Field>
              )
            })}
          </FieldGroup>
        </form>
        {create.error && !(create.error instanceof ApiError && create.error.status === 422) && (
          <p className="text-sm text-destructive">{create.error.message}</p>
        )}
        <DialogFooter>
          <Button type="submit" form="create-merchant" disabled={create.isPending}>
            {create.isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Create merchant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
