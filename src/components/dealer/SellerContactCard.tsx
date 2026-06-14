import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Mail, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useDealerSubscription } from "@/hooks/useDealerSubscription";

interface SellerContactCardProps {
  carId: string;
  isLive: boolean;
}

interface SellerContact {
  seller_name: string | null;
  contact_email: string | null;
  mobile_number: string | null;
}

export function SellerContactCard({ carId, isLive }: SellerContactCardProps) {
  const { isActive, isLoading: subLoading } = useDealerSubscription();
  const [contact, setContact] = useState<SellerContact | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isActive || !isLive || !carId) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("get_seller_contact_for_dealer", {
        _car_id: carId,
      });
      if (!error && data && data.length > 0) {
        setContact(data[0] as SellerContact);
      } else {
        setContact(null);
      }
      setLoading(false);
    })();
  }, [isActive, isLive, carId]);

  if (subLoading) {
    return (
      <div className="p-4 rounded-lg border border-border bg-card animate-pulse h-32" />
    );
  }

  if (!isActive) {
    return (
      <div className="p-5 rounded-lg border border-border bg-card space-y-3">
        <div className="flex items-center gap-2 text-body-text">
          <Lock className="h-5 w-5" />
          <h4 className="font-semibold">Dane kontaktowe sprzedawcy</h4>
        </div>
        <p className="text-sm text-subtitle-text">
          Subskrybuj, aby zobaczyć imię, e-mail i numer telefonu sprzedawcy i skontaktować się bezpośrednio.
        </p>
        <Button asChild className="w-full" style={{ backgroundColor: "#D81B24" }}>
          <Link to="/dealer/subscription">Subskrybuj — 999 PLN/mies. + VAT</Link>
        </Button>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className="p-5 rounded-lg border border-border bg-card space-y-2">
        <h4 className="font-semibold text-body-text">Dane kontaktowe sprzedawcy</h4>
        <p className="text-sm text-subtitle-text">
          Dane kontaktowe są dostępne tylko dla aktywnych aukcji.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4 rounded-lg border border-border bg-card animate-pulse h-32" />;
  }

  if (!contact) {
    return (
      <div className="p-5 rounded-lg border border-border bg-card space-y-2">
        <h4 className="font-semibold text-body-text">Dane kontaktowe sprzedawcy</h4>
        <p className="text-sm text-subtitle-text">Brak danych kontaktowych.</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-lg border border-border bg-card space-y-3">
      <h4 className="font-semibold text-body-text">Dane kontaktowe sprzedawcy</h4>
      {contact.seller_name && (
        <div className="flex items-center gap-3 text-sm text-body-text">
          <User className="h-4 w-4 text-subtitle-text" />
          <span>{contact.seller_name}</span>
        </div>
      )}
      {contact.contact_email && (
        <div className="flex items-center gap-3 text-sm">
          <Mail className="h-4 w-4 text-subtitle-text" />
          <a className="text-body-text hover:underline" href={`mailto:${contact.contact_email}`}>
            {contact.contact_email}
          </a>
        </div>
      )}
      {contact.mobile_number && (
        <div className="flex items-center gap-3 text-sm">
          <Phone className="h-4 w-4 text-subtitle-text" />
          <a className="text-body-text hover:underline" href={`tel:${contact.mobile_number}`}>
            {contact.mobile_number}
          </a>
        </div>
      )}
    </div>
  );
}