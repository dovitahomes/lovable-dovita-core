-- Agregar políticas faltantes para pay_batches

-- Política para ver lotes (usuarios con permiso de finanzas)
CREATE POLICY finanzas_view_pay_batches 
  ON public.pay_batches
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'finanzas', 'view')
  );

-- Política para crear lotes (usuarios con permiso de finanzas)
CREATE POLICY finanzas_manage_pay_batches 
  ON public.pay_batches
  FOR INSERT
  WITH CHECK (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'finanzas', 'create')
  );

-- Política para actualizar lotes (usuarios con permiso de finanzas)
CREATE POLICY finanzas_update_pay_batches 
  ON public.pay_batches
  FOR UPDATE
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'finanzas', 'edit')
  )
  WITH CHECK (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'finanzas', 'edit')
  );

-- Agregar políticas faltantes para payment_batch_items

-- Política para ver items (usuarios con permiso de finanzas)
CREATE POLICY finanzas_view_payment_batch_items 
  ON public.payment_batch_items
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'finanzas', 'view')
  );

-- Política para agregar items (usuarios con permiso de finanzas)
CREATE POLICY finanzas_manage_payment_batch_items 
  ON public.payment_batch_items
  FOR INSERT
  WITH CHECK (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'finanzas', 'create')
  );

-- Política para eliminar items (usuarios con permiso de finanzas)
CREATE POLICY finanzas_delete_payment_batch_items 
  ON public.payment_batch_items
  FOR DELETE
  USING (
    current_user_has_role('admin') OR 
    user_has_module_permission(auth.uid(), 'finanzas', 'delete')
  );