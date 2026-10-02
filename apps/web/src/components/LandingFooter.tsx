import { Swimmer } from "@/components/SeaCast";
import { FooterMenu, type FooterItem } from "@/components/FooterMenu";

/**
 * The page ends on the console's own screen: its ink, its pixel type, its menu and its cast.
 * The wordmark sits flush on the bottom edge and the creatures swim along the top of the letters.
 */
export function LandingFooter({ repoUrl }: { repoUrl: string }) {
  const items: FooterItem[] = [
    { href: "/scrappyboy?net=devnet", label: "Play SCRAPPY BOY" },
    { href: "#film", label: "Watch the film" },
    { href: "#how", label: "How it works" },
    { href: "/scrappy.apk", label: "Get the Android app", download: true },
    { href: repoUrl, label: "Source on GitHub" },
    { href: "/privacy", label: "Privacy and keys" },
  ];

  return (
    <footer id="menu" className="relative mt-3 bg-[#0e091c] text-[#f4f1ff]">
      {/* waterline: the floor rises in pixel steps instead of a ruled edge */}
      <svg aria-hidden className="absolute bottom-full left-0 block h-[18px] w-full translate-y-px" shapeRendering="crispEdges">
        <defs>
          <pattern id="footer-swell" width="72" height="18" patternUnits="userSpaceOnUse">
            <path d="M0 12h72v6h-72zM18 6h54v6h-54zM36 0h18v6h-18z" fill="#0e091c" />
          </pattern>
        </defs>
        <rect width="100%" height="18" fill="url(#footer-swell)" />
      </svg>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-[1.4fr_1fr] lg:gap-6 lg:pb-12">
        <div>
          <h2 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-[1.04] tracking-[-0.01em]">Your turn.</h2>
          <p style={{ maxWidth: "24rem" }} className="mt-5 text-[16px] leading-relaxed text-[#a79fc9]">
            scrappypet is the home of SCRAPPY BOY, a pocket arcade built on Solana. Free to play. Your wallet approves every trade.
          </p>
        </div>
        <FooterMenu items={items} />
      </div>

      {/* 11 glyphs, each 1em wide with a 1/8em gap on its right: the left pad re-centres the word */}
      <div aria-hidden className="relative select-none overflow-hidden whitespace-nowrap pl-[0.125em] pt-[0.75em] text-center font-[family-name:var(--font-pressstart)] text-[8.5vw] leading-none">
        <div className="relative mx-auto w-[11em]">
          <div className="hero-pet absolute bottom-full left-[0.5em] w-[0.75em]">
            <Swimmer who="shelly" className="w-full" />
          </div>
          <div className="hero-pet absolute bottom-full left-[4.6em] w-[0.75em]" style={{ animationDuration: "5.2s", animationDelay: "0.8s" }}>
            <Swimmer who="finn" className="w-full" />
          </div>
          <div className="hero-pet absolute bottom-full left-[7.75em] w-[0.5em]" style={{ animationDuration: "7s", animationDelay: "0.3s" }}>
            <Swimmer who="jelly" className="w-full" />
          </div>
          <div className="hero-pet absolute bottom-full left-[9.6em] w-[0.75em]" style={{ animationDuration: "5.8s", animationDelay: "1.2s" }}>
            <Swimmer who="zip" flip className="w-full" />
          </div>
          {/* the face keeps 1/8em under the baseline: pull it out so the letters stand on the edge */}
          <span className="-mb-[0.125em] block">SCRAPPY BOY</span>
        </div>
      </div>
    </footer>
  );
}
