'use client'

type DataTableProps = {
  columns: string[]
  children: React.ReactNode
}

export default function DataTable({ columns, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-4 py-3 text-left font-medium text-muted-foreground"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}
