import { test } from "node:test";
import assert from "node:assert/strict";
import { sesionDirectaValida } from "../src/lib/pago-directo.ts";

const orden = { id: "orden-1", procesador: "stripe_directo", procesador_ref: "cs_test_1", precio_centavos: 14900, correo: "fan@example.test" };
const sesion = { id: "cs_test_1", livemode: false, currency: "mxn", amount_total: 14900, customer_email: "fan@example.test", payment_status: "paid", metadata: { tipo: "set_directo", orden_id: "orden-1", mayor_edad: "si", acceso_hash: "a".repeat(64) } };
test("acepta solo sesión de prueba ligada a la orden y al precio guardado", () => assert.equal(sesionDirectaValida(sesion, orden), true));
test("acepta pago real ligado a la orden cuando el servidor está en vivo", () => {
  const real = { ...sesion, id: "cs_live_1", livemode: true };
  assert.equal(sesionDirectaValida(real, { ...orden, procesador_ref: real.id }, true), true);
});
test("el modo real rechaza sesiones de prueba", () => assert.equal(sesionDirectaValida(sesion, orden, true), false));
test("el modo real conserva la validación del monto", () => assert.equal(sesionDirectaValida({ ...sesion, livemode: true, amount_total: 1 }, orden, true), false));
for (const [nombre, cambio] of Object.entries({ "monto alterado": { amount_total: 100 }, "otra moneda": { currency: "usd" }, "pago en vivo": { livemode: true }, "otra sesión": { id: "cs_test_otro" }, "otro correo": { customer_email: "otro@example.test" }, "sin metadata": { metadata: null }, "sin confirmación de edad": { metadata: { ...sesion.metadata, mayor_edad: "no" } }, "otro set u orden": { metadata: { ...sesion.metadata, orden_id: "otra" } }, "hash inválido": { metadata: { ...sesion.metadata, acceso_hash: "mal" } } })) {
  test(`rechaza ${nombre}`, () => assert.equal(sesionDirectaValida({ ...sesion, ...cambio }, orden), false));
}
test("no confunde una compra de tokens con una venta directa", () => assert.equal(sesionDirectaValida(sesion, { ...orden, procesador: "stripe" }), false));
test("un regreso a success_url sin pago no concede acceso", () => assert.equal(sesionDirectaValida({ ...sesion, payment_status: "unpaid" }, orden), false));
test("no acepta sesiones sin un pago cobrado", () => assert.equal(sesionDirectaValida({ ...sesion, payment_status: "no_payment_required" }, orden), false));
