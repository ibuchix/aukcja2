
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function WonVehicles() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard with won-vehicles tab
    navigate('/dealer/dashboard?tab=won-vehicles', { replace: true });
  }, [navigate]);

  return null;
}
