import React from 'react';

interface CompactPaginationInfoProps {
  currentPage: number;
  pageSize: number;
  total: number;
}

export const CompactPaginationInfo: React.FC<CompactPaginationInfoProps> = ({
  currentPage,
  pageSize,
  total
}) => {
  if (total <= pageSize) return null;

  const fromIndex = (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, total);

  return (
    <div className="text-right">
      <span className="text-xs text-muted-foreground/70">
        {fromIndex}-{toIndex} z {total}
      </span>
    </div>
  );
};
