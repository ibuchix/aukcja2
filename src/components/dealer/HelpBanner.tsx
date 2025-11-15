import { Phone, MessageCircle } from "lucide-react";

export const HelpBanner = () => {
  return (
    <div className="bg-[#D81B24] text-white py-3 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2 text-center flex-wrap text-sm md:text-base">
        <Phone className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
        <span>Jeśli masz pytania lub potrzebujesz pomocy,</span>
        <a 
          href="tel:+48459567877" 
          className="font-semibold hover:underline underline-offset-2 transition-all"
        >
          zadzwoń do nas pod +48 459 567 877
        </a>
        <span>lub</span>
        <a 
          href="https://wa.me/48459567877" 
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline underline-offset-2 flex items-center gap-1 transition-all"
        >
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
          napisz na WhatsApp tutaj
        </a>
      </div>
    </div>
  );
};
