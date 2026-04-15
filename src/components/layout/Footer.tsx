import SocialLinks from "@/components/ui/SocialLinks";

const ARCIVUS_ORIGIN = "https://arcivus.ca";

const QUICK_LINKS = [
  { href: `${ARCIVUS_ORIGIN}/science`, label: "Science", external: true },
  { href: `${ARCIVUS_ORIGIN}/pipeline`, label: "Pipeline", external: true },
  { href: `${ARCIVUS_ORIGIN}/publications`, label: "Publications", external: true },
  { href: `${ARCIVUS_ORIGIN}/insights`, label: "Insights", external: true },
  { href: "/", label: "Explorer", external: false },
  { href: `${ARCIVUS_ORIGIN}/about`, label: "About", external: true },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate bg-ink text-cloud">
      <div className="mx-auto max-w-7xl px-xl py-4xl">
        <div className="grid gap-3xl sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-lg">
            <a href={ARCIVUS_ORIGIN} className="inline-block" aria-label="Arcivus home">
              <img src="/images/logo-white.svg" alt="Arcivus" className="h-10" />
            </a>
            <p className="text-sm text-ash">Advancing AAV Gene Therapy</p>
          </div>

          <div className="flex flex-col gap-md">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-snow">
              Quick Links
            </h3>
            {QUICK_LINKS.map(({ href, label, external }) => (
              <a
                key={label}
                href={href}
                aria-current={!external ? "page" : undefined}
                className="py-sm text-sm text-ash transition-colors hover:text-snow"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-md">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-snow">
              Connect
            </h3>
            <SocialLinks />
            <a
              href="mailto:cyan@northprot.com"
              aria-label="Contact us"
              className="text-sm text-ash transition-colors hover:text-snow"
            >
              cyan@northprot.com
            </a>
          </div>

          <div className="flex flex-col gap-md">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-snow">
              Legal
            </h3>
            <span className="text-sm text-ash">
              &copy; {new Date().getFullYear()} Arcivus. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
