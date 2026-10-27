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

Hola equipo, ya identificamos qué pasó: los recordatorios de reservas en borrador creados después de las 5:00 p.m. quedaban en pausa a las 6:00 p.m. por la regla de no escribir de noche, pero el sistema los daba por vencidos automáticamente a las 2 horas antes de que llegaran las 8:00 a.m. del día siguiente.
Ya corregimos el sistema para que los borradores creados al final de la tarde queden programados automáticamente para las 8:00 a.m. del día siguiente sin vencerse durante la noche.
Mañana a las 8:30 a.m. enviaremos el recordatorio únicamente a los clientes recientes cuya reserva siga en borrador, tenga fecha futura y no hayan recibido ningún mensaje previo.
Antes de enviarlo les compartiremos la lista filtrada de clientes para su validación, y dejamos alertas activas para detectar de inmediato si algún recordatorio no sale a tiempo.
