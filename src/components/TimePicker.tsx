import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // Assuming Button might be useful for the trigger
import { ControllerRenderProps, FieldValues, FieldPath } from "react-hook-form";

// TODO: Refine Time Picker component UI and logic

interface TimePickerProps<TFieldValues extends FieldValues = FieldValues> {
  field: ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>>;
  label: string;
}

export function TimePicker<TFieldValues extends FieldValues>({
  field,
  label,
}: TimePickerProps<TFieldValues>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          {field.value ? field.value : "Pick a time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {/* Simple HTML time input within the popover */}
        <div className="p-4">
          <Label htmlFor="time">{label}</Label>
          <Input
            id="time"
            type="time"
            value={field.value || ''} // Ensure controlled component
            onChange={field.onChange}
            className="mt-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}