// Utility function to translate transmission values to Polish
export const translateTransmission = (transmission: string | null | undefined): string => {
  if (!transmission) return 'Not specified';
  
  const lowerTransmission = transmission.toLowerCase();
  
  switch (lowerTransmission) {
    case 'automatic':
      return 'Automatyczna';
    case 'manual':
      return 'Manualna';
    case 'cvt':
      return 'CVT';
    case 'semi-automatic':
      return 'Półautomatyczna';
    case 'dual-clutch':
      return 'Dwusprzęgłowa';
    default:
      // Capitalize first letter for unknown transmissions
      return transmission.charAt(0).toUpperCase() + transmission.slice(1).toLowerCase();
  }
};