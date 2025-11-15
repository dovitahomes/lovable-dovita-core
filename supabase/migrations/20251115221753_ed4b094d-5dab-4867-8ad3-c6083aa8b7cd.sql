-- Agregar constraint único para asiento genérico
-- Solo puede haber un asiento genérico activo
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_generic_seat
ON public.mailchimp_seats(seat_type)
WHERE seat_type = 'generic' AND is_active = true;

-- Agregar constraint único para usuario
-- Un usuario solo puede tener un asiento activo
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_seat
ON public.mailchimp_seats(user_id)
WHERE user_id IS NOT NULL AND is_active = true;

-- Comentarios
COMMENT ON INDEX idx_unique_generic_seat IS 'Garantiza que solo exista un asiento genérico activo';
COMMENT ON INDEX idx_unique_user_seat IS 'Garantiza que un usuario solo tenga un asiento activo';