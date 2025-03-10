
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export const ProxyBiddingExample = () => {
  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white p-8 rounded-lg shadow-md border border-iris/20"
        >
          <h3 className="text-xl font-semibold mb-4 text-iris">How Proxy Bidding Works - An Example</h3>
          <div className="space-y-4 text-subtitle-text">
            <p>1. Current bid on a vehicle is {formatCurrency(10000)} with {formatCurrency(250)} minimum increments</p>
            <p>2. You set your maximum bid to {formatCurrency(15000)}</p>
            <p>3. If someone bids {formatCurrency(11000)}, our system automatically bids {formatCurrency(11250)} for you</p>
            <p>4. This continues until either:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>You win the auction</li>
              <li>The bidding exceeds your {formatCurrency(15000)} maximum</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
