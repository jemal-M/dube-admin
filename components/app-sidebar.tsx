"use client"

import {
  BadgeCheckIcon,
  CreditCardIcon,
  FileTextIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  ReceiptIcon,
  SmartphoneIcon,
  StoreIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { BrandMark } from "@/components/brand-mark"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const NAV_GROUPS = [
  {
    label: "Platform",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
      { href: "/merchants/", label: "Merchants", icon: StoreIcon },
    ],
  },
  {
    label: "Billing",
    items: [
      { href: "/subscriptions/", label: "Subscriptions", icon: CreditCardIcon },
      { href: "/payment-review/", label: "Payment review", icon: BadgeCheckIcon },
      { href: "/payments/", label: "Payments", icon: ReceiptIcon },
      { href: "/plans/", label: "Plans", icon: LayersIcon },
      { href: "/payment-accounts/", label: "Payment accounts", icon: LandmarkIcon },
    ],
  },
  {
    label: "Messaging",
    items: [
      { href: "/announcements/", label: "Announcements", icon: MegaphoneIcon },
      { href: "/templates/", label: "Templates", icon: FileTextIcon },
    ],
  },
  {
    label: "Distribution",
    items: [{ href: "/releases/", label: "App releases", icon: SmartphoneIcon }],
  },
] as const

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/\/$/, "")))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <BrandMark priority />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold text-primary">ዱቤ</span>
                <span className="truncate text-xs text-muted-foreground">Admin console</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton isActive={isActive(href)} tooltip={label} render={<Link href={href} />}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
