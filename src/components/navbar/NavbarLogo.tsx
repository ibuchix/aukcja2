import { Link } from "react-router-dom";

export const NavbarLogo = () => {
  return (
    <div className="flex-shrink-0">
      <Link to="/" className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/f1a2bf02-fb76-4c66-af8f-e810114d6548.png" 
          alt="Autaro Logo" 
          className="h-8 w-auto"
        />
      </Link>
    </div>
  );
};