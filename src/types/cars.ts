export type CarFeatures = {
  satNav: boolean;
  heatedSeats: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  upgradedSound: boolean;
};

export interface CarListing {
  id: string;
  title: string;
  price: number;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number;
  images: string[] | null;
  description: string | null;
  features: CarFeatures;
  transmission: string | null;
  service_history_files: string[] | null;
  required_photos: Record<string, string | null> | null;
}