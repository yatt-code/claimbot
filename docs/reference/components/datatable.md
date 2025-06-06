# DataTable Component Reference

**Version**: 1.0  
**Last Updated**: June 6, 2025  
**Status**: Production Ready

## Overview

The `DataTable` component, located at [`src/components/DataTable.tsx`](../../../src/components/DataTable.tsx:34), is a reusable and flexible table component designed to display, sort, filter, and paginate data. It is built using the `@tanstack/react-table` library (v8) and integrates with UI primitives from [`src/components/ui/`](../../../src/components/ui/).

## Purpose

To provide a consistent and feature-rich way to render tabular data across the ClaimBot application. It supports:
*   Dynamic column definitions.
*   Client-side pagination.
*   Client-side sorting by column.
*   Client-side global filtering (search across all columns).
*   Client-side column-specific filtering (if column definitions include filter UIs).

## Props

The component accepts the following props, defined by the `DataTableProps<TData, TValue>` interface:

### `columns: ColumnDef<TData, TValue>[]` (required)
*   **Type:** An array of `ColumnDef` objects from `@tanstack/react-table`.
*   **Description:** Defines the structure and behavior of each column in the table. Each `ColumnDef` specifies how to access data for the column (`accessorKey` or `accessorFn`), what to render in the header (`header`), and what to render in the cell (`cell`). Headers and cells can be simple strings or custom React components.
*   **Example `ColumnDef`:**
    ```typescript
    import { ColumnDef } from "@tanstack/react-table";
    // Assuming TData is your data row type, e.g., interface MyData { id: string; name: string; email: string; }

    export const columns: ColumnDef<MyData>[] = [
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "email",
        header: "Email Address",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Button onClick={() => console.log("Action for:", item.id)}>
              View Details
            </Button>
          );
        },
      },
    ];
    ```

### `data: TData[]` (required)
*   **Type:** An array of data objects, where `TData` is the type of each row's data.
*   **Description:** The actual data to be displayed in the table.

### `globalFilter?: string` (optional)
*   **Type:** `string`
*   **Description:** An externally controlled global filter string. If provided, the table will filter rows based on this string. The component also has an internal global filter input if this prop is not used.
*   **Usage:** Useful when you want a search input outside the `DataTable` component to control its filtering.

### `setGlobalFilter?: React.Dispatch<React.SetStateAction<string>>` (optional)
*   **Type:** React state setter function.
*   **Description:** If `globalFilter` is provided and managed externally, this setter function should also be provided to allow the `DataTable`'s internal mechanisms (if any were to be added for clearing filters from within) or future enhancements to update the external global filter state. Currently, if `setGlobalFilter` is *not* provided, the component renders its own global search input that uses an *internal* state for filtering. If `setGlobalFilter` *is* provided, the internal search input is hidden, assuming the parent component manages the search input UI.

## Usage Example

```tsx
"use client";

import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";

interface Payment {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
}

const payments: Payment[] = [
  { id: "1", amount: 100, status: "success", email: "ken99@yahoo.com" },
  { id: "2", amount: 150, status: "pending", email: "alice@example.com" },
  // ...more data
];

export const columns: ColumnDef<Payment>[] = [
  { accessorKey: "email", header: "Email" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "status", header: "Status" },
];

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  return (
    <div>
      <Input
        placeholder="Search all payments..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="max-w-sm mb-4"
      />
      <DataTable
        columns={columns}
        data={payments}
        globalFilter={searchTerm}
        setGlobalFilter={setSearchTerm} // Provide if using external search input
      />
    </div>
  );
}
```

## Key Features & Internal Logic

*   **Table Instance:** Uses `useReactTable` hook from `@tanstack/react-table` to create and manage the table instance.
*   **Core Models:** Implements `getCoreRowModel`, `getPaginationRowModel`, `getSortedRowModel`, and `getFilteredRowModel`.
*   **State Management:**
    *   `sorting`: Manages the current sorting state (`SortingState`).
    *   `columnFilters`: Manages column-specific filter states (`ColumnFiltersState`).
    *   `internalGlobalFilter`: Manages the global search term if `globalFilter` and `setGlobalFilter` props are not provided.
*   **Rendering:**
    *   Uses UI primitives: [`Table`](../../../src/components/ui/table.tsx:1), [`TableBody`](../../../src/components/ui/table.tsx:1), [`TableCell`](../../../src/components/ui/table.tsx:1), [`TableHead`](../../../src/components/ui/table.tsx:1), [`TableHeader`](../../../src/components/ui/table.tsx:1), [`TableRow`](../../../src/components/ui/table.tsx:1).
    *   Uses `flexRender` from `@tanstack/react-table` to render header and cell content, allowing for custom components or simple text.
*   **Global Filter UI:** If `setGlobalFilter` prop is *not* provided, an [`Input`](../../../src/components/ui/input.tsx:1) field is rendered above the table for global searching. This input updates the `internalGlobalFilter` state.
*   **Pagination Controls:** Renders "Previous" and "Next" buttons ([`Button`](../../../src/components/ui/button.tsx:1) component) for navigating pages.
*   **No Results:** Displays a "No results." message if the table data is empty or filtered to an empty set.

## Styling

*   Relies on global styles and Tailwind CSS utility classes.
*   Uses components from `src/components/ui/` which are pre-styled (e.g., border for the table container).

## Dependencies

*   `@tanstack/react-table`
*   `react`
*   UI primitive components from `src/components/ui/` (e.g., `table`, `button`, `input`).

## Customization & Extensibility

*   **Columns:** The primary way to customize the table is through the `columns` prop. Complex rendering, custom sorting logic, and column-specific filtering UIs can be defined within `ColumnDef` objects.
*   **Filtering:** While global filtering is built-in, column-specific filter UIs need to be implemented as part of the `header` rendering in `ColumnDef` and linked to the table's `column.getFilterValue()` and `column.setFilterValue()` methods.
*   **Styling:** Can be further styled using Tailwind CSS classes passed via `className` props to the `DataTable` or by customizing the underlying `src/components/ui/` components.

## Advanced Column Configuration

### Sortable Columns
```typescript
{
  accessorKey: "amount",
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  },
}
```

### Custom Cell Rendering
```typescript
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.getValue("status") as string;
    return <StatusBadge status={status} />;
  },
}
```

### Action Columns
```typescript
{
  id: "actions",
  header: "Actions",
  cell: ({ row }) => {
    const item = row.original;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEdit(item.id)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(item.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}
```

## Performance Considerations

*   **Client-Side Operations:** All filtering, sorting, and pagination are performed client-side. For large datasets (>1000 rows), consider implementing server-side operations.
*   **Memoization:** Consider memoizing column definitions and data to prevent unnecessary re-renders.
*   **Virtual Scrolling:** For very large datasets, consider integrating with virtual scrolling libraries.

## Common Use Cases in ClaimBot

### Claims Table
```typescript
const claimsColumns: ColumnDef<Claim>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "totalClaim", header: "Amount" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.getValue("status")} /> },
];
```

### Users Management Table
```typescript
const usersColumns: ColumnDef<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "roles", header: "Roles", cell: ({ row }) => row.getValue("roles").join(", ") },
];
```

## Troubleshooting

### Common Issues

1. **Columns not rendering:** Ensure `accessorKey` matches the data property names exactly.
2. **Sorting not working:** Check that the data type is sortable (strings, numbers, dates).
3. **Filtering not working:** Verify that `globalFilter` state is properly managed.
4. **Performance issues:** Consider memoizing columns and data, or implementing server-side operations.

### Debug Tips

```typescript
// Add this to debug table state
console.log("Table state:", table.getState());
console.log("Filtered rows:", table.getFilteredRowModel().rows.length);
console.log("Current page:", table.getState().pagination.pageIndex);
```

## Related Documentation

- **[UI Components](../ui/)** - Base UI primitives used by DataTable
- **[System Architecture](../../architecture/system-overview.md)** - Overall component architecture
- **[API Reference](../api-routes.md)** - Data sources for tables

---

**Next Steps**: Review the [LocationAutocomplete Component](location-autocomplete.md) for location input functionality.