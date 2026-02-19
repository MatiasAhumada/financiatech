import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search01Icon } from "hugeicons-react";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  loading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  actions?: ReactNode;
  totalLabel?: string;
  onRowClick?: (item: T) => void;
  expandedContent?: (item: T) => ReactNode;
}

export function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  keyExtractor,
  emptyMessage = "No hay datos disponibles",
  loading = false,
  searchPlaceholder = "Buscar...",
  onSearch,
  actions,
  totalLabel,
  onRowClick,
  expandedContent,
}: DataTableProps<T>) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className=" lg:ml-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <p className="text-silver-400 mt-1 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">{actions}</div>
        )}
      </div>

      <div className="border border-carbon_black-600 rounded-lg shadow-sm bg-carbon_black">
        {onSearch && (
          <div className="p-6 border-b border-carbon_black-700">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search01Icon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-400"
              />
              <Input
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10 bg-onyx-600 border-carbon_black-700 text-white placeholder:text-silver-400 focus:border-mahogany_red focus:ring-mahogany_red text-sm"
              />
            </div>
          </div>
        )}

        <div className="p-6 overflow-visible">
          <div className="w-full overflow-x-auto overflow-y-visible">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-carbon_black-700 text-left text-xs text-silver-400 uppercase tracking-wide">
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-8 text-center text-silver-400"
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-8 text-center text-silver-400"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <>
                      <tr
                        key={keyExtractor(item)}
                        onClick={() => onRowClick?.(item)}
                        className={`border-b border-carbon_black-700 hover:bg-onyx-600 transition-colors ${
                          onRowClick ? "cursor-pointer sm:cursor-default" : ""
                        }`}
                      >
                        {columns.map((column) => (
                          <td key={column.key} className="py-4">
                            {column.render
                              ? column.render(item)
                              : (item as any)[column.key]}
                          </td>
                        ))}
                      </tr>
                      {expandedContent?.(item)}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalLabel && (
            <div className="mt-4 pt-4 border-t border-carbon_black-700">
              <p className="text-sm text-silver-400 uppercase tracking-wide">
                {totalLabel}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
