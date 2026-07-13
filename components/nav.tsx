"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "דשבורד" },
  { href: "/contacts", label: "אנשי קשר" },
  { href: "/tasks", label: "משימות" },
  { href: "/deals", label: "עסקאות" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-4">
        <Link href="/">
          <Image src="/logo.png" alt="מור פארמה" width={180} height={65} priority />
        </Link>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  pathname === link.href
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            התנתקות
          </Button>
        </div>
      </div>
    </header>
  );
}
