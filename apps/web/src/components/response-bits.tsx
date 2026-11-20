import { classifyNps, detectThemes, normalizeText, THEME_LABELS } from '@insighthub/core';
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

/**
 * Finds [start, end) ranges in `text` where `term` occurs, ignoring case AND accents ("preco" finds
 * "preço"). The match runs on a normalized copy, and a map takes every hit back to the original text.
 */
export function findHighlightRanges(text: string, term: string | undefined): [number, number][] {
  const needle = term ? normalizeText(term.trim()) : '';
  if (!needle) return [];
  let normalized = '';
  const origin: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const piece = normalizeText(text.charAt(index));
    for (let offset = 0; offset < piece.length; offset += 1) origin.push(index);
    normalized += piece;
  }
  const ranges: [number, number][] = [];
  let hit = normalized.indexOf(needle);
  while (hit >= 0) {
    const start = origin[hit] as number;
    const end = (origin[hit + needle.length - 1] as number) + 1;
    ranges.push([start, end]);
    hit = normalized.indexOf(needle, hit + needle.length);
  }
  return ranges;
}

/** Wraps every occurrence of `term` (case- and accent-insensitive) in <mark>. */
export function HighlightText({ text, term }: { text: string; term: string | undefined }) {
  const ranges = findHighlightRanges(text, term);
  if (ranges.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={start} className="rounded-sm px-0.5" style={{ background: 'var(--warn-bg)', color: 'var(--warn-fg)', boxShadow: '0 0 0 1px var(--warn-line)' }}>
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}
