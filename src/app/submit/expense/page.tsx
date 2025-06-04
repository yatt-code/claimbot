"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FileUploader from "@/components/FileUploader";
import { DatePicker } from "@/components/DatePicker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationTemplate, TripMode } from "@/types/location";
import SavedTripTemplate, { ISavedTripTemplate } from "@/models/SavedTripTemplate"; // Import SavedTripTemplate model
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast"; // Import toast
import { useRouter, useSearchParams } from "next/navigation"; // Import useRouter and useSearchParams
import { useState, useEffect, useCallback } from "react"; // Import useState and useEffect
import { useDebounce } from 'use-debounce';

// Define Zod schema for expense form
const expenseFormSchema = z.object({
  date: z.string().min(1, { message: "Date is required." }),
  project: z.string().optional(),
  description: z.string().optional(),
  tripMode: z.nativeEnum(TripMode, {
    errorMap: () => ({ message: "Please select a trip mode." }),
  }).optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  saveTemplateLabel: z.string().optional(), // New field for saving templates
  calculatedMileage: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? 0 : Number(val),
    z.number().min(0, { message: "Calculated mileage cannot be negative." }).optional()
  ),
  mileage: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? 0 : Number(val),
    z.number().min(0, { message: "Mileage cannot be negative." }).optional()
  ),
  toll: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? 0 : Number(val),
    z.number().min(0, { message: "Toll cannot be negative." }).optional()
  ),
  petrol: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? 0 : Number(val),
    z.number().min(0, { message: "Petrol cannot be negative." }).optional()
  ),
  meal: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? 0 : Number(val),
    z.number().min(0, { message: "Meal cannot be negative." }).optional()
  ),
  others: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? 0 : Number(val),
    z.number().min(0, { message: "Others cannot be negative." }).optional()
  ),
  attachments: z.any().optional(), // File handling
}).superRefine((data, ctx) => {
  if (data.tripMode && data.tripMode !== TripMode.CUSTOM_A_TO_B && data.tripMode !== TripMode.CUSTOM_A_TO_B_AND_BACK && !data.destination) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Destination is required for selected trip mode.",
      path: ['destination'],
    });
  }
  if ((data.tripMode === TripMode.CUSTOM_A_TO_B || data.tripMode === TripMode.CUSTOM_A_TO_B_AND_BACK) && (!data.origin || !data.destination)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Origin and Destination are required for custom trip mode.",
      path: ['origin'],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Origin and Destination are required for custom trip mode.",
      path: ['destination'],
    });
  }
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema> & { status?: string };


export default function SubmitExpensePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<ExpenseFormValues, any, ExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseFormSchema) as any,
    defaultValues: {
      date: "",
      project: "",
      description: "",
      tripMode: undefined,
      origin: "",
      destination: "",
      calculatedMileage: undefined,
      mileage: undefined,
      toll: undefined,
      petrol: undefined,
      meal: undefined,
      others: undefined,
      attachments: null,
    },
  });

  const router = useRouter(); // Initialize useRouter
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission loading
  const [locationTemplates, setLocationTemplates] = useState<LocationTemplate[]>([]);
  const [savedTripTemplates, setSavedTripTemplates] = useState<ISavedTripTemplate[]>([]); // State for saved trip templates
  const [isCalculatingMileage, setIsCalculatingMileage] = useState(false);
  const [mileageCalculationFeedback, setMileageCalculationFeedback] = useState<string | null>(null);
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false); // State for save template dialog

  const tripMode = form.watch("tripMode");
  const origin = form.watch("origin");
  const destination = form.watch("destination");

  const [debouncedOrigin] = useDebounce(origin, 500);
  const [debouncedDestination] = useDebounce(destination, 500);

  // Fetch location templates
  useEffect(() => {
    fetch('/api/location-templates')
      .then(res => res.json())
      .then(data => setLocationTemplates(data))
      .catch(error => {
        console.error("Failed to fetch location templates:", error);
        toast.error("Failed to load location templates.");
      });
  }, []);

  // Fetch saved trip templates
  const fetchSavedTripTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/saved-trip-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch saved trip templates.');
      }
      const data = await response.json();
      setSavedTripTemplates(data);
    } catch (error) {
      console.error("Failed to fetch saved trip templates:", error);
      toast.error("Failed to load saved trip templates.");
    }
  }, []);

  useEffect(() => {
    fetchSavedTripTemplates();
  }, [fetchSavedTripTemplates]);

  // Mileage calculation effect
  useEffect(() => {
    const calculateMileage = async () => {
      if (tripMode && debouncedOrigin && debouncedDestination) {
        setIsCalculatingMileage(true);
        setMileageCalculationFeedback(null);
        try {
          const response = await fetch('/api/mileage/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ origin: debouncedOrigin, destination: debouncedDestination, tripMode }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to calculate mileage.");
          }
          const data = await response.json();
          const calculatedKm = parseFloat((data.distance / 1000).toFixed(2)); // Convert meters to km
          form.setValue("calculatedMileage", calculatedKm);
          form.setValue("mileage", calculatedKm); // Auto-fill mileage field
          setMileageCalculationFeedback(`Estimated distance: ${calculatedKm} km via Google Maps`);

          if (calculatedKm > 100) {
            toast.error("Trip distance exceeds 100km. Please ensure this is accurate.");
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          toast.error(`Mileage calculation failed: ${errorMessage}`);
          setMileageCalculationFeedback(`Mileage calculation failed: ${errorMessage}`);
          form.setValue("calculatedMileage", undefined);
          form.setValue("mileage", undefined);
        } finally {
          setIsCalculatingMileage(false);
        }
      } else {
        form.setValue("calculatedMileage", undefined);
        form.setValue("mileage", undefined);
        setMileageCalculationFeedback(null);
      }
    };

    calculateMileage();
  }, [tripMode, debouncedOrigin, debouncedDestination, form]);

  // Prefill form if editing a draft
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      fetch(`/api/claims/${editId}`)
        .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch claim"))
        .then(data => {
          form.reset({
            date: data.date ? data.date.slice(0, 10) : "",
            project: data.project || "",
            description: data.description || "",
            tripMode: data.tripMode || undefined,
            origin: data.origin || "",
            destination: data.destination || "",
            calculatedMileage: data.calculatedMileage ?? undefined,
            mileage: data.expenses?.mileage ?? undefined,
            toll: data.expenses?.toll ?? undefined,
            petrol: data.expenses?.petrol ?? undefined,
            meal: data.expenses?.meal ?? undefined,
            others: data.expenses?.others ?? undefined,
            attachments: null,
            status: data.status,
          });
        })
        .catch(() => {
          toast.error("Failed to load draft for editing.");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: ExpenseFormValues): Promise<void> {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Submitting expense claim...");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    try {
      const editId = searchParams.get("edit");
      let claimResponse;
      const claimData = {
        date: values.date,
        project: values.project,
        description: values.description,
        tripMode: values.tripMode,
        origin: values.origin,
        destination: values.destination,
        calculatedMileage: values.calculatedMileage,
        expenses: {
          mileage: values.mileage ?? 0,
          toll: values.toll ?? 0,
          petrol: values.petrol ?? 0,
          meal: values.meal ?? 0,
          others: values.others ?? 0,
        },
        status: values.status,
      };

      if (editId) {
        // Update existing draft
        claimResponse = await fetch(`${baseUrl}/api/claims/${editId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(claimData),
        });
      } else {
        // Create new claim
        claimResponse = await fetch(`${baseUrl}/api/claims`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(claimData),
        });
      }

      if (!claimResponse.ok) {
        const errorData = await claimResponse.json();
        throw new Error(errorData.message || "Failed to submit expense claim.");
      }

      const claim = await claimResponse.json();
      const claimId = editId || claim._id;

      // Handle File Uploads
      const attachments = values.attachments as FileList | null;
      if (attachments && attachments.length > 0) {
        const uploadPromises = Array.from(attachments).map(async (file: File) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("claimId", claimId);

          const uploadResponse = await fetch(`${baseUrl}/api/files/upload`, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.message || `Failed to upload file: ${file.name}`);
          }
          return uploadResponse.json();
        });

        await Promise.all(uploadPromises);
      }

      toast.success("Expense claim submitted successfully!", { id: loadingToast });
      router.push("/my-submissions");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Submission failed: ${errorMessage}`, { id: loadingToast });
      console.error("Error submitting expense claim:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle loading a saved trip template
  const handleLoadTemplate = (templateId: string) => {
    const template = savedTripTemplates.find(t => t._id === templateId);
    if (template) {
      form.reset({
        ...form.getValues(), // Keep existing values for other fields
        tripMode: template.roundTrip ? TripMode.CUSTOM_ORIGIN_TO_DEST_AND_BACK : TripMode.CUSTOM_A_TO_B, // Adjust based on your TripMode enum
        origin: template.origin.name,
        destination: template.destination.name,
        calculatedMileage: undefined, // Recalculate mileage
        mileage: undefined, // Recalculate mileage
      });
      toast.success(`Loaded trip template: ${template.label}`);
    }
  };

  // Handle saving a new trip template
  const handleSaveTemplate = async () => {
    const label = form.getValues("saveTemplateLabel");
    const origin = form.getValues("origin");
    const destination = form.getValues("destination");
    const tripMode = form.getValues("tripMode");

    if (!label || !origin || !destination || !tripMode) {
      toast.error("Please fill in template name, origin, destination, and trip mode to save as template.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving trip template...");

    try {
      // For simplicity, assuming origin and destination are addresses that need geocoding
      // In a real scenario, you might store lat/lng directly or have a more robust location picker
      const geocodeLocation = async (address: string) => {
        const response = await fetch(`/api/mileage/geocode?address=${encodeURIComponent(address)}`);
        if (!response.ok) {
          throw new Error(`Failed to geocode address: ${address}`);
        }
        const data = await response.json();
        if (!data.lat || !data.lng) {
          throw new Error(`Could not find coordinates for address: ${address}`);
        }
        return { address, lat: data.lat, lng: data.lng };
      };

      const originLocation = await geocodeLocation(origin);
      const destinationLocation = await geocodeLocation(destination);

      const newTemplate = {
        origin: originLocation,
        destination: destinationLocation,
        roundTrip: tripMode === TripMode.CUSTOM_ORIGIN_TO_DEST_AND_BACK || tripMode === TripMode.CUSTOM_A_TO_B_AND_BACK,
        label,
      };

      const response = await fetch('/api/saved-trip-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save trip template.");
      }

      toast.success("Trip template saved successfully!", { id: loadingToast });
      form.setValue("saveTemplateLabel", ""); // Clear label input
      setIsSaveTemplateDialogOpen(false); // Close dialog
      fetchSavedTripTemplates(); // Refresh list
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Failed to save template: ${errorMessage}`, { id: loadingToast });
      console.error("Error saving trip template:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">📥 Expense Claim Form</h1>

      <div className="mb-4 flex space-x-2">
        <Select onValueChange={handleLoadTemplate}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Load Saved Trip" />
          </SelectTrigger>
          <SelectContent>
            {savedTripTemplates.map((template) => (
              <SelectItem key={template._id.toString()} value={template._id.toString()}>
                {template.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">💾 Save as Template</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Save Trip as Template</DialogTitle>
              <DialogDescription>
                Give your trip template a name. This will save the current origin, destination, and trip mode.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template-name" className="text-right">
                  Template Name
                </Label>
                <Input
                  id="template-name"
                  value={form.watch("saveTemplateLabel") || ""}
                  onChange={(e) => form.setValue("saveTemplateLabel", e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleSaveTemplate} disabled={isSubmitting}>
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Date</FormLabel>
                <DatePicker field={field} label="Pick a date" />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Project</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="grid gap-2 md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tripMode"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Trip Mode</FormLabel>
                <Select onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("origin", "");
                  form.setValue("destination", "");
                  form.setValue("calculatedMileage", undefined);
                  form.setValue("mileage", undefined);
                  setMileageCalculationFeedback(null);
                }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trip mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TripMode).map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {(tripMode === TripMode.CUSTOM_A_TO_B || tripMode === TripMode.CUSTOM_A_TO_B_AND_BACK) && (
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Origin</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {tripMode && (
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    {(tripMode === TripMode.CUSTOM_A_TO_B || tripMode === TripMode.CUSTOM_A_TO_B_AND_BACK) ? (
                      <Input {...field} />
                    ) : (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationTemplates.map((loc) => (
                            <SelectItem key={loc._id} value={loc.address}>
                              {loc.name} ({loc.address})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Mileage (km)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    readOnly={true} // Make mileage field read-only
                    disabled={isCalculatingMileage}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                {isCalculatingMileage && <p className="text-sm text-gray-500">Calculating mileage...</p>}
                {mileageCalculationFeedback && <p className="text-sm text-gray-500">{mileageCalculationFeedback}</p>}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toll"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Toll</FormLabel>
                <FormControl>
                   <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="petrol"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Petrol</FormLabel>
                <FormControl>
                   <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meal"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Meal</FormLabel>
                <FormControl>
                   <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="others"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Others</FormLabel>
                <FormControl>
                   <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="attachments"
            render={({ field }) => (
              <FormItem className="grid gap-2 md:col-span-2">
                <FormControl>
                  <FileUploader id="attachments" label="Attachments" multiple field={field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex space-x-4 mt-4 md:col-span-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                form.handleSubmit((values) => onSubmit({ ...values, status: 'draft' }))();
              }}
            >
              💾 Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isCalculatingMileage}
              onClick={() => {
                form.handleSubmit((values) => onSubmit({ ...values, status: 'submitted' }))();
              }}
            >
              🚀 Submit Claim
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}