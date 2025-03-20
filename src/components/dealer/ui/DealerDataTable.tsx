
import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface DealerTableColumn<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => ReactNode);
  cell?: (row: T) => ReactNode;
}

interface DealerDataTableProps<T> {
  columns: DealerTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  rowClassName?: (row: T, index: number) => string;
  keyExtractor: (row: T) => string;
}

/**
 * Reusable table component for dealer data display
 */
export function DealerDataTable<T>({ 
  columns, 
  data, 
  isLoading = false, 
  emptyState,
  rowClassName,
  keyExtractor
}: DealerDataTableProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  // Render actual data
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow 
              key={keyExtractor(row)}
              className={rowClassName ? rowClassName(row, rowIndex) : undefined}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.cell 
                    ? column.cell(row)
                    : typeof column.accessorKey === 'function' 
                      ? column.accessorKey(row)
                      : row[column.accessorKey] as ReactNode}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
