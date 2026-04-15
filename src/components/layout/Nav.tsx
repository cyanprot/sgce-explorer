import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "@/components/ui/Logo";

const ARCIVUS_ORIGIN = "https://arcivus.ca";

const NAV_LINKS = [
  { href: `${ARCIVUS_ORIGIN}/science`, label: "Science", external: true },
  { href: `${ARCIVUS_ORIGIN}/pipeline`, label: "Pipeline", external: true },
  { href: `${ARCIVUS_ORIGIN}/publications`, label: "Publications", external: true },
  { href: `${ARCIVUS_ORIGIN}/insights`, label: "Insights", external: true },
  { href: "/", label: "Explorer", external: false },
  { href: `${ARCIVUS_ORIGIN}/about`, label: "About", external: true },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, closeMenu]);

  return (
    <nav
      className={`fixed top-0 z-50 w-full bg-surface transition-all duration-300 ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-xl transition-all duration-300 ${
          scrolled ? "py-md" : "py-xl"
        }`}
      >
        <a href={ARCIVUS_ORIGIN} className="flex items-center gap-sm" aria-label="Arcivus home">
          <Logo size={scrolled ? 44 : 50} />
          <img src="/images/logo-navy.svg" alt="Arcivus" className="h-8" />
        </a>

        <div className="hidden items-center gap-xl lg:flex">
          {NAV_LINKS.map(({ href, label, external }) => {
            const isCurrent = !external;
            return (
              <a
                key={label}
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={`text-sm font-medium transition-colors ${
                  isCurrent ? "text-action" : "text-steel hover:text-ink"
                }`}
              >
                {label}
              </a>
            );
          })}
          <a
            href={`${ARCIVUS_ORIGIN}/contact`}
            className="rounded-full border-2 border-action bg-action px-lg py-sm text-sm font-bold text-snow transition-colors hover:bg-action-hover hover:border-action-hover"
          >
            Contact Us
          </a>
        </div>

        <button
          ref={hamburgerRef}
          aria-label="Menu"
          className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg className="h-6 w-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 top-0 z-[-1] lg:hidden"
            style={{ background: "oklch(15% 0.015 250 / 0.2)" }}
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-label="Navigation menu"
            onKeyDown={(e) => {
              if (e.key === "Escape") closeMenu();
            }}
            className="border-t border-cloud bg-surface px-xl py-lg lg:hidden"
          >
            <div className="flex flex-col">
              {NAV_LINKS.map(({ href, label, external }) => {
                const isCurrent = !external;
                return (
                  <a
                    key={label}
                    href={href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`py-md text-base ${
                      isCurrent ? "text-action font-medium" : "text-steel"
                    }`}
                    onClick={closeMenu}
                  >
                    {label}
                  </a>
                );
              })}
              <a
                href={`${ARCIVUS_ORIGIN}/contact`}
                className="mt-md rounded-full border-2 border-action bg-action px-lg py-md text-center text-sm font-bold text-snow"
                onClick={closeMenu}
              >
                Contact Us
              </a>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
