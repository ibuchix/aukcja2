
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CarListing } from "@/types/cars";
import { processCarData } from "@/utils/carDataHelpers";

const BrowseCars = () => {
  const [listings, setListings] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useQuery({
    queryKey: ["carListings"],
    queryFn: async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("cars")
          .select("*")
          .eq("status", "available");

        if (error) throw error;

        if (data && Array.isArray(data)) {
          const processedData = processCarData(data);
          setListings(processedData);
          return processedData;
        } else {
          setListings([]);
          return [];
        }
      } catch (error) {
        console.error("Error fetching cars:", error);
        setListings([]);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="fixed top-6 left-6 p-2 text-gray-700 hover:text-primary transition-colors">
          <Home size={24} />
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="fixed top-6 left-6 p-2 text-gray-700 hover:text-primary transition-colors">
        <Home size={24} />
      </Link>
      <h1 className="text-3xl font-bold mb-4">Browse Cars</h1>
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((car) => (
            <div key={car.id} className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold">{car.title}</h2>
              <p>Make: {car.make}</p>
              <p>Model: {car.model}</p>
              <p>Year: {car.year}</p>
              <p>Reserve Price: {car.reservePrice}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No cars available.</p>
      )}
    </div>
  );
};

export default BrowseCars;
