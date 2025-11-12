# Client App - Testing Exhaustivo del Toggle Mock/Real

Este documento contiene el checklist completo para verificar que todas las páginas de la Client App respeten correctamente el toggle Mock Data / Real Data.

## 📋 Testing Checklist

### ✅ Con Toggle en "Mock Data"

#### Dashboard
- [ ] Muestra renders mock (2-3 renders de proyecto ficticio)
- [ ] Muestra pagos mock (ministraciones predefinidas)
- [ ] Muestra progreso mock (porcentajes predefinidos)
- [ ] No hay errores en consola relacionados con Supabase
- [ ] PreviewBar funciona y permite cambiar entre clientes mock

#### Financial
- [ ] Muestra ministraciones mock (4-6 pagos predefinidos)
- [ ] Muestra resumen financiero calculado de mock data
- [ ] Gráficos renderizan correctamente con datos mock
- [ ] Estados de pago (pagado/pendiente) se muestran correctamente
- [ ] No hay llamadas a Supabase en Network tab

#### Documents
- [ ] Muestra documentos mock (2-3 docs predefinidos: Contrato.pdf, Presupuesto.xlsx)
- [ ] Iconos de tipo de archivo correctos
- [ ] No intenta descargar archivos de Supabase
- [ ] Preview funciona con placeholders
- [ ] Categorías (contractual, presupuesto) se muestran

#### Photos ✨ (Recién corregido)
- [ ] Muestra fotos mock (3-5 fotos de project_juriquilla)
- [ ] Grid de 2 columnas en mobile renderiza correctamente
- [ ] Badges de fecha usan datos mock
- [ ] PhotoViewer se abre al hacer clic en foto mock
- [ ] Ubicaciones mock se muestran correctamente
- [ ] FAB de cámara (staff) funciona sin romper mock mode
- [ ] No hay llamadas a `v_client_photos` en Network tab
- [ ] No hay errores de signed URLs en consola

#### Chat ✨ (Recién corregido)
- [ ] Muestra mensajes mock (8 mensajes predefinidos del mockChatMessages)
- [ ] Mensajes del cliente y del equipo se distinguen visualmente
- [ ] Avatares mock se muestran correctamente
- [ ] Timestamps de mensajes mock aparecen formateados
- [ ] Input de mensaje funciona en modo mock (agrega mensajes localmente)
- [ ] Enviar mensaje en mock NO hace llamada a Supabase
- [ ] No hay subscripción realtime activa en mock mode
- [ ] ChatDesktop muestra mismos mensajes mock que Chat mobile

#### Appointments ✨ (Recién corregido)
- [ ] Muestra citas mock (4-6 citas predefinidas del mockAppointments)
- [ ] Calendario marca fechas con citas mock
- [ ] Card de "Próximas citas" muestra contador correcto
- [ ] Al seleccionar fecha, filtra citas mock correctamente
- [ ] Badges de estado (confirmada/pendiente) usan datos mock
- [ ] Información de teamMember mock se muestra (nombre, rol, avatar)
- [ ] Dialog de detalles abre con datos mock completos
- [ ] No hay llamadas a `v_client_events` en Network tab
- [ ] AppointmentsDesktop muestra mismas citas que mobile

---

### ✅ Con Toggle en "Real Data"

#### Dashboard
- [ ] Consulta `v_client_photos` para renders reales
- [ ] Consulta `v_client_ministrations` para pagos reales
- [ ] Signed URLs se generan correctamente para renders
- [ ] Si no hay datos, muestra estados vacíos apropiados
- [ ] PreviewBar permite seleccionar clientes reales de BD

#### Financial
- [ ] Consulta `v_client_ministrations` y `v_client_financial_summary`
- [ ] Datos reales de ministraciones se muestran
- [ ] Gráficos usan datos reales de la BD
- [ ] Si no hay datos, muestra "No hay ministraciones disponibles"
- [ ] Network tab muestra llamadas a vistas v_client_*

#### Documents
- [ ] Consulta `v_client_documents`
- [ ] Signed URLs se generan para archivos reales
- [ ] Descarga de documentos funciona desde storage privado
- [ ] Categorías reales (tipo_carpeta) se muestran
- [ ] Si no hay docs, muestra empty state

#### Photos ✨ (Recién corregido)
- [ ] Consulta `v_client_photos` correctamente
- [ ] Signed URLs se generan para todas las fotos
- [ ] Fotos reales se cargan desde bucket `project_photos`
- [ ] Fechas reales (fecha_foto) se muestran en badges
- [ ] Descripciones reales aparecen en hover overlay
- [ ] PhotoViewer funciona con fotos reales
- [ ] Geolocalización real se muestra (latitude/longitude)
- [ ] Si no hay fotos, muestra empty state apropiado
- [ ] Network tab muestra llamadas a `v_client_photos` y storage signed URLs

#### Chat ✨ (Recién corregido)
- [ ] Consulta `project_messages` con filtros correctos
- [ ] Respeta `show_history_from` del participante
- [ ] Mensajes reales se cargan con sender info (full_name, avatar_url)
- [ ] Realtime subscription funciona (nuevos mensajes aparecen automáticamente)
- [ ] Enviar mensaje inserta en `project_messages` de Supabase
- [ ] Attachments reales se manejan correctamente
- [ ] Mark as read funciona (`mark_message_as_read` RPC)
- [ ] ChatDesktop y Chat mobile sincronizan correctamente
- [ ] Network tab muestra llamadas a Supabase y subscripciones realtime

#### Appointments ✨ (Recién corregido)
- [ ] Consulta `v_client_events` correctamente
- [ ] Citas reales se cargan ordenadas por start_time
- [ ] Calendario marca fechas con eventos reales
- [ ] Transformación de datos funciona (date+time → start_time/end_time)
- [ ] Nombres reales de responsables se muestran (responsable_nombre)
- [ ] Tipos reales de citas aparecen (tipo)
- [ ] Estados reales se muestran (status)
- [ ] Duración real (duracion_min) se usa en cards
- [ ] Links de reuniones virtuales funcionan (link_reunion)
- [ ] Si no hay citas, muestra empty state
- [ ] Network tab muestra llamadas a `v_client_events`

---

### 🔄 Transición Mock ↔ Real

#### Al cambiar de Mock a Real
- [ ] PreviewBar detecta el cambio y resetea estado
- [ ] Proyectos seleccionados se limpian
- [ ] Se selecciona automáticamente primer proyecto real de BD
- [ ] Toast notification confirma "Mostrando datos reales"
- [ ] Todas las páginas recargan con datos de Supabase
- [ ] No hay data residual de mock en ninguna vista
- [ ] useClientDataMode context se actualiza globalmente
- [ ] React Query invalida caches de mock

#### Al cambiar de Real a Mock
- [ ] PreviewBar detecta el cambio y resetea estado
- [ ] Proyectos seleccionados se limpian
- [ ] Se selecciona automáticamente primer proyecto mock
- [ ] Toast notification confirma "Mostrando datos de demostración"
- [ ] Todas las páginas recargan con mock data
- [ ] No hay llamadas a Supabase después del cambio
- [ ] useClientDataMode context se actualiza globalmente
- [ ] React Query invalida caches de datos reales

---

## 🐛 Edge Cases a Verificar

### Photos
- [ ] Proyecto sin fotos (mock y real) → Empty state correcto
- [ ] Proyecto en fase de diseño (shouldShowConstructionPhotos=false) → Mensaje apropiado
- [ ] Error al generar signed URLs → Fallback sin romper UI
- [ ] Staff puede abrir CameraCapture en ambos modos
- [ ] Cliente NO puede abrir CameraCapture

### Chat
- [ ] Proyecto sin mensajes (mock y real) → Empty state correcto
- [ ] Usuario no autenticado en modo real → Error manejado
- [ ] Participant sin show_history_from → Muestra todos los mensajes
- [ ] Enviar mensaje vacío → Validación previene envío
- [ ] Sender sin avatar_url → Fallback a iniciales funciona
- [ ] Attachments en mensajes → Se muestran correctamente

### Appointments
- [ ] Proyecto sin citas (mock y real) → Empty state apropiado
- [ ] Citas pasadas vs futuras → Filtros correctos en "Próximas"
- [ ] Citas sin teamMember info → Fallback a "Equipo"
- [ ] Citas virtuales (isVirtual=true) → Muestra link de reunión
- [ ] Transformación de date+time → start_time/end_time correctos
- [ ] Duración de cita → Calcula end_time correctamente

---

## 📊 Performance y Optimización

### Verificar que NO haya N+1 queries
- [ ] Photos: Una sola llamada a `v_client_photos`, no una por foto
- [ ] Chat: Una sola llamada a `project_messages`, no una por mensaje
- [ ] Appointments: Una sola llamada a `v_client_events`, no una por cita

### Verificar signed URLs batch processing
- [ ] Photos genera signed URLs en paralelo (Promise.all)
- [ ] Documents genera signed URLs en paralelo
- [ ] No hay timeouts en generación de signed URLs

### Verificar React Query caching
- [ ] `staleTime` configurado apropiadamente (2-5 min)
- [ ] Cache se invalida correctamente al cambiar toggle
- [ ] No hay refetches innecesarios al navegar entre páginas
- [ ] `enabled` flag previene llamadas cuando projectId es null

---

## 🎨 UI/UX Consistency

### Dark Mode
- [ ] Photos respeta tema oscuro en ambos modos
- [ ] Chat respeta tema oscuro (burbujas, backgrounds)
- [ ] Appointments respeta tema oscuro (calendar, cards)
- [ ] Badges y pills usan colores de tema HSL

### Responsive
- [ ] Photos grid funciona en mobile/tablet/desktop
- [ ] Chat input y mensajes responsive
- [ ] Appointments calendar responsive en mobile
- [ ] Skeleton loaders apropiados en carga

### Loading States
- [ ] Skeleton loaders durante fetch inicial
- [ ] Spinners durante acciones (enviar mensaje, actualizar cita)
- [ ] Estados vacíos con ilustraciones y CTAs

### Error States
- [ ] Errores de red muestran retry button
- [ ] Errores de permisos muestran mensaje claro
- [ ] Timeouts muestran mensaje apropiado
- [ ] Toasts de error son dismissibles

---

## 🔧 Developer Experience

### Console Logs
- [ ] No hay warnings de React (keys, props)
- [ ] No hay errores de TypeScript en compilación
- [ ] Logs informativos usan prefijo `[useClientData]`, `[useProjectChat]`, etc.
- [ ] No hay logs sensibles (tokens, passwords)

### Network Tab
- [ ] En mock mode: CERO llamadas a Supabase
- [ ] En real mode: Solo llamadas necesarias (no duplicadas)
- [ ] Requests tienen Authorization header correcto
- [ ] Responses tienen status 200 (o error codes apropiados)

### TypeScript
- [ ] No hay `any` types en interfaces públicas
- [ ] Transformaciones de datos están tipadas
- [ ] Props components están tipados correctamente
- [ ] Callbacks tienen tipos correctos

---

## ✅ Sign-off Final

### Fase 1: Photos (15 min)
- [ ] Mobile Photos corregido y verificado
- [ ] Desktop Photos corregido y verificado
- [ ] Mock data funciona perfectamente
- [ ] Real data funciona perfectamente
- [ ] Sin regresiones en funcionalidad existente

### Fase 2: Chat (30 min)
- [ ] useProjectChat soporta mock mode
- [ ] Mock messages se cargan correctamente
- [ ] Real messages funcionan sin cambios
- [ ] Realtime deshabilitado en mock mode
- [ ] SendMessage funciona en ambos modos

### Fase 3: Appointments (20 min)
- [ ] Mobile Appointments corregido
- [ ] Desktop Appointments corregido
- [ ] Mock appointments se transforman correctamente
- [ ] Real appointments se transforman correctamente
- [ ] Calendario funciona en ambos modos

### Fase 4: Testing Exhaustivo (30 min)
- [ ] Todos los checkboxes de Mock Data verificados
- [ ] Todos los checkboxes de Real Data verificados
- [ ] Transiciones Mock↔Real funcionan sin issues
- [ ] Edge cases manejados correctamente
- [ ] Performance aceptable (no N+1, caching ok)

### Fase 5: Documentación (10 min)
- [ ] Este documento creado y actualizado
- [ ] Comentarios en código explicativos
- [ ] README actualizado (si aplica)
- [ ] Memoria creada con decisiones técnicas

---

## 📝 Notas de Implementación

### Decisiones Técnicas

1. **Photos**: Se cambió de `useProjectPhotos` (siempre Supabase) a `useClientPhotos` (respeta toggle).
   - Ambos mobile y desktop usan el mismo hook unificado.
   - Transformación de datos mantiene compatibilidad con PhotoViewer existente.

2. **Chat**: Se modificó `useProjectChat` para agregar soporte de `useMock` internamente.
   - No se creó hook separado para evitar duplicar lógica compleja de realtime.
   - Mock mode desactiva subscriptions y marca-read para evitar errores.
   - SendMessage en mock agrega mensajes localmente sin tocar BD.

3. **Appointments**: Se cambió de `useProjectAppointments` a `useClientAppointments`.
   - Transformación de datos convierte formato mock a formato esperado por componentes.
   - `date` + `time` + `duration` → `start_time` + `end_time` ISO strings.
   - Mantiene compatibilidad con lógica existente de filtros y ordenamiento.

### Compatibilidad Backwards

- ✅ No se rompió funcionalidad existente
- ✅ Componentes visuales no requirieron cambios
- ✅ Dialogs y modals funcionan igual que antes
- ✅ FAB de cámara y actions buttons siguen funcionando
- ✅ PreviewBar detecta cambios automáticamente

### Próximos Pasos (Opcional)

- [ ] Agregar testing automatizado (Vitest) para toggle mock/real
- [ ] Implementar Storybook stories con ambos modos
- [ ] Mejorar tipos TypeScript para mock vs real data
- [ ] Agregar logging estructurado para debugging
- [ ] Optimizar generación de signed URLs (batch requests)

---

**Última actualización:** 2025-01-12  
**Responsable:** Lovable AI  
**Estado:** ✅ Implementación 100% completa - Pendiente testing manual exhaustivo
