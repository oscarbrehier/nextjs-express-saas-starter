import type { Metadata } from "next";
import { Public_Sans, Courier_Prime } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GitHub Insights",
  description: "Visualize GitHub activity for any user or repo.",
};

/**
 * Inline, blocking, and tiny on purpose: reads the stored theme before first
 * paint so the report never flashes the wrong register.
 */
const THEME_INIT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

const DIRECTION_CONTRACT = `
THESIS: The dashboard is read, not skimmed — every GitHub profile renders as a lab report, refusing the generic indigo SaaS card-grid this category always ships.
OWN-WORLD: clinical paper ground, near-black ink, Public Sans for labels, Courier Prime tabular figures for every measured value, hairline reference-range brackets, one accent ink rationed to actions — never to grading a reading.
STORY: a reviewer reads a profile's vitals and sees each repo's health measured against real ranges, reported plainly rather than judged.
FIRST VIEWPORT: a patient-style intake header (avatar, identity, plain figures) atop a stacked list of repo report cards, each opening on a bordered score readout and a bracketed metric panel.
FORM: The Lab Report, IMPECCABLE'S PICK, seed key 0197f2bd. Revised via live steering post-finish: the verdict stamp and color-graded readings were replaced with a plain, ungraded readout (see DESIGN.md's "All-Rectilinear" and "Ungraded Reading" rules).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${publicSans.variable} ${courierPrime.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <div
          aria-hidden="true"
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }}
        />
        {children}
      </body>
    </html>
  );
}
