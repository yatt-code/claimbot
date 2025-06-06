import { UserProfile } from "@clerk/nextjs";
import StaffLayout from "@/components/StaffLayout";

export default function Page() {
  return (
    <StaffLayout>
      <div className="flex justify-center">
        <UserProfile />
      </div>
    </StaffLayout>
  );
}