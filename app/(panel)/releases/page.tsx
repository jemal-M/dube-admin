"use client"

import { CheckIcon, CopyIcon, DownloadIcon, ExternalLinkIcon, ShieldAlertIcon, Trash2Icon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { UploadReleaseDialog } from "@/components/releases/upload-release-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useDeleteRelease, useReleases, useUpdateRelease } from "@/lib/api/queries"
import type { AppRelease, ReleaseFile } from "@/lib/api/types"
import { formatCount, formatDate } from "@/lib/format"

const ABI_LABEL: Record<ReleaseFile["abi"], string> = {
  "arm64-v8a": "arm64 · most phones",
  "armeabi-v7a": "32-bit ARM · older phones",
  x86_64: "x86_64 · emulators",
  universal: "Universal",
}

const BUILD_COMMAND =
  "cd mobile && flutter build apk --release --split-per-abi --target-platform android-arm,android-arm64 --obfuscate --split-debug-info=build/debug-info"

function useCopy() {
  const [copied, setCopied] = React.useState<string | null>(null)
  return {
    copied,
    copy: async (key: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value)
        setCopied(key)
        setTimeout(() => setCopied(null), 1500)
      } catch {
        toast.error("Copy failed — select and copy manually.")
      }
    },
  }
}

export default function ReleasesPage() {
  const { data, isPending, isError, error } = useReleases()
  const { copied, copy } = useCopy()
  const latest = data?.data.find((r) => r.published_at)

  return (
    <>
      <PageHeader
        title="App releases"
        description="ዱቤ is distributed outside Google Play. Upload signed APKs here; phones update from this list."
        actions={data && <UploadReleaseDialog maxMb={data.max_upload_mb} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Public download page</CardTitle>
            <CardDescription>Share this link (or print it as a QR code) for first-time installs.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs">{data?.download_page ?? "…"}</code>
            <Button variant="outline" size="sm" disabled={!data} onClick={() => data && copy("page", data.download_page)}>
              {copied === "page" ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={data?.download_page ?? "#"} target="_blank" rel="noreferrer" />}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Open
            </Button>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Live version</CardTitle>
            <CardDescription>What phones are offered now</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-7 w-32" />
            ) : latest ? (
              <p className="text-2xl font-semibold">
                {latest.version_name} <span className="text-sm font-normal text-muted-foreground">build {latest.build_number}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing published yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {isError && <p className="text-sm text-destructive">{error.message}</p>}
      {isPending && <Skeleton className="h-48 w-full" />}
      {data?.data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No releases yet. Build the APKs, then upload them here.
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        {data?.data.map((r) => (
          <ReleaseCard key={r.id} release={r} isLive={r.id === latest?.id} copy={copy} copied={copied} />
        ))}
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Building a release</CardTitle>
          <CardDescription>
            Bump <code>version: x.y.z+N</code> in <code>mobile/pubspec.yaml</code> (N must increase every release), then:
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-start gap-2">
          <code className="min-w-0 flex-1 rounded-md bg-muted px-2 py-1.5 text-xs break-all">{BUILD_COMMAND}</code>
          <Button variant="ghost" size="icon-sm" aria-label="Copy build command" onClick={() => copy("cmd", BUILD_COMMAND)}>
            {copied === "cmd" ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

function ReleaseCard({
  release: r,
  isLive,
  copy,
  copied,
}: {
  release: AppRelease
  isLive: boolean
  copy: (key: string, value: string) => void
  copied: string | null
}) {
  const update = useUpdateRelease()
  const remove = useDeleteRelease()
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const published = r.published_at !== null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {r.version_name}
          <span className="text-sm font-normal text-muted-foreground">build {r.build_number}</span>
          {published ? (
            <Badge className="bg-primary/10 text-primary">{isLive ? "Live" : "Published"}</Badge>
          ) : (
            <Badge variant="outline">Draft</Badge>
          )}
          {r.is_mandatory && (
            <Badge className="gap-1 bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
              <ShieldAlertIcon className="size-3" aria-hidden />
              Mandatory
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {published ? `Published ${formatDate(r.published_at!)}` : `Uploaded ${formatDate(r.created_at)}`}
          {r.created_by && ` by ${r.created_by}`} · {formatCount(r.downloads)} downloads
          {r.min_supported_build !== null && ` · requires build ≥ ${r.min_supported_build}`}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={r.is_mandatory}
              disabled={update.isPending}
              onCheckedChange={(v) => update.mutate({ id: r.id, is_mandatory: v })}
            />
            Mandatory
          </label>
          <Button
            size="sm"
            variant={published ? "outline" : "default"}
            disabled={update.isPending || r.files.length === 0}
            onClick={() =>
              update.mutate(
                { id: r.id, published: !published },
                {
                  onSuccess: () => toast.success(published ? `${r.version_name} unpublished` : `${r.version_name} is live`),
                  onError: (e) => toast.error(e.message),
                }
              )
            }
          >
            {published ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete release" onClick={() => setConfirmDelete(true)}>
            <Trash2Icon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {r.changelog && <p className="text-sm whitespace-pre-line text-muted-foreground">{r.changelog}</p>}
        <ul className="divide-y rounded-lg border text-sm">
          {r.files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
              <span className="w-52 font-medium">{ABI_LABEL[f.abi]}</span>
              <span className="text-muted-foreground tabular-nums">{(f.size / 1048576).toFixed(1)} MB</span>
              <span className="text-muted-foreground tabular-nums">{formatCount(f.downloads)} downloads</span>
              <button
                type="button"
                onClick={() => copy(`sha-${f.id}`, f.sha256)}
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
                title="Copy SHA-256"
              >
                {copied === `sha-${f.id}` ? "copied" : `sha256 ${f.sha256.slice(0, 12)}…`}
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                nativeButton={false}
                render={<a href={f.url} />}
                disabled={!published}
              >
                <DownloadIcon data-icon="inline-start" />
                APK
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete {r.version_name} (build {r.build_number})?
            </DialogTitle>
            <DialogDescription>
              {published
                ? "Phones will stop being offered this version and its download links will break."
                : "The uploaded APK files are removed from the server."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(r.id, {
                  onSuccess: () => {
                    toast.success(`Build ${r.build_number} deleted`)
                    setConfirmDelete(false)
                  },
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              Delete release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
