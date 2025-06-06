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
import { IAdminTripTemplate } from '@/models/AdminTripTemplate'; // Import the new model
import useSWR from 'swr';
import { toast } from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminTripTemplatesPage() {
  const { hasPermission, isLoaded: rbacLoaded } = useRBAC();
  const { data: adminTripTemplates, error, isLoading } = useSWR<IAdminTripTemplate[]>('/api/admin/trip-templates', fetcher);
  const [isDeleting, setIsDeleting] = useState(false);

  const canAccess = hasPermission('admin:access:trip-templates');

  if (!rbacLoaded || isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10">Loading...</div>
      </AdminLayout>
    );
  }

  if (!canAccess) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10">Access Denied</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10">Error loading admin trip templates: {error.message}</div>
      </AdminLayout>
    );
  }

  const handleDelete = async (_id: string) => {
    if (!confirm('Are you sure you want to delete this admin trip template?')) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/trip-templates/${_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete admin trip template');
      }
      toast.success('Admin trip template deleted successfully.');
      window.location.reload(); // Simple reload to reflect changes
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<IAdminTripTemplate>[] = [
    {
      accessorKey: 'label',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Label
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'origin.address',
      header: 'Origin Address',
    },
    {
      accessorKey: 'destination.address',
      header: 'Destination Address',
    },
    {
      accessorKey: 'roundTrip',
      header: 'Round Trip',
      cell: ({ row }) => (row.original.roundTrip ? 'Yes' : 'No'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const template = row.original;
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
                <Link href={`/admin/trip-templates/${template._id!}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(template._id!.toString())} disabled={isDeleting}>
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
        <h1 className="text-3xl font-bold mb-6">Admin Trip Templates</h1>
        <div className="flex justify-end mb-4">
          <Link href="/admin/trip-templates/new">
            <Button>New Trip Template</Button>
          </Link>
        </div>
        <DataTable columns={columns} data={adminTripTemplates || []} />
      </div>
    </AdminLayout>
  );
}