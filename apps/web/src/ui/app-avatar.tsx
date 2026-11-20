import Avatar from 'antd/es/avatar';
import type { ReactNode } from 'react';

export interface AppAvatarProps {
  /** Initials or an icon. Decorative by default: the person's name sits next to it. */
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Background of the badge; the text is always white, so pass a color that holds 4.5:1 against it. */
  background?: string;
  label?: string;
}

const SIZE = { sm: 32, md: 40, lg: 48 } as const;

export function AppAvatar({ children, size = 'md', background, label }: AppAvatarProps) {
  return (
    <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={{ display: 'inline-flex', flexShrink: 0 }}>
      <Avatar size={SIZE[size]} style={{ background, color: '#fff', fontWeight: 600 }}>
        {children}
      </Avatar>
    </span>
  );
}
