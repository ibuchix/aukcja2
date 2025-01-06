import { Link } from "react-router-dom";

export const NavbarLogo = () => {
  return (
    <div className="flex-shrink-0">
      <Link to="/" className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/aa669890-4367-45e2-993a-634d24895446.png" 
          alt="Auto-Strada Logo" 
          className="h-8 w-auto"
        />
      </Link>
    </div>
  );
};