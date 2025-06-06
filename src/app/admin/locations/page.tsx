'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/DataTable';
import AdminLayout from '@/components/AdminLayout';
import { useRBAC } from '@/hooks/useRBAC';
import { LocationTemplate } from '@/types/location';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LocationTemplatesPage() {
  const { isAdmin, isLoaded: rbacLoaded } = useRBAC();
  const { data: locationTemplates, error, isLoading } = useSWR<LocationTemplate[]>('/api/location-templates', fetcher);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!rbacLoaded || isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10">Loading...</div>
      </AdminLayout>
    );
  }

  if (!isAdmin()) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10">Access Denied</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10">Error loading location templates: {error.message}</div>
      </AdminLayout>
    );
  }

  const handleDelete = async (_id: string) => {
    if (!confirm('Are you sure you want to delete this location template?')) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/location-templates/${_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete location template');
      }
      toast.success('Location template deleted successfully.');
      // Optionally revalidate SWR cache here if needed, or rely on a full page refresh
      // mutate('/api/location-templates');
      window.location.reload(); // Simple reload to reflect changes
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<LocationTemplate>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
    },
    {
      accessorKey: 'coordinates',
      header: 'Coordinates',
      cell: ({ row }) => {
        const lat = row.original.lat;
        const lng = row.original.lng;
        return lat && lng ? `${lat}, ${lng}` : 'N/A';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const location = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Link href={`/admin/locations/${location._id!}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(location._id!)} disabled={isDeleting}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Location Templates</h1>
        <div className="flex justify-end mb-4">
          <Link href="/admin/locations/new">
            <Button>New Location</Button>
          </Link>
        </div>
        <DataTable columns={columns} data={locationTemplates || []} />
      </div>
    </AdminLayout>
  );
}