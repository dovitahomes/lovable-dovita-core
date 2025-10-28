import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getEffectiveClientMode, setClientViewMode } from "@/lib/auth/role";
import { useUserRole } from "@/hooks/useUserRole";

export function ViewAsClientToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useUserRole();
  const isViewingAsClient = getEffectiveClientMode();

  if (role !== 'admin' && role !== 'user') {
    return null;
  }

  const handleToggle = () => {
    if (isViewingAsClient) {
      setClientViewMode(false);
      navigate('/');
    } else {
      setClientViewMode(true);
      navigate('/client/home?viewAsClient=1');
    }
  };

  return (
    <Button
      variant={isViewingAsClient ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      className="gap-2"
    >
      {isViewingAsClient ? (
        <>
          <EyeOff className="h-4 w-4" />
          Salir vista cliente
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          Ver como cliente
        </>
      )}
    </Button>
  );
}
