
/**
 * Calculate the next bid amount based on the current state of the auction
 * and the two highest proxy bids
 */
export function calculateNextBidAmount(
  currentBid: number | undefined, 
  price: number, 
  bidIncrement: number, 
  topBidderMax: number, 
  secondBidderMax: number
): number {
  // Calculate what the next bid should be
  const minBid = Math.max(price, (currentBid || 0) + bidIncrement);
  
  // Calculate what the second bidder's max can outbid the current high bid up to
  const secondBidderMaxBid = secondBidderMax;
  
  // If the second bidder's max is less than the minimum bid, use the minimum bid
  let nextBidAmount = Math.max(minBid, Math.min(secondBidderMaxBid + bidIncrement, topBidderMax));
  
  // Make sure the bid is divisible by the bid increment
  if (nextBidAmount % bidIncrement !== 0) {
    nextBidAmount = Math.floor(nextBidAmount / bidIncrement) * bidIncrement;
  }
  
  return nextBidAmount;
}
