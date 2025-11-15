import { Phone, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const HelpBanner = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`bg-[#D81B24] text-white mt-20 ${isMobile ? 'py-2 px-3' : 'py-3 px-4'}`}>
      <div className={`container mx-auto flex items-center justify-center gap-2 text-center flex-wrap ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>
        {isMobile ? (
          // Mobile compact layout
          <>
            <span>Pomoc:</span>
            <a 
              href="tel:+48459567877" 
              className="font-semibold hover:underline underline-offset-2 flex items-center gap-1 transition-all"
              style={{ color: '#32CD32' }}
            >
              <Phone className="w-3 h-3" />
              +48 459 567 877
            </a>
            <span>|</span>
            <a 
              href="https://wa.me/48459567877" 
              className="font-semibold hover:underline underline-offset-2 flex items-center gap-1 transition-all"
              style={{ color: '#32CD32' }}
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </a>
          </>
        ) : (
          // Desktop full layout
          <>
            <Phone className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span>Jeśli masz pytania lub potrzebujesz pomocy,</span>
            <a 
              href="tel:+48459567877" 
              className="font-semibold hover:underline underline-offset-2 transition-all"
              style={{ color: '#32CD32' }}
            >
              zadzwoń do nas pod +48 459 567 877
            </a>
            <span>lub</span>
            <a 
              href="https://wa.me/48459567877" 
              className="font-semibold hover:underline underline-offset-2 flex items-center gap-1 transition-all"
              style={{ color: '#32CD32' }}
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              napisz na WhatsApp tutaj
            </a>
          </>
        )}
      </div>
    </div>
  );
};
