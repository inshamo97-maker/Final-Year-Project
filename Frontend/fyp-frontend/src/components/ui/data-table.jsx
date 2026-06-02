import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function DataTable({ columns, data, onRowClick, emptyMessage = "No data available", getRowKey }) {
  const defaultGetRowKey = (row, index) => {
    if (row.id !== undefined) return row.id;
    return index;
  };

  const keyFn = getRowKey || defaultGetRowKey;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((column, index) => (
              <TableHead key={index} className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground", column.className)}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow key={keyFn(row, rowIndex)} className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-muted/50")} onClick={() => onRowClick?.(row)}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className={column.className}>
                    {typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
