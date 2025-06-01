'use client'; // This is a client component

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Define the schema for new user validation
const newUserSchema = z.object({
  clerkId: z.string().min(1, { message: "Clerk ID is required." }),
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.enum(['staff', 'manager', 'admin'], {
    errorMap: () => ({ message: "Please select a valid role." }),
  }),
  // Add other fields as needed, matching the backend POST handler
  department: z.string().optional(),
  designation: z.string().optional(),
  salary: z.number().optional(),
});

type NewUserFormData = z.infer<typeof newUserSchema>;

export default function AdminNewUserPage() {
  const router = useRouter();

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      clerkId: '',
      name: '',
      email: '',
      role: 'staff', // Default role
      department: '',
      designation: '',
      salary: undefined,
    },
  });

  const onSubmit = async (data: NewUserFormData) => {
    const loadingToast = toast.loading('Creating user...');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user.');
      }

      await response.json(); // Consume the response
      toast.success('User created successfully!', { id: loadingToast });
      router.push('/admin/users'); // Redirect back to user list
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to create user: ${errorMessage}`, { id: loadingToast });
      console.error("Error creating user:", err);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">➕ Add New User</h1>
      <div className="bg-white p-6 rounded shadow-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="clerkId" className="block text-gray-700 font-bold mb-2">Clerk ID:</label>
            <Controller
              name="clerkId"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  id="clerkId"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.clerkId ? 'border-red-500' : ''}`}
                />
              )}
            />
            {errors.clerkId && <p className="text-red-500 text-xs italic">{errors.clerkId.message}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Name:</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  id="name"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.name ? 'border-red-500' : ''}`}
                />
              )}
            />
            {errors.name && <p className="text-red-500 text-xs italic">{errors.name.message}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-bold mb-2">Email:</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  id="email"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.email ? 'border-red-500' : ''}`}
                />
              )}
            />
            {errors.email && <p className="text-red-500 text-xs italic">{errors.email.message}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="role" className="block text-gray-700 font-bold mb-2">Role:</label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="role"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.role ? 'border-red-500' : ''}`}
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            />
            {errors.role && <p className="text-red-500 text-xs italic">{errors.role.message}</p>}
          </div>

          {/* Optional fields - can be added later based on requirements */}
          {/*
          <div className="mb-4">
            <label htmlFor="department" className="block text-gray-700 font-bold mb-2">Department:</label>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  id="department"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.department ? 'border-red-500' : ''}`}
                />
              )}
            />
            {errors.department && <p className="text-red-500 text-xs italic">{errors.department.message}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="designation" className="block text-gray-700 font-bold mb-2">Designation:</label>
            <Controller
              name="designation"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  id="designation"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.designation ? 'border-red-500' : ''}`}
                />
              )}
            />
            {errors.designation && <p className="text-red-500 text-xs italic">{errors.designation.message}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="salary" className="block text-gray-700 font-bold mb-2">Salary:</label>
            <Controller
              name="salary"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  id="salary"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.salary ? 'border-red-500' : ''}`}
                  step="0.01"
                />
              )}
            />
            {errors.salary && <p className="text-red-500 text-xs italic">{errors.salary.message}</p>}
          </div>
          */}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/users')}
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}