export const getPagination = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  limit,
});

export const getPaginationMeta = (
  page: number,
  limit: number,
  total: number,
) => ({
  page,
  limit,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});