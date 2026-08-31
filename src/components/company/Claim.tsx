import { ExternalLink, Info } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import type { Claim as ClaimData } from '@/content/companies/schema';

/**
 * One assertion with its evidence, or its absence (D7).
 *
 * **A confirmed claim and a commonly-reported one look different on purpose.**
 * The failure this guards against is an unsourced sentence sitting next to a
 * sourced one and reading identically — which is how a 404 citation survived the
 * first attempt. So the caveat renders inline with the claim it qualifies, not
 * collected into a disclaimer at the foot of the page where it would apply to
 * everything and therefore to nothing.
 *
 * Source dates sit next to the link. A 2022 post about a 2026 process is a
 * staleness risk even when otherwise correct, and only the reader can judge how
 * much that matters for the interview they are about to walk into.
 */
export function Claim({ claim }: { claim: ClaimData }) {
  if (claim.status === 'commonly-reported') {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-foreground-muted">{claim.text}</p>
        <Node tone="muted" className="flex items-start gap-2 p-2.5 text-xs">
          <Info size={13} aria-hidden className="mt-0.5 shrink-0 text-warning" />
          <span>
            <strong className="font-semibold">Commonly reported, not confirmed.</strong>{' '}
            {claim.caveat}
          </span>
        </Node>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-foreground-muted">{claim.text}</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {claim.sources.map((source) => (
          <li key={source.url} className="text-xs">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-link underline underline-offset-2"
            >
              {source.label}
              <ExternalLink size={11} aria-hidden />
            </a>
            <span className="text-foreground-muted">
              {source.published ? ` · published ${source.published}` : ' · undated'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
