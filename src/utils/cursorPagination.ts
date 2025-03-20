
/**
 * Utilities for cursor-based pagination
 */

// Create a cursor from a record based on its sortable field
export function createCursor<T extends Record<string, any>>(
  record: T,
  sortField: keyof T
): string {
  if (record === null || record === undefined || record[sortField] === undefined) {
    return '';
  }
  
  // Create a cursor string combining the sort field and its value
  const cursorData = {
    field: sortField,
    value: record[sortField],
  };
  
  // Base64 encode to make it URL-safe
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

// Decode a cursor string to get the field and value
export function decodeCursor(cursor: string): { field: string; value: any } | null {
  if (!cursor) return null;
  
  try {
    // Decode the base64 string
    const decoded = Buffer.from(cursor, 'base64').toString();
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding cursor:', error);
    return null;
  }
}

// Get the appropriate operator for the pagination direction
export function getCursorOperator(direction: 'next' | 'prev', sortDirection: 'asc' | 'desc'): '<' | '>' {
  if (direction === 'next' && sortDirection === 'asc') return '>';
  if (direction === 'next' && sortDirection === 'desc') return '<';
  if (direction === 'prev' && sortDirection === 'asc') return '<';
  if (direction === 'prev' && sortDirection === 'desc') return '>';
  
  // Default for next + asc
  return '>';
}

export interface PaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}
