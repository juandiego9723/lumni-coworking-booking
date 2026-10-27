-- =============================================================================
-- Parte 3: Datos y SQL (PostgreSQL) - Lumni Coworking
-- Nota: Se normalizan los nombres de columnas del enunciado usando snake_case
-- (customer_id, room_id, booking_id, created_at, paid_at, payment_status).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Clientes con al menos una reserva 'completed' que terminó hace más de 30 días
--    y aún tiene saldo pendiente (total menos pagos).
-- -----------------------------------------------------------------------------
WITH paid_per_booking AS (
    SELECT
        booking_id,
        COALESCE(SUM(amount), 0) AS paid_amount
    FROM payments
    GROUP BY booking_id
),
overdue_bookings AS (
    SELECT
        b.id AS booking_id,
        b.customer_id,
        b.ends_at,
        (b.total - COALESCE(p.paid_amount, 0)) AS pending_balance
    FROM bookings b
    LEFT JOIN paid_per_booking p ON p.booking_id = b.id
    WHERE b.status = 'completed'
      AND b.ends_at < (NOW() - INTERVAL '30 days')
      AND (b.total - COALESCE(p.paid_amount, 0)) > 0
)
SELECT
    c.email,
    c.full_name,
    c.company,
    SUM(ob.pending_balance) AS pending_balance_total,
    FLOOR(EXTRACT(EPOCH FROM (NOW() - MIN(ob.ends_at))) / 86400)::int AS days_since_oldest_ended
FROM overdue_bookings ob
JOIN customers c ON c.id = ob.customer_id
GROUP BY c.id, c.email, c.full_name, c.company
ORDER BY pending_balance_total DESC;


-- -----------------------------------------------------------------------------
-- 2. Reservas cruzadas: pares de reservas 'confirmed' o 'completed' de la misma
--    sala cuyos horarios se solapan (10:00 a 10:00 no se cruzan).
-- -----------------------------------------------------------------------------
SELECT
    b1.id AS booking_id_1,
    b2.id AS booking_id_2
FROM bookings b1
JOIN bookings b2
  ON b1.room_id = b2.room_id
 AND b1.id < b2.id -- Evita duplicados invertidos (B,A) y autocomparación
 AND b1.starts_at < b2.ends_at
 AND b2.starts_at < b1.ends_at
WHERE b1.status IN ('confirmed', 'completed')
  AND b2.status IN ('confirmed', 'completed')
ORDER BY b1.id, b2.id;


-- -----------------------------------------------------------------------------
-- 3. Horas reservadas e ingresos por sala y por mes de los últimos 12 meses,
--    contando reservas 'confirmed' y 'completed' y el mes en hora de Colombia.
--    Cada sala aparece en todos los meses, en cero si no tuvo reservas.
-- -----------------------------------------------------------------------------
WITH months AS (
    SELECT generate_series(
        date_trunc('month', NOW() AT TIME ZONE 'America/Bogota') - INTERVAL '11 months',
        date_trunc('month', NOW() AT TIME ZONE 'America/Bogota'),
        INTERVAL '1 month'
    ) AS month_start_col
)
SELECT
    r.id AS room_id,
    r.name AS room_name,
    TO_CHAR(m.month_start_col, 'YYYY-MM') AS month_colombia,
    COALESCE(
        ROUND(SUM(EXTRACT(EPOCH FROM (b.ends_at - b.starts_at)) / 3600.0)::numeric, 2),
        0
    ) AS reserved_hours,
    COALESCE(SUM(b.total), 0::numeric(14,2)) AS revenue
FROM rooms r
CROSS JOIN months m
LEFT JOIN bookings b
  ON b.room_id = r.id
 AND b.status IN ('confirmed', 'completed')
 AND date_trunc('month', b.starts_at AT TIME ZONE 'America/Bogota') = m.month_start_col
GROUP BY r.id, r.name, m.month_start_col
ORDER BY r.id, m.month_start_col;


-- -----------------------------------------------------------------------------
-- 4. Inconsistencias: reservas cuyo total no coincide con la suma de sus
--    booking_lines, o marcadas payment_status = 'paid' cuyos pagos no cubren el total.
-- -----------------------------------------------------------------------------
WITH lines_agg AS (
    SELECT booking_id, COALESCE(SUM(amount), 0) AS lines_sum
    FROM booking_lines
    GROUP BY booking_id
),
payments_agg AS (
    SELECT booking_id, COALESCE(SUM(amount), 0) AS payments_sum
    FROM payments
    GROUP BY booking_id
),
checked AS (
    SELECT
        b.id AS booking_id,
        b.total,
        COALESCE(l.lines_sum, 0) AS lines_sum,
        b.payment_status,
        COALESCE(p.payments_sum, 0) AS payments_sum,
        (b.total <> COALESCE(l.lines_sum, 0)) AS lines_mismatch,
        (b.payment_status = 'paid' AND COALESCE(p.payments_sum, 0) < b.total) AS paid_mismatch
    FROM bookings b
    LEFT JOIN lines_agg l ON l.booking_id = b.id
    LEFT JOIN payments_agg p ON p.booking_id = b.id
)
SELECT
    booking_id,
    total,
    lines_sum,
    payment_status,
    payments_sum,
    CASE
        WHEN lines_mismatch AND paid_mismatch THEN 'both'
        WHEN lines_mismatch THEN 'lines_total_mismatch'
        WHEN paid_mismatch THEN 'paid_without_full_payment'
    END AS failure_type
FROM checked
WHERE lines_mismatch OR paid_mismatch
ORDER BY booking_id;


-- -----------------------------------------------------------------------------
-- 5. payments tiene 5 millones de filas y la consulta 4 tarda 40 segundos.
--    ¿Qué índices crearías y cómo comprobarías que sirven? (5 líneas o menos)
-- -----------------------------------------------------------------------------
-- 1. Crearía índices covering: CREATE INDEX CONCURRENTLY idx_payments_booking_amount ON payments(booking_id) INCLUDE (amount);
-- 2. Y en líneas: CREATE INDEX CONCURRENTLY idx_booking_lines_booking_amount ON booking_lines(booking_id) INCLUDE (amount);
-- 3. Estos índices permiten sumar amount por booking_id mediante Index-Only Scan sin leer la tabla completa (heap).
-- 4. Comprobaría con EXPLAIN (ANALYZE, BUFFERS) antes y después de crear los índices y actualizar estadísticas (ANALYZE).
-- 5. Confirmaría el paso de Seq Scan a Index Only Scan, menor consumo de buffers (shared read) y caída del Execution Time.
