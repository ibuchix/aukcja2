import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { CarFront, DollarSign, ShoppingCart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const DealerDashboard = () => {
  const [dealerInfo, setDealerInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-dark mb-6">
              Buy high quality cars for your dealership,
              <br />
              directly from private sellers
            </h1>
            <p className="text-subtitle-text text-lg mb-8 max-w-2xl mx-auto">
              Discover direct and fastest growing way to purchase cars on online
              auctions, exclusively from a wide selection of private sellers.
            </p>
            <button 
              onClick={() => navigate('/marketplace')}
              className="btn-primary text-lg px-8 py-3"
            >
              Browse Vehicles
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <CarFront className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">The best stock everyday</h3>
              <p className="text-subtitle-text">Fresh inventory of quality vehicles added daily.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <DollarSign className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">Market leading profits</h3>
              <p className="text-subtitle-text">Competitive pricing for better margins.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <ShoppingCart className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">The right price</h3>
              <p className="text-subtitle-text">Transparent pricing with no hidden fees.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">100% online purchasing</h3>
              <p className="text-subtitle-text">Complete your transactions entirely online.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">1</div>
              <h3 className="font-bold text-xl mb-4">Browse Inventory</h3>
              <p className="text-subtitle-text">Explore our extensive collection of quality vehicles from verified sellers.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">2</div>
              <h3 className="font-bold text-xl mb-4">Place Your Bid</h3>
              <p className="text-subtitle-text">Submit competitive bids on vehicles that match your inventory needs.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">3</div>
              <h3 className="font-bold text-xl mb-4">Complete Purchase</h3>
              <p className="text-subtitle-text">Finalize your transaction securely through our platform.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to grow your inventory?</h2>
          <button 
            onClick={() => navigate('/marketplace')}
            className="btn-primary text-lg px-8 py-3"
          >
            Start Bidding Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;