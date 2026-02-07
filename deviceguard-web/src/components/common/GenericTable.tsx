import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface GenericTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
  };
  onRowClick?: (item: T) => void;
}

export function GenericTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No hay datos disponibles",
  pagination,
  onRowClick,
}: GenericTableProps<T>) {
  const handlePrevious = () => {
    if (pagination && pagination.currentPage > 1) {
      pagination.onPageChange(pagination.currentPage - 1);
    }
  };

  const handleNext = () => {
    if (pagination && pagination.currentPage < pagination.totalPages) {
      pagination.onPageChange(pagination.currentPage + 1);
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-slate-600">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`pb-3 font-medium ${column.className || ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={`border-b hover:bg-slate-50 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="py-4">
                      {column.render
                        ? column.render(item)
                        : (item as any)[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-slate-600">
            Mostrando {data.length} de {pagination.totalItems}{" "}
            {pagination.totalItems === 1 ? "registro" : "registros"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={pagination.currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
