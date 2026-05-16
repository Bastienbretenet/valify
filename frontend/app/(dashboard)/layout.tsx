"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authLogout } from "@/lib/api";

const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/settings/tokens", label: "API Tokens" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await authLogout().catch(console.error);
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-border flex flex-col bg-surface-muted">
        <div className="px-5 py-4 border-b border-border">
          <span className="font-semibold text-base tracking-tight">Valify</span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-text hover:bg-border"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-md text-sm text-text-muted hover:bg-border transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
