import { Link } from "react-router-dom";

export const NavbarLogo = () => {
  return (
    <div className="flex-shrink-0">
      <Link to="/" className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/13f865b1-598b-419b-a5c1-49d9303b72e9.png" 
          alt="Autaro Logo" 
          className="h-12 w-auto"
        />
      </Link>
    </div>
  );
};