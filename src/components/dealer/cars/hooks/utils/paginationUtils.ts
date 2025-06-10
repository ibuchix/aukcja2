
export const applyPagination = (query: any, currentPage: number, pageSize: number) => {
  const fromIndex = (currentPage - 1) * pageSize;
  const to = fromIndex + pageSize - 1;
  return query.range(fromIndex, to);
};

export const calculatePaginationInfo = (currentPage: number, pageSize: number) => {
  const fromIndex = (currentPage - 1) * pageSize;
  const to = fromIndex + pageSize - 1;
  return { fromIndex, to };
};
