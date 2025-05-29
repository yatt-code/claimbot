import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

interface Submission {
  _id: string; // Assuming an ID for linking to detail view
  date: string;
  type: "Expense" | "Overtime";
  status: "Approved" | "Pending" | "Rejected" | "Draft";
  total: number; // Assuming total is a number for display
}

interface RecentSubmissionsTableProps {
  submissions: Submission[];
}

const RecentSubmissionsTable: React.FC<RecentSubmissionsTableProps> = ({ submissions }) => {
  return (
    <Table>
      <TableCaption>A list of your recent submissions.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total (RM)</TableHead>
          <TableHead>View</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission) => (
          <TableRow key={submission._id}>
            <TableCell>{submission.date}</TableCell>
            <TableCell>{submission.type}</TableCell>
            <TableCell>
              <StatusBadge status={submission.status} />
            </TableCell>
            <TableCell>{submission.total.toFixed(2)}</TableCell>
            <TableCell>
              {/* TODO: Link to actual submission detail page */}
              <Link href={`/${submission.type.toLowerCase()}/${submission._id}`}>
                🔍
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RecentSubmissionsTable;