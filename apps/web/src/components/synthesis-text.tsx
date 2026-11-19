import type { ReactNode } from 'react';

const MARKER_SPLIT = /(\[#[a-z0-9-]{1,40}\])/;
const MARKER_ID = /^\[#([a-z0-9-]{1,40})\]$/;

interface SynthesisTextProps {
  text: string;
  /** Ids confirmed by `citation` events; only these become clickable (no invented sources). */
  verifiedIds: ReadonlySet<string>;
  onOpenCitation: (responseId: string) => void;
}

function renderInline(line: string, props: Omit<SynthesisTextProps, 'text'>): ReactNode[] {
  return line.split(MARKER_SPLIT).map((part, index) => {
    const id = MARKER_ID.exec(part)?.[1];
    if (!id) return part;
    if (!props.verifiedIds.has(id))
      return (
        <span key={index} className="cite-plain">
          {part}
        </span>
      );
    return (
      <button
        key={index}
        type="button"
        className="cite"
        aria-label={`Abrir resposta-fonte ${id}`}
        onClick={() => props.onOpenCitation(id)}
      >
        {part}
      </button>
    );
  });
}

/** Renders the synthesis text: `- ` lines become a list and `[#id]` markers become source buttons. */
export function SynthesisText({ text, verifiedIds, onOpenCitation }: SynthesisTextProps) {
  const props = { verifiedIds, onOpenCitation };
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-2 flex list-disc flex-col gap-2 pl-5">
        {items.map((item, index) => (
          <li key={index}>{renderInline(item, props)}</li>
        ))}
      </ul>,
    );
  };

  for (const line of text.split('\n')) {
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2));
      continue;
    }
    flushBullets();
    if (line.trim()) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="my-2">
          {renderInline(line, props)}
        </p>,
      );
    }
  }
  flushBullets();
  return <>{blocks}</>;
}
