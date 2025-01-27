import { BidsNotificationHandler } from "./notifications/BidsNotificationHandler";
import { ProxyBidsNotificationHandler } from "./notifications/ProxyBidsNotificationHandler";
import { BidStatusNotificationHandler } from "./notifications/BidStatusNotificationHandler";

interface BidNotificationHandlerProps {
  carId: string;
  dealerId: string | null;
  currentBid: number | null;
}

export const BidNotificationHandler = ({
  carId,
  dealerId,
  currentBid,
}: BidNotificationHandlerProps) => {
  return (
    <>
      <BidsNotificationHandler carId={carId} dealerId={dealerId} />
      <ProxyBidsNotificationHandler dealerId={dealerId} />
      <BidStatusNotificationHandler dealerId={dealerId} />
    </>
  );
};