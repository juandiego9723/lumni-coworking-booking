# Project Architecture & AI Rules - Lumni Coworking App

## Stack Tecnológico
- **Monorepo:** `/backend` (Node.js + Express + TypeScript + Prisma + PostgreSQL + Vitest + Zod) y `/frontend` (React + Vite + TypeScript + TailwindCSS).
- **Zona horaria de negocio:** Todas las reglas de horario (07:00 a 21:00, lunes a sábado) operan en hora de Colombia (`America/Bogota`, UTC-5).
- **Tipado estricto:** Prohibido usar `any`. Validar todas las entradas HTTP y las salidas del modelo de IA con `Zod`.

## Reglas Críticas de Ingeniería
1. **Separación de capas:** La lógica de dominio (cálculo de tarifas, descuentos, recargos y máquina de estados) debe estar en funciones puras dentro de `/backend/src/domain` para poder probarse con tests unitarios sin depender de Express ni de la base de datos.
2. **Concurrencia e Idempotencia:**
   - Para evitar reservas cruzadas concurrentes, se debe usar una transacción con bloqueo o un constraint `EXCLUDE USING gist` en PostgreSQL (`btree_gist`).
   - Confirmar dos veces una reserva ya `confirmed` debe ser una operación idempotente (retornar la reserva existente sin recalcular precios ni duplicar correos).
3. **Control de ejecución:** No generes todo el proyecto de una vez. Trabaja únicamente en el módulo solicitado en el prompt actual.
