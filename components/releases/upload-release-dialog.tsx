"use client"

import { FileUpIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/lib/api/client"
import { useUploadRelease } from "@/lib/api/queries"

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`

/**
 * Upload one build's APKs (usually arm64-v8a + armeabi-v7a from `--split-per-abi`).
 * The server reads version, package and CPU type from each APK, so nothing is typed by hand.
 */
export function UploadReleaseDialog({ maxMb }: { maxMb: number }) {
  const [open, setOpen] = React.useState(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [changelog, setChangelog] = React.useState("")
  const [mandatory, setMandatory] = React.useState(false)
  const [publish, setPublish] = React.useState(false)
  const [minBuild, setMinBuild] = React.useState("")
  const [progress, setProgress] = React.useState(0)
  const upload = useUploadRelease()
  const tooBig = files.find((f) => f.size > maxMb * 1048576)

  function reset() {
    setFiles([])
    setChangelog("")
    setMandatory(false)
    setPublish(false)
    setMinBuild("")
    setProgress(0)
    upload.reset()
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const picked = Array.from(list).filter((f) => f.name.toLowerCase().endsWith(".apk"))
    setFiles((current) => [...current.filter((c) => !picked.some((p) => p.name === c.name)), ...picked].slice(0, 4))
  }

  function submit() {
    upload.mutate(
      {
        apks: files,
        changelog: changelog.trim(),
        is_mandatory: mandatory,
        min_supported_build: minBuild.trim() === "" ? null : Number(minBuild),
        publish,
        onProgress: setProgress,
      },
      {
        onSuccess: (release) => {
          toast.success(
            `${release.version_name} (build ${release.build_number}) uploaded${release.published_at ? " and published" : " as draft"}.`
          )
          setOpen(false)
          reset()
        },
      }
    )
  }

  const errorText =
    upload.error instanceof ApiError
      ? (Object.values(upload.error.errors)[0]?.[0] ?? upload.error.message)
      : upload.error?.message

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (upload.isPending) return
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button />}>
        <UploadIcon data-icon="inline-start" />
        Upload release
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload release</DialogTitle>
          <DialogDescription>
            Add the APKs from one build. Version, package and CPU type are read from the files.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              addFiles(e.dataTransfer.files)
            }}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <FileUpIcon className="size-6 text-primary" />
            <span>
              Drop APKs here or <span className="font-medium text-primary">browse</span>
            </span>
            <span className="text-xs">app-arm64-v8a-release.apk, app-armeabi-v7a-release.apk · up to {maxMb} MB each</span>
            <input
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ""
              }}
            />
          </label>

          {files.length > 0 && (
            <ul className="divide-y rounded-lg border text-sm">
              {files.map((f) => (
                <li key={f.name} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{f.name}</span>
                  <span className={f.size > maxMb * 1048576 ? "text-destructive" : "text-muted-foreground"}>{mb(f.size)}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove ${f.name}`}
                    disabled={upload.isPending}
                    onClick={() => setFiles((c) => c.filter((x) => x !== f))}
                  >
                    <XIcon />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <Field>
            <FieldLabel htmlFor="changelog">What&apos;s new</FieldLabel>
            <textarea
              id="changelog"
              rows={3}
              maxLength={2000}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="Shown on the download page and in the update prompt."
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field orientation="horizontal" className="items-center justify-between rounded-lg border px-3 py-2">
              <FieldLabel htmlFor="mandatory">Mandatory update</FieldLabel>
              <Switch id="mandatory" checked={mandatory} onCheckedChange={setMandatory} />
            </Field>
            <Field orientation="horizontal" className="items-center justify-between rounded-lg border px-3 py-2">
              <FieldLabel htmlFor="publish">Publish now</FieldLabel>
              <Switch id="publish" checked={publish} onCheckedChange={setPublish} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="min-build">Minimum supported build</FieldLabel>
            <Input
              id="min-build"
              inputMode="numeric"
              value={minBuild}
              onChange={(e) => setMinBuild(e.target.value.replace(/\D/g, ""))}
              placeholder="Optional"
              className="w-32"
            />
            <FieldDescription>Phones on an older build are forced to update.</FieldDescription>
          </Field>
        </FieldGroup>

        {upload.isPending && (
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : "Checking APKs…"}
            </p>
          </div>
        )}
        {errorText && <p className="text-sm text-destructive">{errorText}</p>}
        {tooBig && <p className="text-sm text-destructive">{tooBig.name} is over {maxMb} MB.</p>}

        <DialogFooter>
          <Button onClick={submit} disabled={files.length === 0 || !!tooBig || upload.isPending}>
            {upload.isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            Upload {files.length > 0 ? `${files.length} APK${files.length > 1 ? "s" : ""}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
