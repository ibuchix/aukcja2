
import { DashboardLayout } from "@/components/dealer/dashboard/DashboardLayout";
import { DealerBids } from "@/components/dealer/DealerBids";

export default function Bids() {
  return (
    <DashboardLayout title="Moje oferty">
      <DealerBids />
    </DashboardLayout>
  );
}
