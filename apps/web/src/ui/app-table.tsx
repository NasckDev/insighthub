import { List, Table, type TableProps } from 'antd';
import { useMemo, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { AppCard } from './app-card';
import { useIsPhone } from './theme';

export interface AppColumn<T> {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
  /** Keeps the cell on one line (numbers, dates). */
  nowrap?: boolean;
}

export interface AppTableProps<T> {
  columns: readonly AppColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Name of the table for screen readers (also the name of the card list on phones). */
  label: string;
  loading?: boolean;
  /** Renders each row as a card on phones, where a table would need sideways scrolling. */
  mobileCard?: (row: T) => ReactNode;
  empty?: ReactNode;
  size?: 'sm' | 'md';
}

/**
 * Data table. Columns are declared with plain render functions, the table is named for assistive
 * technology, and below 768 px it turns into a list of cards when `mobileCard` is given.
 */
export function AppTable<T extends object>({ columns, rows, rowKey, label, loading, mobileCard, empty, size = 'md' }: AppTableProps<T>) {
  const phone = useIsPhone();
  const components = useMemo<TableProps<T>['components']>(
    () => ({
      table: (props: ComponentPropsWithoutRef<'table'>) => <table {...props} aria-label={label} />,
    }),
    [label],
  );
  if (phone && mobileCard) {
    return <AppList items={rows} itemKey={rowKey} label={label} render={mobileCard} loading={loading} empty={empty} />;
  }
  return (
    <Table<T>
      className="ih-table"
      components={components}
      dataSource={rows as T[]}
      rowKey={rowKey}
      loading={loading}
      pagination={false}
      size={size === 'sm' ? 'small' : 'middle'}
      tableLayout="auto"
      locale={{ emptyText: empty ?? 'Nada para mostrar.' }}
      columns={columns.map((column) => ({
        key: column.key,
        title: column.title,
        width: column.width,
        align: column.align,
        className: column.nowrap ? 'ih-nowrap-cell' : undefined,
        onCell: () => (column.nowrap ? { style: { whiteSpace: 'nowrap' } } : {}),
        render: (_: unknown, row: T) => column.render(row),
      }))}
    />
  );
}

export interface AppListProps<T> {
  items: readonly T[];
  itemKey: (item: T) => string;
  label: string;
  render: (item: T) => ReactNode;
  loading?: boolean;
  empty?: ReactNode;
}

/** Vertical list of cards (the mobile form of a table). */
export function AppList<T>({ items, itemKey, label, render, loading, empty }: AppListProps<T>) {
  return (
    <List<T>
      aria-label={label}
      loading={loading}
      dataSource={items as T[]}
      locale={{ emptyText: empty ?? 'Nada para mostrar.' }}
      split={false}
      renderItem={(item) => (
        <List.Item key={itemKey(item)} style={{ padding: 0, marginBottom: 'var(--ih-space-3)', border: 0 }}>
          <AppCard style={{ width: '100%' }} styles={{ body: { padding: 'var(--ih-space-4)' } }}>
            {render(item)}
          </AppCard>
        </List.Item>
      )}
    />
  );
}
