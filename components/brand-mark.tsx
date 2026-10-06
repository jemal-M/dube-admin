import Image from "next/image"

import { cn } from "@/lib/utils"

/** The ዱቤ app icon (public/logo.png, generated from the brand artwork). */
export function BrandMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt="ዱቤ"
      width={512}
      height={512}
      priority={priority}
      className={cn("size-8 shrink-0 rounded-lg", className)}
    />
  )
}
