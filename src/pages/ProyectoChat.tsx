import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function ProyectoChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (id) {
      navigate(`/mis-chats?project=${id}`, { replace: true });
    }
  }, [id, navigate]);
  
  return (
    <div className="container mx-auto p-6 flex items-center justify-center">
      <p className="text-muted-foreground">Redirigiendo al chat...</p>
    </div>
  );
}
