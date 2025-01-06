interface VehicleCardProps {
  image: string;
  name: string;
  price: string;
  specs: {
    speed: string;
    acceleration: string;
    power: string;
  };
}

const VehicleCard = ({ image, name, price, specs }: VehicleCardProps) => {
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
        <p className="text-primary text-lg font-bold mb-4">{price}</p>
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold">Top Speed</p>
            <p>{specs.speed}</p>
          </div>
          <div>
            <p className="font-semibold">0-60 mph</p>
            <p>{specs.acceleration}</p>
          </div>
          <div>
            <p className="font-semibold">Power</p>
            <p>{specs.power}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;