import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "Approved" | "Pending" | "Rejected" | "Draft";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusClasses = (status: StatusBadgeProps['status']) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "";
    }
  };

  return (
    <Badge className={cn(getStatusClasses(status))}>
      {status}
    </Badge>
  );
};

export default StatusBadge;