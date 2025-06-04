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
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import AdminLayout from '@/components/AdminLayout';
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { Location } from '@/types/location'; // Import Location type

const locationSchema = z.object({
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const formSchema = z.object({
  label: z.string().min(2, { message: 'Label must be at least 2 characters.' }),
  origin: locationSchema,
  destination: locationSchema,
  roundTrip: z.boolean(), // Changed to z.boolean()
});

type NewAdminTripTemplateFormValues = z.infer<typeof formSchema>;

export default function NewAdminTripTemplatePage() {
  const router = useRouter();
  const { hasPermission, isLoaded: rbacLoaded } = useRBAC();
  const { addToast } = useToast();

  const originAutocompleteInputRef = useRef<HTMLInputElement>(null);
  const destinationAutocompleteInputRef = useRef<HTMLInputElement>(null);
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const form = useForm<NewAdminTripTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      origin: { address: '', lat: 0, lng: 0 },
      destination: { address: '', lat: 0, lng: 0 },
      roundTrip: false,
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      if (originAutocompleteInputRef.current) {
        originAutocompleteRef.current = new window.google.maps.places.Autocomplete(
          originAutocompleteInputRef.current,
          { types: ['address'] }
        );
        originAutocompleteRef.current.addListener('place_changed', () => {
          const place = originAutocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            form.setValue('origin.address', place.formatted_address || '');
            form.setValue('origin.lat', place.geometry.location.lat());
            form.setValue('origin.lng', place.geometry.location.lng());
          }
        });
      }

      if (destinationAutocompleteInputRef.current) {
        destinationAutocompleteRef.current = new window.google.maps.places.Autocomplete(
          destinationAutocompleteInputRef.current,
          { types: ['address'] }
        );
        destinationAutocompleteRef.current.addListener('place_changed', () => {
          const place = destinationAutocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            form.setValue('destination.address', place.formatted_address || '');
            form.setValue('destination.lat', place.geometry.location.lat());
            form.setValue('destination.lng', place.geometry.location.lng());
          }
        });
      }
    }
  }, [form]);

  const canAccess = hasPermission('admin:access:trip-templates');

  if (!rbacLoaded) {
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

  const onSubmit = async (values: NewAdminTripTemplateFormValues) => {
    try {
      const response = await fetch('/api/admin/trip-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create admin trip template');
      }

      addToast({
        title: 'Success',
        description: 'Admin trip template created successfully.',
      });
      router.push('/admin/trip-templates');
    } catch (err: any) {
      addToast({
        title: 'Error',
        description: err.message || 'An error occurred during creation.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Create New Admin Trip Template</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Office to KPKT" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <fieldset className="border p-4 rounded-lg space-y-4">
              <legend className="text-lg font-semibold px-2">Origin</legend>
              <FormField
                control={form.control}
                name="origin.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Start typing origin address..."
                        {...field}
                        ref={originAutocompleteInputRef}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="origin.lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} onChange={event => field.onChange(parseFloat(event.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="origin.lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} onChange={event => field.onChange(parseFloat(event.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <fieldset className="border p-4 rounded-lg space-y-4">
              <legend className="text-lg font-semibold px-2">Destination</legend>
              <FormField
                control={form.control}
                name="destination.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Start typing destination address..."
                        {...field}
                        ref={destinationAutocompleteInputRef}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination.lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} onChange={event => field.onChange(parseFloat(event.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination.lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} onChange={event => field.onChange(parseFloat(event.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <FormField
              control={form.control}
              name="roundTrip"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Is this a round trip?
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="flex space-x-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Trip Template
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/trip-templates')}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}