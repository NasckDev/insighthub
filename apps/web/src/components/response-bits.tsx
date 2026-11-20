import { classifyNps, detectThemes, normalizeText, THEME_LABELS } from '@insighthub/core';
import { NPS_SINGULAR } from '../lib/labels';
import { personOf } from '../lib/people';
import { AppAvatar, AppStatus, AppTag } from '../ui';

const SIZE_FOR = (size: number) => (size <= 32 ? 'sm' : size <= 40 ? 'md' : 'lg');

/** Colored initials for a fictional respondent. */
export function Avatar({ respondentId, size = 36 }: { respondentId: string; size?: number }) {
  const person = personOf(respondentId);
  return (
    <AppAvatar size={SIZE_FOR(size)} background={person.tone}>
      {person.initials}
    </AppAvatar>
  );
}

/** Score with an icon and a word: the NPS band never relies on color alone. */
export function ScoreBadge({ score }: { score: number }) {
  const category = classifyNps(score);
  return <AppStatus status={category} value={score} label={NPS_SINGULAR[category]} />;
}

export function ThemeChips({ comment }: { comment: string }) {
  const themes = detectThemes(comment);
  if (themes.length === 0) return null;
  return (
    <ul className="ih-row ih-gap-1" aria-label="Temas citados" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {themes.map((theme) => (
        <li key={theme}>
          <AppTag>{THEME_LABELS[theme]}</AppTag>
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
      <mark key={start} className="ih-mark">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}
