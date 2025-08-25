/* eslint-disable @typescript-eslint/no-explicit-any */
export const buildDateMatch = (startDate?: string, endDate?: string) => {
  const match: Record<string, any> = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  return match;
};
