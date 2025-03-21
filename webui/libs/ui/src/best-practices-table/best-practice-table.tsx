import { components } from '@webui/types';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

type BestPractice = components['schemas']['BestPractice'];

interface BestPracticeTableProps {
  bestPractices: Record<string, BestPractice>;
}

type TableRow = BestPractice & { name: string };

const columnHelper = createColumnHelper<TableRow>();

export function BestPracticeTable({ bestPractices }: BestPracticeTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'status',
        header: '',
        cell: (info) => (
          <input
            type="checkbox"
            className={`checkbox checkbox-sm ${
              info.row.original.status ? 'checkbox-success' : 'checkbox-primary'
            }`}
            checked={info.row.original.status || false}
            readOnly
          />
        ),
      }),
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => column.toggleSorting()}
          >
            Best Practice
          </button>
        ),
      }),
      columnHelper.accessor('risk', {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => column.toggleSorting()}
          >
            Severity
          </button>
        ),
        cell: (info) => {
          return (
            <div
              className={`badge badge-soft badge-sm ${
                info.row.original.risk === 'High'
                  ? 'badge-error'
                  : info.row.original.risk === 'Medium'
                  ? 'badge-warning'
                  : 'badge-success'
              }`}
            >
              {info.row.original.risk}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.results?.length || 0, {
        id: 'failedFindings',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 justify-center w-full cursor-pointer"
            onClick={() => column.toggleSorting()}
          >
            Failed Findings
          </button>
        ),
        cell: (info) => {
          if (info.row.original.results?.length === 0) {
            return <div className="text-base-content/50 text-center">0</div>;
          }
          return (
            <div className="font-bold text-error text-center">
              {info.row.original.results?.length || 0}
            </div>
          );
        },
      }),
    ],
    []
  );

  const data = useMemo(
    () =>
      Object.entries(bestPractices).map(([key, practice]) => ({
        ...practice,
        name: key,
      })),
    [bestPractices]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <table className="table">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="text-md font-medium text-base-content"
              >
                <div className="flex items-center gap-1">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted() === 'asc' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : header.column.getIsSorted() === 'desc' ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : null}
                </div>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="p-4 py-6">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default BestPracticeTable;
