import Radio from 'antd/es/radio';
import type { ReactNode } from 'react';

export interface AppRadioCardOption<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
}

export interface AppRadioCardsProps<T extends string> {
  options: readonly AppRadioCardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
}

/** Choice between a few options, each as a card with a title and a one-line explanation. */
export function AppRadioCards<T extends string>({ options, value, onChange, 'aria-label': ariaLabel }: AppRadioCardsProps<T>) {
  return (
    <Radio.Group value={value} onChange={(event) => onChange(event.target.value as T)} aria-label={ariaLabel} style={{ width: '100%' }}>
      <div className="ih-grid ih-grid--tight" style={{ '--cols-base': 1, '--cols-md': 2, '--cols-lg': 3 } as React.CSSProperties}>
        {options.map((option) => (
          <Radio.Button
            key={option.value}
            value={option.value}
            style={{ height: 'auto', padding: 'var(--ih-space-3) var(--ih-space-4)', lineHeight: 1.35, whiteSpace: 'normal', borderRadius: 'var(--ih-radius-md)' }}
          >
            <span className="ih-stack" style={{ gap: 'var(--ih-space-1)' }}>
              <strong>{option.label}</strong>
              {option.description ? <span className="ih-muted" style={{ fontWeight: 400, fontSize: '0.8125rem' }}>{option.description}</span> : null}
            </span>
          </Radio.Button>
        ))}
      </div>
    </Radio.Group>
  );
}
