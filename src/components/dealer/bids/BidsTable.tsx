
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { MyBid } from "./types";

interface BidsTableProps {
  bids: MyBid[];
}

export const BidsTable = ({ bids }: BidsTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Your Bid</TableHead>
            <TableHead>Current Bid</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ends</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.map((bid) => (
            <TableRow key={bid.id}>
              <TableCell className="font-medium">
                {bid.car?.title || `${bid.car?.year} ${bid.car?.make} ${bid.car?.model}`}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{formatCurrency(bid.amount)}</span>
                  {bid.proxy_bid && (
                    <span className="text-xs text-muted-foreground">
                      Max: {formatCurrency(bid.proxy_bid.max_bid_amount)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatCurrency(bid.car?.current_bid || 0)}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  bid.status === 'active' ? 'bg-green-100 text-green-800' : 
                  'bg-amber-100 text-amber-800'
                }`}>
                  {bid.status === 'active' ? 'Highest' : 'Outbid'}
                </span>
              </TableCell>
              <TableCell>
                {bid.car?.auction_end_time ? (
                  format(new Date(bid.car.auction_end_time), "MMM d, HH:mm")
                ) : (
                  "N/A"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
