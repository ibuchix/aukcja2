import { Link } from "react-router-dom";

export const NavbarLogo = () => {
  return (
    <div className="flex-shrink-0">
      <Link to="/" className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/c184339e-d67f-4d5d-b794-18d39ff5ad58.png" 
          alt="Autaro Logo" 
          className="h-8 w-auto"
        />
      </Link>
    </div>
  );
};