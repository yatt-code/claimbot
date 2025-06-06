'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useSWR from 'swr';
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
import { Checkbox } from '@/components/ui/checkbox';
import AdminLayout from '@/components/AdminLayout';
import { useRBAC } from '@/hooks/useRBAC';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { IAdminTripTemplate } from '@/models/AdminTripTemplate'; // Import the new model

const locationSchema = z.object({
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const formSchema = z.object({
  label: z.string().min(2, { message: 'Label must be at least 2 characters.' }),
  origin: locationSchema,
  destination: locationSchema,
  roundTrip: z.boolean(),
});

type AdminTripTemplateFormValues = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EditAdminTripTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { hasPermission, isLoaded: rbacLoaded } = useRBAC();

  const originAutocompleteInputRef = useRef<HTMLInputElement>(null);
  const destinationAutocompleteInputRef = useRef<HTMLInputElement>(null);
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { data: template, error, isLoading } = useSWR<IAdminTripTemplate>(
    id ? `/api/admin/trip-templates/${id}` : null,
    fetcher
  );

  const form = useForm<AdminTripTemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      origin: { address: '', lat: 0, lng: 0 },
      destination: { address: '', lat: 0, lng: 0 },
      roundTrip: false,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        label: template.label,
        origin: template.origin,
        destination: template.destination,
        roundTrip: template.roundTrip,
      });
    }
  }, [template, form]);

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
        <div className="container mx-auto py-10">Error loading template: {error.message}</div>
      </AdminLayout>
    );
  }

  if (!template) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10">Template not found.</div>
      </AdminLayout>
    );
  }

  const onSubmit = async (values: AdminTripTemplateFormValues) => {
    try {
      const response = await fetch(`/api/admin/trip-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update admin trip template');
      }

      toast.success('Admin trip template updated successfully.');
      router.push('/admin/trip-templates');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred during update.');
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Edit Admin Trip Template</h1>
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
                Save Changes
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