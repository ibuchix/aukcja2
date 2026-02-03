import { useParams, useNavigate } from "react-router-dom";
import { useCarAuctionDetails } from "@/hooks/useCarAuctionDetails";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";
import { DashboardLayout } from "@/components/dealer/dashboard/DashboardLayout";
import { VehiclePhotos } from "@/components/car-details/VehiclePhotos";
import { VehicleHealthReport } from "@/components/car-details/VehicleHealthReport";
import { SimpleBidManager } from "@/components/auction/SimpleBidManager";
import { BidCountDisplay } from "@/components/auction/BidCountDisplay";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Heart, MapPin, AlertCircle, CheckCircle, Clock, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { translateTransmission } from "@/lib/transmissionUtils";
import { translateSpecificationLabel, translateVehicleFeature, translateFuelType, translateServiceHistoryType } from "@/lib/vehicleTranslations";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const CarAuction = () => {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { dealerProfile } = useDealerProfileSimple();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const { car, isLoading, error } = useCarAuctionDetails({
    carId: carId || "",
  });

  const isVerified = dealerProfile?.verification_status === 'approved' || dealerProfile?.is_verified === true;
  const isLive = car?.auctionTimingStatus === 'active' || car?.auctionTimingStatus === 'unknown';
  const hasEnded = car?.auctionTimingStatus === 'ended';

  const handleBack = () => {
    navigate("/dealer/dashboard");
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title: `${car?.year} ${car?.make} ${car?.model} - Aukcja`,
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link skopiowany do schowka");
    }
  };

  const handleWishlistClick = () => {
    if (car?.id) {
      toggleWishlist(car.id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Ładowanie..." showTitle={false}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-accent/20 rounded w-32"></div>
          <div className="aspect-video bg-accent/20 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-accent/20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !car) {
    return (
      <DashboardLayout title="Błąd" showTitle={false}>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold text-foreground">
            Nie znaleziono aukcji
          </h2>
          <p className="text-muted-foreground text-center">
            Pojazd nie istnieje lub aukcja nie jest już aktywna.
          </p>
          <Button onClick={() => navigate("/dealer/dashboard")}>
            Wróć do aukcji
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${car.year} ${car.make} ${car.model}`} showTitle={false}>
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleWishlistClick}
            className="rounded-full"
            aria-label={isInWishlist(car.id) ? "Usuń z listy życzeń" : "Dodaj do listy życzeń"}
          >
            <Heart
              className={cn(
                "h-5 w-5",
                isInWishlist(car.id) 
                  ? "fill-destructive text-destructive" 
                  : "text-muted-foreground"
              )}
            />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            className="rounded-full"
            aria-label="Udostępnij"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Title and Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {car.year} {car.make} {car.model}
          </h1>
          {car.town && car.county && (
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <MapPin className="h-4 w-4" />
              <span>{car.town}, {car.county}</span>
            </div>
          )}
        </div>
        <Badge 
          variant={isLive ? "default" : hasEnded ? "secondary" : "outline"} 
          className={cn(
            "text-sm px-4 py-2",
            isLive && "bg-primary text-primary-foreground"
          )}
        >
          {isLive ? "Aukcja na żywo" : hasEnded ? "Zakończona" : "Zaplanowana"}
        </Badge>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Photos and Details */}
        <div className="xl:col-span-2 space-y-6">
          {/* Photos */}
          <VehiclePhotos car={car} showHeader={false} />
          
          {/* Vehicle Specifications */}
          <div className="space-y-6">
            <div>
              <h3 className="font-kanit font-semibold text-2xl mb-6 text-body-text border-b border-accent/20 pb-3">
                {translateSpecificationLabel('Vehicle Specifications')}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {/* Year */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    {translateSpecificationLabel('Year')}
                  </div>
                  <div className={cn(
                    "font-kanit font-semibold text-body-text",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    {car.year}
                  </div>
                </div>
                
                {/* First Registration Date */}
                {car.firstRegistrationDate && (
                  <div className={cn(
                    "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                    isMobile ? "p-3" : "p-4"
                  )}>
                    <div className={cn(
                      "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}>
                      Data pierwszej rejestracji
                    </div>
                    <div className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {new Date(car.firstRegistrationDate).toLocaleDateString('pl-PL', { 
                        day: 'numeric', 
                        month: isMobile ? 'short' : 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                )}
                
                {/* Mileage */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    {translateSpecificationLabel('Mileage')}
                  </div>
                  <div className={cn(
                    "font-kanit font-semibold text-body-text",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    {car.mileage?.toLocaleString()} <span className={cn("text-subtitle-text", isMobile ? "text-xs" : "text-sm")}>km</span>
                  </div>
                </div>
                
                {/* Transmission */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    {translateSpecificationLabel('Transmission')}
                  </div>
                  <div className={cn(
                    "font-kanit font-medium text-body-text",
                    isMobile ? "text-sm" : "text-base"
                  )}>
                    {translateTransmission(car.transmission)}
                  </div>
                </div>
                
                {/* Fuel Type */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    {translateSpecificationLabel('Fuel Type')}
                  </div>
                  <div className={cn(
                    "font-kanit font-medium text-body-text capitalize",
                    isMobile ? "text-sm" : "text-base"
                  )}>
                    {translateFuelType(car.fuelType)}
                  </div>
                </div>
                
                {/* Engine Capacity */}
                {car.engineCapacity && (
                  <div className={cn(
                    "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                    isMobile ? "p-3" : "p-4"
                  )}>
                    <div className={cn(
                      "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}>
                      {translateSpecificationLabel('Engine Capacity')}
                    </div>
                    <div className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.engineCapacity}L
                    </div>
                  </div>
                )}
                
                {/* VIN */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    {translateSpecificationLabel('VIN')}
                  </div>
                  <div className={cn(
                    "font-mono font-kanit font-medium text-body-text break-all",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {car.vin || translateSpecificationLabel('Not available')}
                  </div>
                </div>
                
                {/* Number of Keys */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    {translateSpecificationLabel('Number of Keys')}
                  </div>
                  <div className={cn(
                    "font-kanit font-medium text-body-text",
                    isMobile ? "text-sm" : "text-base"
                  )}>
                    {car.numberOfKeys || translateSpecificationLabel('Not specified')}
                  </div>
                </div>
                
                {/* Service History */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    {translateSpecificationLabel('Service History')}
                  </div>
                  <div className="flex items-center gap-2">
                    {car.hasServiceHistory && <Check className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-green-500")} />}
                    <span className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.serviceHistoryType ? translateServiceHistoryType(car.serviceHistoryType) : 'Nie podano'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Vehicle History Section */}
              <h4 className="font-kanit font-semibold text-xl mt-8 mb-4 text-body-text border-b border-accent/20 pb-2">
                Historia Pojazdu
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {/* Technical Inspection Valid Until */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Badanie techniczne
                  </div>
                  <div className="flex items-center gap-2">
                    {car.technicalInspectionValidUntil ? (
                      <>
                        {new Date(car.technicalInspectionValidUntil) > new Date() ? (
                          <Check className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-green-500")} />
                        ) : (
                          <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-destructive")} />
                        )}
                        <span className={cn(
                          "font-kanit font-medium text-body-text",
                          isMobile ? "text-sm" : "text-base"
                        )}>
                          {new Date(car.technicalInspectionValidUntil).toLocaleDateString('pl-PL', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </>
                    ) : (
                      <span className={cn(
                        "font-kanit font-medium text-body-text",
                        isMobile ? "text-sm" : "text-base"
                      )}>Nie odnotowano</span>
                    )}
                  </div>
                </div>
                
                {/* Polish Origin */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Pochodzenie polskie
                  </div>
                  <div className="flex items-center gap-2">
                    {car.isPolishOrigin === true ? (
                      <Check className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-green-500")} />
                    ) : car.isPolishOrigin === false ? (
                      <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-destructive")} />
                    ) : null}
                    <span className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.isPolishOrigin === true ? 'Tak' : car.isPolishOrigin === false ? 'Nie' : 'Nie odnotowano'}
                    </span>
                  </div>
                </div>
                
                {/* Import Year - only show if data exists */}
                {car.importYear && (
                  <div className={cn(
                    "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                    isMobile ? "p-3" : "p-4"
                  )}>
                    <div className={cn(
                      "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}>
                      Rok importu
                    </div>
                    <div className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.importYear}
                    </div>
                  </div>
                )}
                
                {/* Owners Count Poland */}
                {car.ownersCountPoland !== null && car.ownersCountPoland !== undefined && (
                  <div className={cn(
                    "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                    isMobile ? "p-3" : "p-4"
                  )}>
                    <div className={cn(
                      "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}>
                      Właścicieli w Polsce
                    </div>
                    <div className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.ownersCountPoland}
                    </div>
                  </div>
                )}
                
                {/* Damage Record Poland */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Szkody w Polsce
                  </div>
                  <div className="flex items-center gap-2">
                    {car.isDamagedRecordPoland === false ? (
                      <Check className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-green-500")} />
                    ) : car.isDamagedRecordPoland === true ? (
                      <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-destructive")} />
                    ) : null}
                    <span className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.isDamagedRecordPoland === false ? 'Brak' : car.isDamagedRecordPoland === true ? 'Odnotowano' : 'Nie odnotowano'}
                    </span>
                  </div>
                </div>
                
                {/* Damage Record Abroad */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Szkody za granicą
                  </div>
                  <div className="flex items-center gap-2">
                    {car.isDamagedRecordAbroad === false ? (
                      <Check className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-green-500")} />
                    ) : car.isDamagedRecordAbroad === true ? (
                      <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-destructive")} />
                    ) : null}
                    <span className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.isDamagedRecordAbroad === false ? 'Brak' : car.isDamagedRecordAbroad === true ? 'Odnotowano' : 'Nie odnotowano'}
                    </span>
                  </div>
                </div>
                
                {/* Accident Record Poland */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Wypadki w Polsce
                  </div>
                  <div className="flex items-center gap-2">
                    {car.isAccidentRecordPoland === false ? (
                      <Check className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-green-500")} />
                    ) : car.isAccidentRecordPoland === true ? (
                      <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-destructive")} />
                    ) : null}
                    <span className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.isAccidentRecordPoland === false ? 'Brak' : car.isAccidentRecordPoland === true ? 'Odnotowano' : 'Nie odnotowano'}
                    </span>
                  </div>
                </div>
                
                {/* Accident Record Abroad */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Wypadki za granicą
                  </div>
                  <div className="flex items-center gap-2">
                    {car.isAccidentRecordAbroad === false ? (
                      <Check className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-green-500")} />
                    ) : car.isAccidentRecordAbroad === true ? (
                      <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-destructive")} />
                    ) : null}
                    <span className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.isAccidentRecordAbroad === false ? 'Brak' : car.isAccidentRecordAbroad === true ? 'Odnotowano' : 'Nie odnotowano'}
                    </span>
                  </div>
                </div>
                
                {/* Mileage Discrepancy */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Rozbieżność przebiegu
                  </div>
                  <div className="flex items-center gap-2">
                    {car.hasMileageDiscrepancy === false ? (
                      <Check className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-green-500")} />
                    ) : car.hasMileageDiscrepancy === true ? (
                      <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-destructive")} />
                    ) : null}
                    <span className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.hasMileageDiscrepancy === false ? 'Brak' : car.hasMileageDiscrepancy === true ? 'Wykryto' : 'Nie odnotowano'}
                    </span>
                  </div>
                </div>
                
                {/* Stolen Status */}
                <div className={cn(
                  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]",
                  isMobile ? "p-3" : "p-4"
                )}>
                  <div className={cn(
                    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Status kradzieży
                  </div>
                  <div className="flex items-center gap-2">
                    {car.isRecordedStolen === false ? (
                      <Check className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-green-500")} />
                    ) : car.isRecordedStolen === true ? (
                      <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4", "text-destructive")} />
                    ) : null}
                    <span className={cn(
                      "font-kanit font-medium text-body-text",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {car.isRecordedStolen === false ? 'Czysty' : car.isRecordedStolen === true ? 'Odnotowano' : 'Nie odnotowano'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Health Report */}
            <VehicleHealthReport car={car} />

            {/* Vehicle Features */}
            {car.features && Object.keys(car.features).length > 0 && (() => {
              const activeFeatures = Object.entries(car.features)
                .filter(([_, value]) => value === true)
                .map(([key, _]) => {
                  let readableKey = key;
                  if (key.includes('_')) {
                    readableKey = key
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ');
                  } else {
                    readableKey = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .trim();
                  }
                  return readableKey;
                });

              if (activeFeatures.length === 0) return null;

              return (
                <div>
                  <h4 className="text-xl font-semibold mb-4 text-body-text">{translateSpecificationLabel('Vehicle Features')}</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/30">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm font-medium text-body-text">{translateVehicleFeature(feature)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Vehicle Condition */}
            <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30">
              <h4 className="font-medium text-base mb-3 text-body-text">{translateSpecificationLabel('Vehicle Condition')}</h4>
              <div className="text-sm space-y-2">
                <p><span className="text-subtitle-text">{translateSpecificationLabel('Damaged')}:</span> <span className="font-medium text-body-text">{car.isDamaged ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                <p><span className="text-subtitle-text">{translateSpecificationLabel('Registered in Poland')}:</span> <span className="font-medium text-body-text">{car.isRegisteredInPoland ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                <p><span className="text-subtitle-text">{translateSpecificationLabel('Full Registration Document')}:</span> <span className="font-medium text-body-text">{car.hasFullRegistrationDocument ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                {car.isSellingOnBehalf !== undefined && (
                  <p><span className="text-subtitle-text">Sprzedaż w imieniu osoby trzeciej:</span> <span className="font-medium text-body-text">{car.isSellingOnBehalf ? translateSpecificationLabel('Yes') : translateSpecificationLabel('No')}</span></p>
                )}
                {car.financeAmount > 0 && (
                  <p><span className="text-subtitle-text">Zadłużenie finansowe:</span> <span className="font-medium text-body-text">{formatCurrency(car.financeAmount)}</span></p>
                )}
              </div>
            </div>

            {/* Seller Notes */}
            {car.sellerNotes && (
              <div className="p-4 bg-accent/50 rounded-lg">
                <h4 className="font-medium text-base mb-3">Uwagi sprzedającego</h4>
                <p className="text-sm leading-relaxed">{car.sellerNotes}</p>
              </div>
            )}

            {/* Location */}
            <div className="p-4 bg-accent/50 rounded-lg">
              <h4 className="font-medium text-base mb-3">{translateSpecificationLabel('Location')}</h4>
              <p className="text-sm font-medium">
                {car.town && car.county 
                  ? `${car.town}, ${car.county}` 
                  : car.town || car.county || 'Lokalizacja nie podana'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Bidding Section */}
        <div className="xl:col-span-1 space-y-6">
          {/* Sticky bidding section on desktop */}
          <div className="xl:sticky xl:top-6 space-y-6">
            {/* Bid Count Display */}
            {isLive && !hasEnded && (
              <BidCountDisplay carId={car.id} />
            )}

            {/* Auction Status */}
            <div className="p-6 bg-muted rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Status licytacji</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Cena orientacyjna:</span>
                  <span className="font-bold text-lg">{formatCurrency(car.reservePrice || 0)}</span>
                </div>
                
                {car.currentBid && car.currentBid > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Aktualna oferta:</span>
                    <span className={cn(
                      "font-bold text-lg",
                      hasEnded ? "text-gray-600" : "text-green-600"
                    )}>
                      {formatCurrency(car.currentBid)}
                    </span>
                  </div>
                )}
                
              </div>
            </div>

            {/* Bidding Section */}
            {isLive && !hasEnded && isVerified && (
              <SimpleBidManager
                carId={car.id}
                dealerId={dealerProfile?.id || ""}
                currentHighestBid={car.currentBid || 0}
                minimumIncrement={1}
                reservePrice={car.reservePrice}
                isVerified={isVerified}
              />
            )}

            {/* Verification Warning */}
            {isLive && !hasEnded && !isVerified && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium">Weryfikacja wymagana</p>
                    <p className="text-amber-700 text-sm mt-1">
                      Licytowanie jest dostępne tylko dla zweryfikowanych dealerów. 
                      Ukończ weryfikację, aby móc składać oferty.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => navigate("/dealer/documents")}
                    >
                      Przejdź do weryfikacji
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Ended Auction Message */}
            {hasEnded && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Aukcja zakończona</h3>
                {car.auctionStatus === 'sold' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Pojazd sprzedany</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <span>Brak sprzedaży</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CarAuction;
