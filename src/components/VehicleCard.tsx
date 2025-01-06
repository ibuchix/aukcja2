import { formatCurrency } from "@/lib/utils";

interface VehicleCardProps {
  image: string;
  name: string;
  price: number;
  mileage: number;
  transmission?: string | null;
  year?: number | null;
}

const VehicleCard = ({ image, name, price, mileage, transmission, year }: VehicleCardProps) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-primary text-lg font-bold mb-4">{formatCurrency(price)}</p>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold">Year</p>
            <p>{year || "N/A"}</p>
          </div>
          <div>
            <p className="font-semibold">Mileage</p>
            <p>{mileage.toLocaleString()} km</p>
          </div>
          <div className="col-span-2">
            <p className="font-semibold">Transmission</p>
            <p>{transmission || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;