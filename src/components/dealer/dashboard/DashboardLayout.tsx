import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/useIsMobile";
import { HelpBanner } from "@/components/dealer/HelpBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#454545' }}>
      <Navbar />
      <HelpBanner />
      
      <div className={`container mx-auto ${isMobile ? 'px-3 py-4' : 'px-4 py-8'} flex-grow`}>
        {!isMobile && <h1 className="text-3xl font-bold mb-6 text-body-text">{title}</h1>}
        {children}
      </div>
      
      <Footer />
    </div>
  );
};
