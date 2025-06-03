import React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define the PendingItem type based on the companion spec
export interface PendingItem {
  user: string;
  type: "Expense" | "Overtime";
  date: string;
  // Assuming an ID is needed for the key and potentially for navigation
  id: string;
}

interface PendingSubmissionsListProps {
  submissions: PendingItem[];
}

const PendingSubmissionsList: React.FC<PendingSubmissionsListProps> = ({ submissions }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              No pending submissions.
            </TableCell>
          </TableRow>
        ) : (
          submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>{submission.user}</TableCell>
              <TableCell>{submission.type}</TableCell>
              <TableCell>{submission.date}</TableCell>
              <TableCell>
                <Link
                  href={`/admin/approvals/${submission.id}`}
                  className="text-blue-600 hover:underline inline-flex items-center space-x-1"
                >
                  <span>🔍</span>
                  <span>Review</span>
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default PendingSubmissionsList;