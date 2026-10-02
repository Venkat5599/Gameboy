"use client";

import { useState } from "react";

export type FooterItem = { href: string; label: string; download?: boolean };

const ROW = 44; // px, one menu row; the cursor steps by this

/** The footer's links, set as the console's own menu: one cursor, it follows hover and keyboard focus. */
export function FooterMenu({ items }: { items: FooterItem[] }) {
  const [at, setAt] = useState(0);
  return (
    <nav aria-label="Footer" className="relative font-[family-name:var(--font-vt323)] text-[28px] leading-none" onMouseLeave={() => setAt(0)}>
      <svg
        viewBox="0 0 4 7"
        aria-hidden
        shapeRendering="crispEdges"
        className="menu-cursor pointer-events-none absolute left-0 top-0 w-[10px] fill-[#ffae45]"
        style={{ height: ROW, transform: `translateY(${at * ROW}px)`, transition: "transform 110ms steps(3, end)" }}
      >
        <path d="M0 0h1v7h-1zM1 1h1v5h-1zM2 2h1v3h-1zM3 3h1v1h-1z" />
      </svg>
      <ul>
        {items.map((it, i) => (
          <li key={it.href} className="max-w-none">
            <a
              href={it.href}
              download={it.download}
              onMouseEnter={() => setAt(i)}
              onFocus={() => setAt(i)}
              style={{ height: ROW }}
              className={`flex items-center pl-7 uppercase tracking-[0.04em] outline-none transition-colors duration-100 focus-visible:text-[#ffae45] ${
                i === at ? "text-[#f4f1ff]" : "text-[#a79fc9]"
              }`}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
