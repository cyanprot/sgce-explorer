import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ProteinStructure3D } from "@/components/ProteinStructure3D";
import { CentralDogma } from "@/components/CentralDogma";
import { ImprintingPanel } from "@/components/ImprintingPanel";
import { ResearchPanel } from "@/components/ResearchPanel";
import { VariantsPanel } from "@/components/variants";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { COLORS } from "@/constants/protein-data";
import { VARIANT_CATALOG } from "@/constants/variant-catalog";
import { useVariantStore } from "@/store/variantStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Disclaimer } from "@/components/ui/Disclaimer";
import type { TabId } from "@/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "structure", label: "3D Structure" },
  { id: "variants", label: "Variants" },
  { id: "dogma", label: "Central Dogma" },
  { id: "imprinting", label: "Imprinting" },
  { id: "research", label: "Research" },
];

/**
 * Read tab + variant out of the query string.
 *
 * Called from a useState initializer rather than an effect: an effect-based read
 * races the effect that writes the URL back, and the write ran first with
 * pre-hydration state. That worked only by declaration order, and it dropped
 * `?tab=` from every incoming deep link.
 */
function readUrl() {
  const p = new URLSearchParams(window.location.search);
  const t = p.get("tab");
  const v = p.get("v");
  const found = v ? VARIANT_CATALOG.find((x) => x.id === v) : undefined;
  return {
    tab: t && TABS.some((x) => x.id === t) ? (t as TabId) : ("structure" as TabId),
    found,
    // A ?v= that matched nothing in this snapshot. Kept so the UI can say so
    // rather than silently showing the site author's variant under a clean URL.
    unresolved: v && !found ? v : null,
  };
}

export default function App() {
  const [initial] = useState(readUrl);
  const [tab, setTab] = useState<TabId>(initial.tab);
  const [unresolvedVariant, setUnresolvedVariant] = useState<string | null>(initial.unresolved);
  const appliedRef = useRef(false);
  if (!appliedRef.current) {
    appliedRef.current = true;
    if (initial.found) useVariantStore.getState().setSelected(initial.found);
  }
  const headerRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const variant = useVariantStore((s) => s.selected);

  // WAI-ARIA tabs: Left/Right/Home/End move focus + selection (automatic activation).
  const onTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const last = TABS.length - 1;
    let next = idx;
    if (e.key === "ArrowRight") next = idx === last ? 0 : idx + 1;
    else if (e.key === "ArrowLeft") next = idx === 0 ? last : idx - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const applyHeight = (h: number) => {
      document.documentElement.style.setProperty("--app-header-h", `${h}px`);
    };
    applyHeight(el.getBoundingClientRect().height);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) applyHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Publish the fixed Nav's real height. Every layout here assumed a flat 80px,
  // but the Nav is 98px unscrolled and 68px scrolled, so `main` underlapped it by
  // ~18px at scroll 0 and the tab panels were sized against the wrong number.
  //
  // Deliberately a DOM query rather than a prop: Nav lives in the brand-chrome
  // zone, which is mirrored from the `arcivus` repo, so this reads it without
  // modifying it.
  useLayoutEffect(() => {
    const nav = document.querySelector("nav");
    if (!nav) return;
    const apply = () =>
      document.documentElement.style.setProperty(
        "--app-nav-h",
        `${nav.getBoundingClientRect().height}px`,
      );
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(apply);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    document.title = "Arcivus Explorer — SGCE ε-Sarcoglycan";
  }, []);

  // Keep the active tab visible in the horizontally scrolling tab strip. On a
  // 390px viewport the strip overflows, so arriving at ?tab=research showed no
  // active tab at all — the indicator was scrolled off to the right.
  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === tab);
    tabRefs.current[idx]?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [tab]);

  // Back/Forward: re-read the URL when the browser moves through history.
  const applyUrl = useCallback(() => {
    const next = readUrl();
    setTab(next.tab);
    setUnresolvedVariant(next.unresolved);
    if (next.found) useVariantStore.getState().setSelected(next.found);
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [applyUrl]);

  // Deep-link: reflect tab + selected variant back into the URL.
  useEffect(() => {
    // Seed from the live query string so params this app does not own (campaign
    // tags, analytics) survive a tab change instead of being dropped.
    const p = new URLSearchParams(window.location.search);
    p.delete("tab");
    p.delete("v");
    if (tab !== "structure") p.set("tab", tab);
    if (!variant.isPatient) p.set("v", variant.id);
    const qs = p.toString();
    const next = qs ? `?${qs}` : window.location.pathname;
    if (next === `${window.location.search || window.location.pathname}`) return;
    // pushState, not replaceState: selecting a variant is a navigation the reader
    // expects Back to undo.
    window.history.pushState(null, "", next);
  }, [tab, variant]);

  return (
    <div className="overflow-x-hidden">
      <Nav />
      <main id="main-content" className="pt-[var(--app-nav-h,80px)]">
        {/* pb-6, not a bottom margin on the last child: a child margin collapses
            out of this wrapper and exposes the bare white `body` as a band
            between the explorer and the Footer. */}
        <div className="pb-6" style={{ background: COLORS.bg, color: COLORS.text }}>
          <a
            href={`#tabpanel-${tab}`}
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-sm"
            style={{ background: COLORS.accent, color: COLORS.bg }}
          >
            Skip to content
          </a>

          {unresolvedVariant && (
            <div
              className="mx-6 mt-4 rounded-lg px-4 py-2 text-xs border"
              style={{
                background: COLORS.dangerDim,
                borderColor: COLORS.danger,
                color: COLORS.text,
              }}
              role="alert"
            >
              Variant <span className="font-mono font-bold">{unresolvedVariant}</span> was not found
              in this catalog snapshot, so the index variant is shown instead — the panels below are
              NOT describing the variant you linked to. Try the{" "}
              <button
                onClick={() => setTab("variants")}
                className="underline font-semibold"
                style={{ color: COLORS.accent }}
              >
                Variants tab
              </button>{" "}
              and search by HGVS notation (either <span className="font-mono">p.Arg102Ter</span> or{" "}
              <span className="font-mono">p.R102*</span> style).
            </div>
          )}

          <header
            ref={headerRef}
            className="px-6 pt-5 border-b"
            style={{ borderColor: COLORS.panelBorder }}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
              <h1 className="text-2xl font-bold tracking-tight m-0">
                SGCE <span style={{ color: COLORS.accent }}>ε-Sarcoglycan</span> Explorer
              </h1>
              <button
                onClick={() => setTab("variants")}
                className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded cursor-pointer"
                style={{
                  color: variant.isPatient ? COLORS.danger : COLORS.accent,
                  background: variant.isPatient ? COLORS.dangerDim : COLORS.accentDim,
                }}
                aria-label={`Selected variant: ${variant.cNotation}, ${variant.notation}. Click to browse all variants.`}
                title="Browse all SGCE variants"
              >
                <span className="sm:hidden">{variant.cNotation || variant.notation}</span>
                <span className="hidden sm:inline">
                  {variant.cNotation ? `${variant.cNotation} · ` : ""}{variant.notation}
                </span>
                <span aria-hidden="true">▾</span>
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: COLORS.textDim }}>
              Interactive visualization — DYT-SGCE with maternal imprinting → complete loss of function
            </p>
            <nav
              role="tablist"
              aria-label="Explorer sections"
              className="flex overflow-x-auto no-scrollbar"
            >
              {TABS.map((t, idx) => (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls={`tabpanel-${t.id}`}
                  id={`tab-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => onTabKeyDown(e, idx)}
                  className="px-3 sm:px-5 py-2.5 text-sm font-semibold cursor-pointer rounded-t-lg -mb-px transition-all whitespace-nowrap"
                  style={{
                    background: tab === t.id ? COLORS.panel : "transparent",
                    color: tab === t.id ? COLORS.accent : COLORS.textDim,
                    borderTop: tab === t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </header>

          <section aria-label="Tab panels">
            <div
              id="tabpanel-structure"
              role="tabpanel"
              aria-labelledby="tab-structure"
              hidden={tab !== "structure"}
            >
              {tab === "structure" && (
                <ErrorBoundary label="The 3D structure view">
                  <ProteinStructure3D />
                </ErrorBoundary>
              )}
            </div>
            <div
              id="tabpanel-variants"
              role="tabpanel"
              aria-labelledby="tab-variants"
              hidden={tab !== "variants"}
            >
              {tab === "variants" && (
                <ErrorBoundary label="The variant browser">
                  <VariantsPanel onViewStructure={() => setTab("structure")} />
                </ErrorBoundary>
              )}
            </div>
            <div
              id="tabpanel-dogma"
              role="tabpanel"
              aria-labelledby="tab-dogma"
              hidden={tab !== "dogma"}
            >
              {tab === "dogma" && (
                <ErrorBoundary label="The central dogma walkthrough">
                  <CentralDogma />
                </ErrorBoundary>
              )}
            </div>
            <div
              id="tabpanel-imprinting"
              role="tabpanel"
              aria-labelledby="tab-imprinting"
              hidden={tab !== "imprinting"}
            >
              {tab === "imprinting" && (
                <ErrorBoundary label="The imprinting panel">
                  <ImprintingPanel />
                </ErrorBoundary>
              )}
            </div>
            <div
              id="tabpanel-research"
              role="tabpanel"
              aria-labelledby="tab-research"
              hidden={tab !== "research"}
            >
              {tab === "research" && (
                <ErrorBoundary label="The research panel">
                  <ResearchPanel />
                </ErrorBoundary>
              )}
            </div>
          </section>

          <Disclaimer />
        </div>
      </main>
      <Footer />
    </div>
  );
}
