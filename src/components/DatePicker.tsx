"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  field: {
    value: string;
    onChange: (value: string) => void;
  };
  label: string;
  disabled?: boolean; // Add disabled prop
}

export function DatePicker({ field, label, disabled }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal", // Adjusted width
            !field.value && "text-muted-foreground"
          )}
          disabled={disabled} // Pass disabled prop to Button
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {field.value ? format(new Date(field.value), "PPP") : <span>{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={field.value ? new Date(field.value) : undefined}
          onSelect={(date) => {
            // Use timezone-safe date formatting to avoid off-by-one issues
            if (date) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              field.onChange(`${year}-${month}-${day}`);
            } else {
              field.onChange('');
            }
          }}
          initialFocus
          disabled={disabled} // Pass disabled prop to Calendar
        />
      </PopoverContent>
    </Popover>
  )
}