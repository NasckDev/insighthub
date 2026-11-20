import Steps from 'antd/es/steps';
import type { ReactNode } from 'react';

export interface AppStepItem {
  title: string;
  description?: ReactNode;
}

export interface AppStepsProps {
  items: readonly AppStepItem[];
  current: number;
  onChange?: (step: number) => void;
  size?: 'sm' | 'md';
}

/** Progress through a short sequence (the 3-step tour). */
export function AppSteps({ items, current, onChange, size = 'sm' }: AppStepsProps) {
  return (
    <Steps
      current={current}
      onChange={onChange}
      size={size === 'sm' ? 'small' : 'default'}
      titlePlacement="vertical"
      items={items.map((item) => ({ title: item.title, content: item.description }))}
    />
  );
}
