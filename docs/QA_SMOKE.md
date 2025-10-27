# QA Manual y Smoke Tests

## Smoke Tests Automatizados

### Configuración

1. **Variables de entorno** (.env):
```bash
VITE_APP_URL=http://localhost:8080
ADMIN_EMAIL=admin@dovita.test
ADMIN_PASSWORD=AdminPass123!
```

2. **Instalar dependencias de Playwright**:
```bash
npx playwright install
```

3. **Ejecutar tests**:
```bash
# Ejecutar todos los smoke tests
npm run test:smoke

# Ejecutar con interfaz
npx playwright test --ui

# Ver reporte
npx playwright show-report
```

### Casos de Prueba Automatizados

1. ✅ **Login de admin → Dashboard visible**
   - Verifica autenticación exitosa
   - Comprueba elementos del dashboard

2. ✅ **Navegación entre módulos**
   - Clientes, Proveedores, Proyectos, Leads
   - Presupuestos, Finanzas, Contabilidad

3. ✅ **Portal del cliente**
   - Visualizar presupuesto
   - Resumen financiero visible

4. ✅ **Chat funcional**
   - Envío de mensajes
   - Recepción en tiempo real

5. ✅ **Calendario funcional**
   - Visualización del calendario
   - Creación de eventos

6. ✅ **Exportar PDF/XLSX (Presupuesto)**
   - Descarga de archivos Excel
   - Descarga de archivos PDF

7. ✅ **Exportar PDF/XLSX (Finanzas)**
   - Botones de exportación visibles
   - Generación de reportes

8. ✅ **Upload CFDI**
   - Diálogo de carga visible
   - Validación de formato

9. ✅ **Seed mock data**
   - 10 proyectos mock visibles
   - Datos correctamente etiquetados

10. ✅ **Logout → redirección**
    - Cierre de sesión exitoso
    - Redirección a /auth/login

---

## QA Manual

### Preparación

```bash
# 1. Sembrar datos de prueba
npm run seed:mock

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir http://localhost:8080
```

### Flujos de Prueba Manual

#### 1. Flujo Completo: Lead → Cliente → Proyecto

**Pasos:**
1. Ir a **Leads** → Crear nuevo lead
2. Convertir lead a cliente
3. Crear proyecto desde cliente
4. Completar wishlist de diseño
5. Crear presupuesto paramétrico
6. Crear presupuesto ejecutivo
7. Verificar en vista del cliente

**Resultado esperado:**
- Lead convertido exitosamente
- Proyecto creado con datos correctos
- Presupuestos visibles en portal del cliente

---

#### 2. Flujo Financiero

**Pasos:**
1. Ir a **Finanzas** → Cuentas Bancarias
2. Crear cuenta bancaria de prueba
3. Ir a **Transacciones**
4. Registrar un ingreso (depósito del cliente)
5. Registrar un egreso (pago a proveedor)
6. Verificar saldo actualizado
7. Generar reporte financiero (Excel/PDF)

**Resultado esperado:**
- Transacciones registradas correctamente
- Saldo calculado correctamente
- Exportaciones funcionan sin errores

---

#### 3. Flujo de Construcción

**Pasos:**
1. Seleccionar proyecto "Completo" de mock data
2. Ir a pestaña **Órdenes de Compra**
3. Crear nueva orden de compra
4. Marcar orden como "Recibida"
5. Verificar que se genere egreso automático
6. Ir a **Cronograma** → verificar Gantt
7. Ir a **Fotos** → subir foto de obra

**Resultado esperado:**
- Orden de compra creada
- Egreso generado automáticamente
- Gantt visible con fases
- Fotos cargadas correctamente

---

#### 4. Flujo CFDI

**Pasos:**
1. Ir a **Contabilidad** → Facturas CFDI
2. Hacer clic en "Cargar XML"
3. Seleccionar archivo CFDI XML válido
4. Verificar parsing correcto de datos
5. Confirmar registro en tabla
6. Aplicar filtros (Tipo, Método, Estado)
7. Ver XML almacenado

**Resultado esperado:**
- XML parseado correctamente
- UUID único registrado
- Emisor/Receptor identificados
- Filtros funcionan correctamente

---

#### 5. Flujo de Chat y Calendario

**Pasos:**
1. Seleccionar proyecto mock
2. Ir a pestaña **Chat**
3. Enviar mensaje de prueba
4. Verificar mensaje aparece en tiempo real
5. Ir a pestaña **Calendario**
6. Crear nueva cita
7. Verificar cita en calendario

**Resultado esperado:**
- Mensajes enviados/recibidos en tiempo real
- Citas creadas y visibles en calendario
- Navegación entre meses funcional

---

### Pruebas Responsivas

#### Desktop (>1200px)
- ✅ Sidebar completo visible
- ✅ Tablas con todas las columnas
- ✅ Modales de 2 columnas
- ✅ Grids de 3 columnas en resúmenes

#### Tablet (768px - 1200px)
- ✅ Sidebar colapsable
- ✅ Tablas con scroll horizontal
- ✅ Grids de 2 columnas
- ✅ Formularios adaptados

#### Mobile (<768px)
- ✅ Sidebar con solo iconos
- ✅ Modales de 1 columna
- ✅ Tablas scroll horizontal completo
- ✅ Chat/Calendario ancho completo
- ✅ Botones apilados verticalmente

---

### Checklist de Regresión

**Antes de cada release:**

- [ ] Smoke tests pasan al 100%
- [ ] Login/Logout funcional
- [ ] Todos los módulos accesibles
- [ ] Exportaciones (PDF/XLSX) funcionan
- [ ] CFDI parsing correcto
- [ ] Chat en tiempo real funcional
- [ ] Calendario funcional
- [ ] Formularios validan datos
- [ ] Tablas con paginación/filtros
- [ ] Responsive en mobile/tablet
- [ ] Dark mode sin errores visuales
- [ ] Sin errores en consola

---

### Limpieza Post-QA

```bash
# Limpiar todos los datos de prueba
npm run seed:cleanup
```

---

### Reporte de Bugs

**Template:**

```
**Módulo:** [Nombre del módulo]
**Severidad:** [Critical/High/Medium/Low]
**Pasos para reproducir:**
1. 
2. 
3. 

**Resultado esperado:**


**Resultado actual:**


**Screenshots:**
[Adjuntar capturas]

**Navegador/OS:**

**Logs de consola:**
```

---

### Notas Adicionales

- **Mock data** está etiquetado con `MOCK_DOVITA` y `MOCK_DOVITA_BATCH_001`
- **Nunca** ejecutar cleanup en producción
- **Siempre** usar service role key solo en ambiente local/CI
- Los smoke tests se ejecutan en Chromium por defecto
- Para ejecutar en otros navegadores, editar `playwright.config.ts`
