'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/components/AdminLayout';
import { useRBAC } from '@/hooks/useRBAC';
import { toast } from 'react-hot-toast';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  address: z.string().min(5, {
    message: 'Address must be at least 5 characters.',
  }),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

type NewLocationFormValues = z.infer<typeof formSchema>;

export default function NewLocationPage() {
  const router = useRouter();
  const { isAdmin, isLoaded: rbacLoaded } = useRBAC();
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const form = useForm<NewLocationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      lat: 0,
      lng: 0,
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && autocompleteInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        { types: ['address'] }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          form.setValue('address', place.formatted_address || '');
          form.setValue('lat', place.geometry.location.lat());
          form.setValue('lng', place.geometry.location.lng());
        }
      });
    }
  }, [form]);

  if (!rbacLoaded) {
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

  const onSubmit = async (values: NewLocationFormValues) => {
    try {
      const response = await fetch('/api/location-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create location template');
      }

      toast.success('Location template created successfully.');
      router.push('/admin/locations');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during creation.');
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Create New Location Template</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="New Office Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Start typing an address..."
                      {...field}
                      ref={autocompleteInputRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} onChange={event => field.onChange(parseFloat(event.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lng"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} onChange={event => field.onChange(parseFloat(event.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex space-x-4">
              <Button type="submit">Create Location</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/locations')}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}