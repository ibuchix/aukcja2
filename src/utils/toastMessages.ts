import { toast } from "@/hooks/use-toast";

export const showBidPlacedToast = (amount: number, isOwnBid: boolean) => {
  toast({
    title: isOwnBid ? "Bid Placed Successfully" : "New Bid Placed",
    description: `${isOwnBid ? "Your bid" : "A new bid"} of $${amount.toLocaleString()} has been placed`,
    variant: "default",
  });
};

export const showProxyBidToast = (amount: number, isUpdate: boolean) => {
  toast({
    title: isUpdate ? "Proxy Bid Updated" : "Proxy Bid Set",
    description: `Your maximum bid ${isUpdate ? "has been updated to" : "of"} $${amount.toLocaleString()} ${isUpdate ? "" : "has been set"}`,
  });
};

export const showWinningBidToast = (amount: number) => {
  toast({
    title: "You're Winning!",
    description: `Your bid of $${amount.toLocaleString()} is currently winning`,
    variant: "default",
  });
};