import { Pagination } from 'antd';
import { useIsPhone } from './theme';

export interface AppPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  pageSizeOptions?: readonly number[];
}

/** Pagination with the page size picker; on phones it drops the page numbers and keeps previous/next. */
export function AppPagination({ current, pageSize, total, onChange, pageSizeOptions = [10, 20, 50] }: AppPaginationProps) {
  const phone = useIsPhone();
  return (
    <Pagination
      current={current}
      pageSize={pageSize}
      total={total}
      onChange={onChange}
      showSizeChanger
      pageSizeOptions={pageSizeOptions.map(String)}
      simple={phone ? { readOnly: true } : false}
      showLessItems
      align="end"
      locale={{ items_per_page: 'por página' }}
    />
  );
}
