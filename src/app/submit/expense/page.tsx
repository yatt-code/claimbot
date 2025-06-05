"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FileUploader from "@/components/FileUploader";
import { DatePicker } from "@/components/DatePicker";
import LocationAutocomplete, { LocationData } from "@/components/LocationAutocomplete";
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
  SelectGroup, // Import SelectGroup
  SelectItem,
  SelectLabel, // Import SelectLabel
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ISavedTripTemplate } from "@/models/SavedTripTemplate"; // Import SavedTripTemplate model
import { IAdminTripTemplate } from "@/models/AdminTripTemplate"; // Import AdminTripTemplate model
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
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
  tripMode: z.enum(['default', 'custom']).default('default'), // Default = From Office, Custom = Custom origin
  roundTrip: z.boolean().default(false), // Return trip flag
  origin: z.string().optional(),
  destination: z.string().optional(),
  originLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    formatted_address: z.string(),
  }).optional(),
  destinationLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    formatted_address: z.string(),
  }).optional(),
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
  // Destination is always required
  if (!data.destination) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Destination is required.",
      path: ['destination'],
    });
  }
  
  // For custom mode, origin is required
  if (data.tripMode === 'custom' && !data.origin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Origin is required for custom trips.",
      path: ['origin'],
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
      tripMode: "default" as const,
      roundTrip: false,
      origin: "",
      destination: "",
      originLocation: undefined,
      destinationLocation: undefined,
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
  const [savedTripTemplates, setSavedTripTemplates] = useState<ISavedTripTemplate[]>([]); // State for saved personal trip templates
  const [adminTripTemplates, setAdminTripTemplates] = useState<IAdminTripTemplate[]>([]); // State for admin trip templates
  const [isCalculatingMileage, setIsCalculatingMileage] = useState(false);
  const [mileageCalculationFeedback, setMileageCalculationFeedback] = useState<string | null>(null);
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false); // State for save template dialog
  const [isLoadingEditData, setIsLoadingEditData] = useState(false); // State to prevent clearing during form load
  const [protectMileageField, setProtectMileageField] = useState(false); // Additional protection for mileage field

  const tripMode = form.watch("tripMode");
  const roundTrip = form.watch("roundTrip");
  const origin = form.watch("origin");
  const destination = form.watch("destination");
  const originLocation = form.watch("originLocation");
  const destinationLocation = form.watch("destinationLocation");

  const [debouncedOrigin] = useDebounce(origin, 500);
  const [debouncedDestination] = useDebounce(destination, 500);

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

  // Fetch admin trip templates
  const fetchAdminTripTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/trip-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch admin trip templates.');
      }
      const data = await response.json();
      setAdminTripTemplates(data);
    } catch (error) {
      console.error("Failed to fetch admin trip templates:", error);
      toast.error("Failed to load admin trip templates.");
    }
  }, []);

  useEffect(() => {
    fetchAdminTripTemplates();
  }, [fetchAdminTripTemplates]);

  // Handle office location population for default mode
  useEffect(() => {
    if (tripMode === 'default') {
      try {
        // Use client-side environment variables or hardcoded office location
        const officeLat = process.env.NEXT_PUBLIC_OFFICE_LAT || '2.91074';
        const officeLng = process.env.NEXT_PUBLIC_OFFICE_LNG || '101.63971';
        const officeName = process.env.NEXT_PUBLIC_OFFICE_NAME || 'Object Expression Sdn. Bhd.';
        
        const lat = parseFloat(officeLat);
        const lng = parseFloat(officeLng);
        
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid office coordinates');
        }
        
        form.setValue("origin", officeName);
        form.setValue("originLocation", {
          lat: lat,
          lng: lng,
          formatted_address: officeName,
        });
      } catch (error) {
        console.error("Failed to get office location:", error);
        toast.error("Failed to load office location. Please use custom mode.");
      }
    } else {
      // Clear origin for custom mode
      form.setValue("origin", "");
      form.setValue("originLocation", undefined);
    }
  }, [tripMode, form]);

  // Helper function to geocode address text to coordinates
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  // Mileage calculation effect
  useEffect(() => {
    const calculateMileage = async () => {
      
      // Determine the origin and destination for calculation
      let calcOrigin: string | { lat: number; lng: number } | undefined;
      let calcDestination: string | { lat: number; lng: number } | undefined;

      // Handle origin calculation
      if (tripMode === 'default') {
        // Use office location coordinates directly
        try {
          const officeLat = process.env.NEXT_PUBLIC_OFFICE_LAT || '2.91074';
          const officeLng = process.env.NEXT_PUBLIC_OFFICE_LNG || '101.63971';
          const lat = parseFloat(officeLat);
          const lng = parseFloat(officeLng);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            calcOrigin = { lat, lng };
          } else {
            console.error("Invalid office coordinates for mileage calculation");
            return;
          }
        } catch (error) {
          console.error("Failed to get office location for calculation:", error);
          return;
        }
      } else if (originLocation) {
        // Use structured origin location (from autocomplete)
        calcOrigin = { lat: originLocation.lat, lng: originLocation.lng };
      } else if (debouncedOrigin && debouncedOrigin.trim().length >= 3) {
        // Fallback: Geocode the text address for origin
        const geocodedOrigin = await geocodeAddress(debouncedOrigin.trim());
        calcOrigin = geocodedOrigin || undefined;
      } else {
        calcOrigin = undefined;
      }

      // Handle destination calculation
      if (destinationLocation) {
        // Use structured destination location (from autocomplete)
        calcDestination = { lat: destinationLocation.lat, lng: destinationLocation.lng };
      } else if (debouncedDestination && debouncedDestination.trim().length >= 3) {
        // Fallback: Geocode the text address for destination
        const geocodedDestination = await geocodeAddress(debouncedDestination.trim());
        calcDestination = geocodedDestination || undefined;
      } else {
        calcDestination = undefined;
      }

      // Only calculate if both origin and destination have coordinates
      if (calcOrigin && calcDestination) {
        setIsCalculatingMileage(true);
        setMileageCalculationFeedback(null);
        try {
          const response = await fetch('/api/mileage/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              origin: calcOrigin,
              destination: calcDestination,
              isRoundTrip: roundTrip,
            }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to calculate mileage.");
          }
          const data = await response.json();
          const calculatedKm = parseFloat((data.distance / 1000).toFixed(2)); // Convert meters to km
          form.setValue("calculatedMileage", calculatedKm);
          form.setValue("mileage", calculatedKm); // Auto-fill mileage field
          setMileageCalculationFeedback(`Estimated distance: ${calculatedKm} km (via Google Maps)`);

          // Validate distance based on trip type
          const maxDistance = roundTrip ? 200 : 100;
          const tripType = roundTrip ? "round trip" : "one-way trip";
          
          if (calculatedKm > maxDistance) {
            toast.error(`${tripType} distance exceeds ${maxDistance}km. Please ensure this is accurate.`);
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
        // Only clear mileage when not loading edit data and not protecting the field
        if (!isLoadingEditData && !protectMileageField) {
          form.setValue("calculatedMileage", undefined);
          form.setValue("mileage", undefined);
          setMileageCalculationFeedback(null);
        }
      }
    };

    calculateMileage();
  }, [tripMode, roundTrip, debouncedOrigin, debouncedDestination, originLocation, destinationLocation, form, isLoadingEditData, protectMileageField]);

  // Prefill form if editing a draft
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      setIsLoadingEditData(true);
      setProtectMileageField(true);
      fetch(`/api/claims/${editId}`)
        .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch claim"))
        .then(data => {
          console.log("=== EDITING CLAIM DATA ===");
          console.log("Loaded claim data:", data);
          console.log("roundTrip value:", data.roundTrip);
          console.log("mileage value:", data.expenses?.mileage);
          console.log("calculatedMileage value:", data.calculatedMileage);
          console.log("=========================");
          
          // For existing claims without roundTrip field, infer it from mileage calculation
          // Since we can't reliably determine trip type from stored data alone,
          // we'll default to false and require manual setting by user
          let inferredRoundTrip = data.roundTrip ?? false;
          
          // However, if the mileage seems suspiciously high (> 10km), assume round trip
          if (data.roundTrip === undefined && data.expenses?.mileage && data.expenses.mileage > 10) {
            inferredRoundTrip = true;
            console.log("Inferring roundTrip=true for high mileage:", {
              storedMileage: data.expenses.mileage,
              inferredRoundTrip
            });
          }
          

          form.reset({
            date: data.date ? data.date.slice(0, 10) : "",
            project: data.project || "",
            description: data.description || "",
            tripMode: data.tripMode || "default",
            roundTrip: inferredRoundTrip ?? false,
            origin: data.origin || "",
            destination: data.destination || "",
            originLocation: data.originLocation || undefined,
            destinationLocation: data.destinationLocation || undefined,
            calculatedMileage: data.calculatedMileage ?? undefined,
            mileage: data.expenses?.mileage ?? undefined,
            toll: data.expenses?.toll ?? undefined,
            petrol: data.expenses?.petrol ?? undefined,
            meal: data.expenses?.meal ?? undefined,
            others: data.expenses?.others ?? undefined,
            attachments: null,
            status: data.status,
          });
          
          // Force update the form to ensure UI reflects the loaded values
          setTimeout(() => {
            console.log("Form values after reset:", form.getValues());
            console.log("Mileage field specifically:", form.getValues().mileage);
            console.log("IsLoadingEditData flag:", isLoadingEditData);
            setIsLoadingEditData(false); // Clear loading flag after form is populated
            
            // Force form re-render to ensure UI reflects the values and clear validation errors
            form.trigger();
            
            // For custom trips, ensure validation is triggered to clear any errors
            if (data.tripMode === 'custom' && data.origin) {
              setTimeout(() => {
                form.trigger('origin'); // Trigger validation for origin field
              }, 100);
            }
          }, 200);
        })
        .catch(() => {
          toast.error("Failed to load draft for editing.");
          setIsLoadingEditData(false); // Clear loading flag on error
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
      
      // DEBUG: Log form data before submission
      console.log("=== FORM SUBMISSION DEBUG ===");
      console.log("Round Trip Flag:", values.roundTrip);
      console.log("Calculated Mileage from API:", values.calculatedMileage);
      console.log("Mileage field value:", values.mileage);
      console.log("Trip Mode:", values.tripMode);
      console.log("=============================");
      
      const claimData = {
        date: values.date,
        project: values.project,
        description: values.description,
        tripMode: values.tripMode,
        roundTrip: values.roundTrip,
        origin: values.origin,
        destination: values.destination,
        originLocation: values.originLocation,
        destinationLocation: values.destinationLocation,
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
  const handleLoadTemplate = (value: string) => {
    const [type, templateId] = value.split('-');
    let template: ISavedTripTemplate | IAdminTripTemplate | undefined;

    if (type === 'personal') {
      template = savedTripTemplates.find(t => t._id?.toString() === templateId);
    } else if (type === 'admin') {
      template = adminTripTemplates.find(t => t._id?.toString() === templateId);
    }

    if (template) {
      form.reset({
        ...form.getValues(), // Keep existing values for other fields
        tripMode: 'custom', // Templates are always custom mode
        origin: template.origin.address,
        destination: template.destination.address,
        originLocation: {
          lat: template.origin.lat,
          lng: template.origin.lng,
          formatted_address: template.origin.address,
        },
        destinationLocation: {
          lat: template.destination.lat,
          lng: template.destination.lng,
          formatted_address: template.destination.address,
        },
        roundTrip: template.roundTrip,
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
    const originLocation = form.getValues("originLocation");
    const destinationLocation = form.getValues("destinationLocation");
    const roundTrip = form.getValues("roundTrip");

    if (!label || !origin || !destination) {
      toast.error("Please fill in template name, origin, and destination to save as template.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving trip template...");

    try {
      // Use structured location data if available, otherwise geocode
      let finalOriginLocation;
      let finalDestinationLocation;

      if (originLocation) {
        finalOriginLocation = {
          address: origin,
          lat: originLocation.lat,
          lng: originLocation.lng,
        };
      } else {
        // Fallback to geocoding
        const response = await fetch(`/api/mileage/geocode?address=${encodeURIComponent(origin)}`);
        if (!response.ok) {
          throw new Error(`Failed to geocode origin address: ${origin}`);
        }
        const data = await response.json();
        if (!data.lat || !data.lng) {
          throw new Error(`Could not find coordinates for origin address: ${origin}`);
        }
        finalOriginLocation = { address: origin, lat: data.lat, lng: data.lng };
      }

      if (destinationLocation) {
        finalDestinationLocation = {
          address: destination,
          lat: destinationLocation.lat,
          lng: destinationLocation.lng,
        };
      } else {
        // Fallback to geocoding
        const response = await fetch(`/api/mileage/geocode?address=${encodeURIComponent(destination)}`);
        if (!response.ok) {
          throw new Error(`Failed to geocode destination address: ${destination}`);
        }
        const data = await response.json();
        if (!data.lat || !data.lng) {
          throw new Error(`Could not find coordinates for destination address: ${destination}`);
        }
        finalDestinationLocation = { address: destination, lat: data.lat, lng: data.lng };
      }

      const newTemplate = {
        origin: finalOriginLocation,
        destination: finalDestinationLocation,
        roundTrip: roundTrip, // Use the form's roundTrip value
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
            <SelectGroup>
              <SelectLabel>Personal Templates</SelectLabel>
              {savedTripTemplates.map((template) => {
                const templateId = template._id?.toString() || '';
                return (
                  <SelectItem
                    key={`personal-${templateId}`}
                    value={`personal-${templateId}`}
                  >
                    {template.label}
                  </SelectItem>
                );
              })}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Admin Templates</SelectLabel>
              {adminTripTemplates.map((template) => {
                const templateId = template._id?.toString() || '';
                return (
                  <SelectItem
                    key={`admin-${templateId}`}
                    value={`admin-${templateId}`}
                  >
                    {template.label}
                  </SelectItem>
                );
              })}
            </SelectGroup>
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

          {/* Trip Mode Selector */}
          <FormField
            control={form.control}
            name="tripMode"
            render={({ field }) => (
              <FormItem className="grid gap-2 md:col-span-2">
                <FormLabel>Trip Mode</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trip mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">From Office (Default)</SelectItem>
                      <SelectItem value="custom">Custom Origin</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Origin Field - Only visible for custom mode, auto-filled for default mode */}
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>
                  Origin
                  {tripMode === 'default' && (
                    <span className="text-sm text-gray-500 font-normal ml-2">(Office Location)</span>
                  )}
                </FormLabel>
                <FormControl>
                  <LocationAutocomplete
                    key={`origin-${tripMode}`}
                    id="origin-field"
                    value={field.value || ''}
                    onChange={(value) => {
                      field.onChange(value);
                      // Clear validation errors when user types
                      if (value.trim()) {
                        form.clearErrors('origin');
                      }
                      // Only clear mileage when user actually changes the field, not during form load
                      if (!isLoadingEditData) {
                        form.setValue("calculatedMileage", undefined);
                        form.setValue("mileage", undefined);
                        form.setValue("originLocation", undefined);
                        setMileageCalculationFeedback(null);
                      }
                    }}
                    onLocationSelect={(locationData: LocationData) => {
                      form.setValue("originLocation", locationData);
                      // Clear validation errors when user selects location
                      form.clearErrors('origin');
                      // Only clear mileage when user actually changes the field, not during form load
                      if (!isLoadingEditData) {
                        form.setValue("calculatedMileage", undefined);
                        form.setValue("mileage", undefined);
                        setMileageCalculationFeedback(null);
                      }
                    }}
                    placeholder={tripMode === 'default' ? "Office location (auto-filled)" : "Enter origin address"}
                    disabled={tripMode === 'default'}
                    readOnly={tripMode === 'default'}
                    className={tripMode === 'default' ? "bg-gray-100 text-gray-500" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Destination Field - Always visible */}
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Destination</FormLabel>
                <FormControl>
                  <LocationAutocomplete
                    id="destination-field"
                    value={field.value || ''}
                    onChange={(value) => {
                      field.onChange(value);
                      // Only clear mileage when user actually changes the field, not during form load
                      if (!isLoadingEditData) {
                        form.setValue("calculatedMileage", undefined);
                        form.setValue("mileage", undefined);
                        form.setValue("destinationLocation", undefined);
                        setMileageCalculationFeedback(null);
                        // Clear protection when user actively changes destination
                        setProtectMileageField(false);
                      }
                    }}
                    onLocationSelect={(locationData: LocationData) => {
                      form.setValue("destinationLocation", locationData);
                      // Only clear mileage when user actually changes the field, not during form load
                      if (!isLoadingEditData) {
                        form.setValue("calculatedMileage", undefined);
                        form.setValue("mileage", undefined);
                        setMileageCalculationFeedback(null);
                      }
                    }}
                    placeholder="Enter destination address"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Round Trip Checkbox */}
          <FormField
            control={form.control}
            name="roundTrip"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked: boolean) => { // Explicitly type 'checked' as boolean
                      field.onChange(checked);
                      // Clear mileage calculation feedback when roundTrip changes
                      form.setValue("calculatedMileage", undefined);
                      form.setValue("mileage", undefined);
                      setMileageCalculationFeedback(null);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Return Trip (Origin to Destination and Back)
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

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
                    readOnly // Make mileage field read-only
                    disabled={true} // Always disabled for user interaction
                    className="bg-gray-100 text-gray-500 cursor-not-allowed" // Greyed out appearance
                    onChange={(e) => {
                      // Allow form to update internally, but prevent user input
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                {isCalculatingMileage && <p className="text-sm text-blue-600">Calculating mileage...</p>}
                {mileageCalculationFeedback && (
                  <p className="text-sm text-gray-600">
                    {mileageCalculationFeedback}
                    {mileageCalculationFeedback.includes("Google Maps") && (
                      <span className="ml-1 text-xs text-gray-500">(Calculated via Google Maps API)</span>
                    )}
                  </p>
                )}
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