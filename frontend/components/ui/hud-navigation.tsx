"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function HudNavigation() {
  const pathname = usePathname();

  const navItems = [
    { label: "WORK", href: "/dashboard" },
    { label: "CONTACT", href: "/account" },
  ];

  return (
    <nav
      className="fixed top-6 right-6 z-40 pointer-events-auto"
      aria-label="Main navigation"
    >
      <div className="at-pill flex items-center gap-1 px-5 py-2.5">
        {navItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <Link
              href={item.href}
              className="relative px-5 py-2 text-[11px] font-bold tracking-widest uppercase transition-all duration-300 font-mono"
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
              {pathname === item.href && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-0.5 bg-gradient-to-r from-transparent via-[#7c4dff] to-transparent rounded-full"
                />
              )}
            </Link>
            {index < navItems.length - 1 && (
              <div
                className="w-px h-8 bg-gradient-to-b from-transparent via-white/15 to-transparent"
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}