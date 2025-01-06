import { List, X } from "@phosphor-icons/react";

interface NavbarMobileButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const NavbarMobileButton = ({ isOpen, onClick }: NavbarMobileButtonProps) => {
  return (
    <div className="md:hidden">
      <button
        onClick={onClick}
        className="text-gray-700 hover:text-primary"
      >
        {isOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
      </button>
    </div>
  );
};