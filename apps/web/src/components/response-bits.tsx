import { classifyNps, detectThemes, THEME_LABELS } from '@insighthub/core';
import { Frown, Meh, Smile } from 'lucide-react';
import { NPS_SINGULAR } from '../lib/labels';
import { personOf } from '../lib/people';

const CATEGORY_ICON = { promoter: Smile, passive: Meh, detractor: Frown } as const;

/** Colored initials for a fictional respondent. */
export function Avatar({ respondentId, size = 36 }: { respondentId: string; size?: number }) {
  const person = personOf(respondentId);
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: person.tone, fontSize: size * 0.38 }}
    >
      {person.initials}
    </span>
  );
}

/** Score with an icon and a word: the NPS band never relies on color alone. */
export function ScoreBadge({ score }: { score: number }) {
  const category = classifyNps(score);
  const Icon = CATEGORY_ICON[category];
  return (
    <span className={`badge badge-${category}`}>
      <Icon aria-hidden="true" size={13} />
      <span className="tabular-nums">{score}</span>
      <span className="font-medium">{NPS_SINGULAR[category]}</span>
    </span>
  );
}

export function ThemeChips({ comment }: { comment: string }) {
  const themes = detectThemes(comment);
  if (themes.length === 0) return null;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Temas citados">
      {themes.map((theme) => (
        <li key={theme} className="badge text-xs">
          {THEME_LABELS[theme]}
        </li>
      ))}
    </ul>
  );
}

/** Wraps every occurrence of `term` (accent- and case-insensitive on the lowercase form) in <mark>. */
export function HighlightText({ text, term }: { text: string; term: string | undefined }) {
  const needle = term?.trim().toLocaleLowerCase('pt-BR');
  if (!needle) return <>{text}</>;
  const haystack = text.toLocaleLowerCase('pt-BR');
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let index = haystack.indexOf(needle);
  while (index >= 0) {
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(
      <mark key={index} className="rounded-sm px-0.5" style={{ background: 'var(--warn-bg)', color: 'var(--warn-fg)', boxShadow: '0 0 0 1px var(--warn-line)' }}>
        {text.slice(index, index + needle.length)}
      </mark>,
    );
    cursor = index + needle.length;
    index = haystack.indexOf(needle, cursor);
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}
