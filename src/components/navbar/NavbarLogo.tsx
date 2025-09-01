import { Link } from "react-router-dom";

export const NavbarLogo = () => {
  return (
    <div className="flex-shrink-0">
      <Link to="/" className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/f142b426-569e-4396-85a2-aaafcb8c3909.png" 
          alt="Autaro Logo" 
          className="h-12 w-auto"
        />
      </Link>
    </div>
  );
};