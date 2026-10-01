import { describe, expect, test } from "bun:test";
import { beatsDuel, fmtPct, parseDuel } from "./meme";

const SKR = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";
const q = (s: string) => new URLSearchParams(s);

describe("trade duel link", () => {
  test("reads coin, result and name", () => {
    expect(parseDuel(q(`duel=${SKR}&pct=3.2&by=k7Qf`))).toEqual({ mint: SKR, pct: 0.032, name: "K7QF" });
  });

  test("a losing trade is still a duel", () => {
    expect(parseDuel(q(`duel=${SKR}&pct=-0.8`))).toEqual({ mint: SKR, pct: -0.008, name: "A FRIEND" });
  });

  test("no duel without a valid mint or a result", () => {
    expect(parseDuel(q("pct=3"))).toBeNull();
    expect(parseDuel(q("duel=not-a-mint&pct=3"))).toBeNull();
    expect(parseDuel(q(`duel=${SKR}`))).toBeNull();
    expect(parseDuel(q(`duel=${SKR}&pct=`))).toBeNull();
    expect(parseDuel(q(`duel=${SKR}&pct=lots`))).toBeNull();
  });

  test("the name is stripped to letters and digits and the result is clamped", () => {
    const d = parseDuel(q(`duel=${SKR}&pct=999999&by=<b>evil name</b>`));
    expect(d?.name).toBe("BEVILNAM");
    expect(d?.pct).toBe(10);
    expect(parseDuel(q(`duel=${SKR}&pct=-500`))?.pct).toBe(-1);
  });
});

describe("trade duel verdict", () => {
  test("strictly better wins, a tie leaves the challenger ahead", () => {
    expect(beatsDuel(0.04, 0.032)).toBe(true);
    expect(beatsDuel(0.032, 0.032)).toBe(false);
    expect(beatsDuel(-0.01, -0.008)).toBe(false);
  });

  test("results print with a sign and one decimal", () => {
    expect(fmtPct(0.032)).toBe("+3.2%");
    expect(fmtPct(-0.008)).toBe("-0.8%");
    expect(fmtPct(0)).toBe("+0.0%");
  });
});
