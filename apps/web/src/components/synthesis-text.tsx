import { ID_BODY } from '@insighthub/core';
import type { ReactNode } from 'react';

const MARKER_SPLIT = new RegExp(`(\\[#${ID_BODY}\\])`);
const MARKER_ID = new RegExp(`^\\[#(${ID_BODY})\\]$`);
const BOLD_SPLIT = /(\*\*[^*]+\*\*)/;

interface SynthesisTextProps {
  text: string;
  /** Ids confirmed by `citation` events; only these become clickable (no invented sources). */
  verifiedIds: ReadonlySet<string>;
  onOpenCitation: (responseId: string) => void;
}

type InlineProps = Omit<SynthesisTextProps, 'text'>;

function renderMarkers(chunk: string, props: InlineProps, keyPrefix: string): ReactNode[] {
  return chunk.split(MARKER_SPLIT).map((part, index) => {
    const id = MARKER_ID.exec(part)?.[1];
    if (!id) return part;
    if (!props.verifiedIds.has(id))
      return (
        <span key={`${keyPrefix}-${index}`} className="cite-plain">
          {part}
        </span>
      );
    return (
      <button
        key={`${keyPrefix}-${index}`}
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

/** `**bold**` and `[#id]` markers; everything else is plain text (never HTML). */
function renderInline(line: string, props: InlineProps): ReactNode[] {
  return line.split(BOLD_SPLIT).flatMap<ReactNode>((chunk, index) => {
    if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4) {
      return [<strong key={`b-${index}`}>{renderMarkers(chunk.slice(2, -2), props, `b${index}`)}</strong>];
    }
    return renderMarkers(chunk, props, `t${index}`);
  });
}

/** Renders the synthesis: `## ` headings, `- ` bullets, bold and `[#id]` markers as source buttons. */
export function SynthesisText({ text, verifiedIds, onOpenCitation }: SynthesisTextProps) {
  const props = { verifiedIds, onOpenCitation };
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
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
    if (line.startsWith('## ')) {
      blocks.push(<h2 key={`h-${blocks.length}`}>{line.slice(3)}</h2>);
    } else if (line.trim()) {
      blocks.push(<p key={`p-${blocks.length}`}>{renderInline(line, props)}</p>);
    }
  }
  flushBullets();
  return <div className="prose-synthesis">{blocks}</div>;
}
