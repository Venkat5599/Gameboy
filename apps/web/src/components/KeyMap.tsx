"use client";

import { useState } from "react";

type Key = "A" | "B";

const ROWS: { key: Key; verb: string; means: string }[] = [
  { key: "A", verb: "cast net", means: "put money in the pool" },
  { key: "A", verb: "collect", means: "take the coins it earned" },
  { key: "B", verb: "recentre", means: "move the net to the price" },
  { key: "B", verb: "pull in", means: "take your money back out" },
  { key: "A", verb: "buy coin", means: "an actual coin, on Solana" },
];

/** What each button does: press a key (hover, focus or tap) and its moves light up. */
export function KeyMap() {
  const [down, setDown] = useState<Key>("A");
  return (
    <div className="rounded-3xl bg-[#0e091c] p-6 text-[#f4f1ff] sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-bold">What each button does</h3>
        <div className="flex gap-3">
          {(["B", "A"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={down === k}
              aria-label={`Show what ${k} does`}
              onMouseEnter={() => setDown(k)}
              onFocus={() => setDown(k)}
              onClick={() => setDown(k)}
              className={`grid size-12 place-items-center rounded-full bg-[#6e54ff] font-display text-[15px] font-bold text-white outline-none transition-[transform,box-shadow] duration-100 focus-visible:ring-2 focus-visible:ring-[#ffae45] ${
                down === k ? "translate-y-[3px] shadow-[0_0_0_rgba(58,42,158,0.55)]" : "shadow-[0_3px_0_rgba(58,42,158,0.9)]"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-5 font-[family-name:var(--font-vt323)] text-[22px] leading-none sm:text-[23px]">
        {ROWS.map((r) => {
          const lit = r.key === down;
          return (
            <li key={r.verb} style={{ maxWidth: "none" }} className={`grid grid-cols-[1.4rem_6.2rem_1fr] items-center gap-x-2 py-[7px] transition-colors duration-100 ${lit ? "text-[#f4f1ff]" : "text-[#8f86b3]"}`}>
              <span className={lit ? "text-[#ffae45]" : ""}>{r.key}</span>
              <span className="uppercase">{r.verb}</span>
              <span>{r.means}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[14px] text-[#a79fc9]">Trades are approved in your own wallet.</p>
    </div>
  );
}
