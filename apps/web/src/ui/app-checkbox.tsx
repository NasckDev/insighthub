import Checkbox from 'antd/es/checkbox';
import type { CheckboxProps } from 'antd';
import type { ReactNode } from 'react';

export interface AppCheckboxProps extends Omit<CheckboxProps, 'children'> {
  children: ReactNode;
  /** Right-aligned detail inside the clickable row, such as a count. */
  extra?: ReactNode;
}

/** Checkbox whose whole row is the click target (44 px high on touch screens). */
export function AppCheckbox({ children, extra, className, ...rest }: AppCheckboxProps) {
  return (
    <Checkbox className={`ih-check-row ${className ?? ''}`} {...rest}>
      <span className="ih-check-label">
        <span>{children}</span>
        {extra !== undefined ? <span className="ih-muted ih-tabular">{extra}</span> : null}
      </span>
    </Checkbox>
  );
}
