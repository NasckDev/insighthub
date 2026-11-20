import { Empty } from 'antd';
import type { ReactNode } from 'react';
import { AppCard } from './app-card';
import { Illustration, type IllustrationName } from './illustrations';

export interface AppEmptyProps {
  title: string;
  description?: ReactNode;
  /** Next step: a button or a set of links. */
  action?: ReactNode;
  illustration?: IllustrationName;
  /** `card` frames it as a card; `plain` is for inside another card. */
  framed?: boolean;
}

/** Empty state: drawing, what happened and the next step. */
export function AppEmpty({ title, description, action, illustration = 'search', framed = true }: AppEmptyProps) {
  const content = (
    <Empty
      image={<Illustration name={illustration} />}
      styles={{ image: { height: 'auto', marginBottom: 0 } }}
      description={
        <span className="ih-stack" style={{ alignItems: 'center', gap: 'var(--ih-space-1)' }}>
          <span className="ih-display" style={{ fontSize: '1.3rem' }}>
            {title}
          </span>
          {description ? <span className="ih-muted" style={{ maxWidth: '30rem' }}>{description}</span> : null}
        </span>
      }
    >
      {action}
    </Empty>
  );
  return framed ? <AppCard>{content}</AppCard> : content;
}
