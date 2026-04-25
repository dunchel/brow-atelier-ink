"use client";

import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <AdminGuard>{children}</AdminGuard>;
}
