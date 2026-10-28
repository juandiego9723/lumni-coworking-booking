# Reporte y Análisis de Incidente en Producción (Parte 4)

## 1. Hipótesis de Causa Raíz y Verificación

### Hipótesis Principal: Colisión entre el TTL de expiración (2h en reloj absoluto) y la ventana de silencio nocturno (18:00 a 08:00)
El sistema tiene dos reglas que entran en conflicto directo al final de la tarde:
1. **Ventana de envío permitida:** Solo se envían mensajes por WhatsApp entre las **08:00 y las 18:00**.
2. **Regla de expiración del Job (cada 30 min):** Si un recordatorio lleva **más de 2 horas en estado pending**, lo marca como expired y no vuelve a intentarlo.

**¿Por qué el 92% de los expired fueron creados después de las 17:00?**
- Cuando un cliente deja una reserva en draft después de las **17:00** (o cuando el recordatorio se encola tras un tiempo prudencial de abandono y cae cerca o después de las 18:00), entra en la restricción horaria de las **18:00** y el worker detiene el envío.
- Sin embargo, el job que corre cada 30 minutos (18:30, 19:00, 19:30...) sigue evaluando la condición de vencimiento usando tiempo absoluto (NOW() - created_at > INTERVAL '2 hours') sin descontar las horas fuera de horario hábil.
- Al cumplirse las 2 horas (entre las 19:00 y las 20:00), el job marca el recordatorio como expired durante la noche sin haber tenido oportunidad de enviarse a las 08:00 a.m. del día siguiente.

### Consultas y Logs para Confirmarla
1. **Consulta SQL de distribución horaria e intentos de envío:**
   SELECT
       EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Bogota') AS created_hour,
       EXTRACT(HOUR FROM updated_at AT TIME ZONE 'America/Bogota') AS expired_hour,
       COUNT(*) AS total_expired,
       SUM(CASE WHEN attempts = 0 THEN 1 ELSE 0 END) AS expired_with_zero_attempts
   FROM whatsapp_reminders
   WHERE status = 'expired'
   GROUP BY 1, 2
   ORDER BY total_expired DESC;

2. **Revisión de Logs del Job (17:00 a 21:00):**
   Verificar en los logs de las ejecuciones de las 18:00 a 20:00 que los registros creados tras las 17:00 fueron omitidos por la política de horario (outside business hours) y posteriormente transicionados a expired con 0 intentos de llamada al proveedor de WhatsApp.

---

## 2. Plan de Corrección para los Registros Afectados

### Cómo recuperar los registros sin duplicar envíos, sin escribir a quien ya confirmó ni enviar a las 3:00 a.m.
1. **Desplegar primero el fix del job** para evitar que al reactivar registros vuelvan a marcarse como expired si se hace fuera de ventana.
2. **Criterios estrictos de selección (Query de remediación):**
   - Recordatorios en status = 'expired' con sent_at IS NULL (nunca enviados).
   - La reserva asociada (bookings) debe seguir actualmente en status = 'draft' (excluye confirmed, completed y cancelled).
   - La fecha de inicio de la reserva (starts_at) debe ser futura (starts_at > NOW() + INTERVAL '2 hours') y creada recientemente (ej. últimos 3 a 5 días) para no enviar recordatorios sobre fechas ya pasadas.
   - Garantía de no duplicidad (NOT EXISTS): verificar que ese customer_id / número de teléfono no haya recibido ya otro recordatorio exitoso (status = 'sent') para esa misma reserva o en las últimas 24 horas.
3. **Ejecución controlada en horario hábil:**
   - Programar el lote actualizando status = 'pending' y asignando un scheduled_for escalonado a partir de las **08:30 a.m. (hora Colombia)** en bloques pequeños (rate limiting) para no saturar la API de WhatsApp.

### Pruebas antes de Producción y Aprobación
- **Prueba previa:** Ejecutar la consulta en modo **Dry-Run (solo lectura)** sobre una réplica/copia de producción o en Staging, generando el listado exacto de clientes y reservas que serían contactados, y corriendo tests automatizados del job simulando las 03:00 a.m. y las 08:30 a.m.
- **Quién aprueba:**
  1. **Líder Técnico / Ingeniería:** valida el script SQL, el bloqueo de idempotencia y la ventana horaria.
  2. **Líder Comercial / Producto:** aprueba el corte de antigüedad de los drafts a contactar.

---

## 3. Cambio de Fondo y Detección Temprana

### Cambio Estructural
1. **Programación consciente del horario hábil (scheduled_at):** Si un recordatorio se genera o cae fuera de la ventana 08:00 - 18:00 (o después de las 17:30), el sistema debe calcular y guardar scheduled_at = mañana a las 08:00 a.m. (America/Bogota).
2. **Expiración basada en ventana activa:** El TTL de 2 horas debe contarse a partir de scheduled_at (NOW() > scheduled_at + INTERVAL '2 hours') y solo evaluar expiración dentro del horario hábil, de modo que un mensaje solo expire si falló repetidamente cuando sí estaba permitido enviarlo.

### Cómo detectarlo antes la próxima vez
- **Alerta de negocio (Invariante):** Alerta inmediata si un solo recordatorio pasa a expired con attempts = 0 (expiró sin haberse intentado enviar).
- **Métrica de conversión de la cola:** Alerta si la tasa expired / total_creados supera el 5% en una ventana de 2 horas.

---

## 4. Mensaje para el Equipo Comercial (4 líneas)

Identificamos que los recordatorios creados después de las 5 p.m. quedaban pausados durante la noche y vencían antes de poder enviarse.
Ya se corrigio proceso para que se programen automáticamente al día siguiente.
A las 8:30 a.m. enviaremos los recordatorios a clientes con reservas futuras sin mensajes previos. Dejamos alertas activas para detectar cualquier inconveniente.

---

## 5. Bonus Rails (Opcional · hasta 5 puntos)

### Código analizado:
```ruby
class Booking < ApplicationRecord
  has_one :invoice, dependent: :destroy
  before_save :regenerate_invoice, if: -> { status == 'confirmed' }

  def regenerate_invoice
    invoice&.destroy
    build_invoice(total: lines_total, tax: TaxCalculator.for(self))
  end
end
```

### ¿Qué problemas tiene este modelo cuando una reserva confirmada se vuelve a guardar?
1. **Destrucción y Recreación Innecesaria en CADA guardado (`before_save`):**
   - El callback se dispara cada vez que se guarda el registro (incluso si solo se actualiza una nota, el teléfono del cliente o un timestamp), destruyendo físicamente la factura anterior y creando una nueva con un nuevo `id` (`PRIMARY KEY`).
2. **Violación de Integridad y Trazabilidad Contable:**
   - En sistemas contables y de facturación, **las facturas emitidas nunca deben destruirse**. Borrar una factura genera saltos en los consecutivos de facturación, pérdida de pistas de auditoría y rompe llaves foráneas (`invoice_id`) en pasarelas de pago o asientos contables.
3. **Pérdida de Idempotencia y Riesgo de Transacciones:**
   - Si el guardado del `Booking` falla después de `invoice&.destroy`, se puede perder la factura existente o generar inconsistencias graves de estado.

### ¿Cómo corregirlo idiomáticamente en Rails?

```ruby
class Booking < ApplicationRecord
  has_one :invoice

  # 1. Solo generar la factura cuando la reserva TRANSICIONA a 'confirmed', no en cada guardado
  after_commit :generate_invoice_on_confirmation, on: :update, if: :became_confirmed?

  private

  def became_confirmed?
    saved_change_to_status?(to: 'confirmed')
  end

  def generate_invoice_on_confirmation
    # 2. Idempotencia: Si ya existe factura para esta reserva, no destruirla ni duplicarla
    return if invoice.present?

    create_invoice!(
      total: lines_total,
      tax: TaxCalculator.for(self)
    )
  end
end
```

*(En una arquitectura de producción aún más limpia, esta lógica no reside en un callback del modelo sino en un Servicio de Dominio explícito, como `ConfirmBookingService.call(booking)`, garantizando trazabilidad y facilidad de pruebas unitarias).*

