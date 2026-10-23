import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Corre las migraciones en un Postgres en memoria (PGlite) con una imitación mínima de Supabase
// y prueba las reglas de seguridad y de dinero. Uso: npm run test:db
const DIR = fileURLToPath(new URL("../migrations", import.meta.url));
const db = new PGlite();

// ── Imitación mínima de Supabase ──
await db.exec(`
  create schema auth; create schema extensions; create schema storage;
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create table storage.buckets (id text primary key, name text, public bool, file_size_limit bigint, allowed_mime_types text[]);
  grant usage on schema public, extensions, auth to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`);

for (const f of readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort()) {
  try {
    await db.exec(readFileSync(`${DIR}/${f}`, "utf8"));
    console.log("✓ migración", f);
  } catch (e) {
    console.log("✗ migración", f, "→", e.message);
    process.exit(1);
  }
}

let fallas = 0;
const ok = (nombre, cond) => {
  console.log(cond ? "  ✓" : "  ✗ FALLA", nombre);
  if (!cond) fallas++;
};

const A = "aaaaaaaa-0000-0000-0000-000000000001";
const B = "bbbbbbbb-0000-0000-0000-000000000002";
const FAN = "ffffffff-0000-0000-0000-000000000003";
const STAFF = "55555555-0000-0000-0000-000000000004";

async function como(usuario, sql, params = [], correo) {
  await db.exec("reset role");
  if (usuario === "anon") {
    await db.exec(`set role anon; select set_config('request.jwt.claim.sub', '', false); select set_config('request.jwt.claims', '', false);`);
  } else if (usuario) {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${usuario}', false);
      select set_config('request.jwt.claims', '${JSON.stringify({ sub: usuario, email: correo ?? "" })}', false);`);
  }
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role");
  }
}
async function falla(usuario, sql, esperado, params = [], correo) {
  try {
    await como(usuario, sql, params, correo);
    return `no falló (esperaba ${esperado})`;
  } catch (e) {
    return e.message.includes(esperado) ? true : e.message;
  }
}
const admin = (sql, p) => db.query(sql, p);

function clabeCon(prefijo17) {
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += (Number(prefijo17[i]) * pesos[i % 3]) % 10;
  return prefijo17 + ((10 - (suma % 10)) % 10);
}

console.log("\n── utilidades");
ok("CLABE válida conocida", (await admin(`select public.clabe_valida('032180000118359719') v`)).rows[0].v === true);
ok("CLABE con dígito mal", (await admin(`select public.clabe_valida('032180000118359718') v`)).rows[0].v === false);
ok("enmascarar correo", (await admin(`select public.enmascarar_correo('fan@correo.com') v`)).rows[0].v === "f•••@correo.com");

await admin(`insert into auth.users values ($1,'vale@x.com'),($2,'otra@x.com'),($3,'fan@correo.com'),($4,'mod@veloo.vip')`, [A, B, FAN, STAFF]);
await admin(`insert into public.staff values ($1,'moderacion','Mod')`, [STAFF]);

console.log("\n── creadoras");
await como(A, `insert into public.creadoras (id) values ($1)`, [A]);
await como(B, `insert into public.creadoras (id) values ($1)`, [B]);
ok("no puede crear perfil de otra", (await falla(A, `insert into public.creadoras (id) values ($1)`, "row-level security", [FAN])) === true);
ok("no puede autoverificarse", (await falla(A, `update public.creadoras set verificacion='aprobada' where id=$1`, "permission denied", [A])) === true);
await como(A, `update public.creadoras set usuario='valeruiz' where id=$1`, [A]);
ok("subdominio no se cambia antes de 90 días", (await falla(A, `update public.creadoras set usuario='vale2' where id=$1`, "usuario_cambiado_hace_poco", [A])) === true);
ok("subdominio reservado", (await falla(B, `update public.creadoras set usuario='admin' where id=$1`, "check constraint", [B])) === true);
ok("perfil no verificado no es público", (await como("anon", `select * from public.creadoras`)).rows.length === 0);

console.log("\n── sets y medios");
ok("no puede crear set ya publicado", (await falla(A, `insert into public.sets (creadora_id,titulo,precio_centavos,estado) values ($1,'x',14900,'publicado')`, "permission denied", [A])) === true);
const set = (await como(A, `insert into public.sets (creadora_id,titulo,precio_centavos,con_otras_personas) values ($1,'Mazunte',14900,true) returning id`, [A])).rows[0].id;
ok("precio con centavos rechazado", (await falla(A, `insert into public.sets (creadora_id,titulo,precio_centavos) values ($1,'x',14950)`, "check constraint", [A])) === true);
ok("otra creadora no ve el borrador", (await como(B, `select * from public.sets`)).rows.length === 0);
const m1 = (await admin(`insert into public.medios (creadora_id, estado, ancho, alto) values ($1,'lista',1200,1600) returning id`, [A])).rows[0].id;
const mB = (await admin(`insert into public.medios (creadora_id, estado) values ($1,'lista') returning id`, [B])).rows[0].id;
await como(A, `update public.medios set set_id=$1, orden=0 where id=$2`, [set, m1]);
ok("B no puede apuntar a set ajeno", (await falla(B, `update public.medios set set_id=$1 where id=$2`, "row-level security", [set, mB])) === true);
ok("no puede cambiar estado directo", (await falla(A, `update public.sets set estado='publicado' where id=$1`, "permission denied", [set])) === true);
ok("sin declaración no se envía", (await falla(A, `select public.enviar_a_moderacion($1,false)`, "falta_declaracion", [set])) === true);
ok("con otras personas y sin firmas no se envía", (await falla(A, `select public.enviar_a_moderacion($1,true)`, "faltan_firmas", [set])) === true);
const persona = (await admin(`insert into public.personas_set (set_id, telefono) values ($1,'+525512345678') returning id`, [set])).rows[0].id;
ok("firma pendiente sigue bloqueando", (await falla(A, `select public.enviar_a_moderacion($1,true)`, "faltan_firmas", [set])) === true);
ok("creadora ve teléfono enmascarado", (await como(A, `select telefono from public.personas_de_mis_sets`)).rows[0]?.telefono === "••• 5678");
ok("creadora no lee datos de la persona", (await como(A, `select * from public.personas_set`)).rows.length === 0);
await admin(`update public.personas_set set estado_firma='firmada', firmado_en=now() where id=$1`, [persona]);
await como(A, `select public.enviar_a_moderacion($1,true)`, [set]);
ok("set en moderación con portada", (await admin(`select estado, portada_id from public.sets where id=$1`, [set])).rows[0].estado === "moderacion");
ok("ya no puede editar en moderación", (await como(A, `update public.sets set titulo='otro' where id=$1 returning id`, [set])).rows.length === 0);

console.log("\n── moderación y verificación");
ok("no se aprueba si no está verificada", (await falla(null, `select public.moderar_set($1,$2,'aprobado')`, "creadora_no_verificada", [set, STAFF])) === true);
await admin(`insert into public.verificaciones (creadora_id) values ($1)`, [A]);
ok("intento nuevo → en revisión", (await admin(`select verificacion from public.creadoras where id=$1`, [A])).rows[0].verificacion === "en_revision");
await admin(`update public.verificaciones set estado='aprobada' where creadora_id=$1`, [A]);
ok("aprobada → creadora aprobada", (await admin(`select verificacion from public.creadoras where id=$1`, [A])).rows[0].verificacion === "aprobada");
await admin(`select public.moderar_set($1,$2,'aprobado')`, [set, STAFF]);
ok("set publicado", (await admin(`select estado from public.sets where id=$1`, [set])).rows[0].estado === "publicado");
ok("anon ve el set publicado", (await como("anon", `select id from public.sets`)).rows.length === 1);
ok("anon ve los medios del set", (await como("anon", `select id from public.medios`)).rows.length === 1);
ok("anon ve el perfil verificado", (await como("anon", `select usuario from public.creadoras`)).rows[0]?.usuario === "valeruiz");
ok("anon no puede moderar", (await falla("anon", `select public.moderar_set($1,$2,'aprobado')`, "permission denied", [set, STAFF])) === true);
ok("creadora no puede moderar", (await falla(A, `select public.moderar_set($1,$2,'aprobado')`, "permission denied", [set, STAFF])) === true);
ok("staff lee sets por RLS", (await como(STAFF, `select id from public.sets`)).rows.length === 1);

console.log("\n── reportes");
const rep = (await admin(`insert into public.reportes (set_id, motivo) values ($1,'posible_menor') returning id, folio, urgente`, [set])).rows[0];
ok(`reporte urgente con folio ${rep.folio}`, rep.urgente === true && /^VR-\d{6}$/.test(rep.folio));
ok("reporte urgente oculta el set", (await admin(`select estado from public.sets where id=$1`, [set])).rows[0].estado === "oculto");
ok("anon ya no ve el set", (await como("anon", `select id from public.sets`)).rows.length === 0);
await admin(`select public.resolver_reporte($1,$2,'sin_falta')`, [rep.id, STAFF]);
ok("sin falta → vuelve a publicarse", (await admin(`select estado from public.sets where id=$1`, [set])).rows[0].estado === "publicado");
await admin(`update public.personas_set set estado_firma='retirada' where id=$1`, [persona]);
ok("firma retirada oculta el set", (await admin(`select estado, oculto_motivo from public.sets where id=$1`, [set])).rows[0].oculto_motivo === "consentimiento_retirado");
await admin(`update public.sets set estado='publicado', oculto_motivo=null where id=$1`, [set]);

console.log("\n── compras y dinero");
await como(FAN, `insert into public.fans (id) values ($1)`, [FAN]);
const orden = (await admin(`insert into public.ordenes (set_id,creadora_id,correo,metodo,precio_centavos,comision_centavos,procesador,procesador_ref)
  values ($1,$2,'fan@correo.com','oxxo',14900,2980,'prueba','ref1') returning id, neto_centavos`, [set, A])).rows[0];
ok("neto = 149 − 29.80", orden.neto_centavos === 11920);
ok("fan ve su compra pendiente por correo", (await como(FAN, `select estado from public.mis_compras`, [], "Fan@Correo.com")).rows[0]?.estado === "pendiente");
ok("otro usuario no la ve", (await como(B, `select * from public.mis_compras`, [], "otra@x.com")).rows.length === 0);
ok("anon no puede confirmar pago", (await falla("anon", `select public.confirmar_pago($1,'h')`, "permission denied", [orden.id])) === true);
ok("primer confirmar_pago", (await admin(`select public.confirmar_pago($1,'hash1') v`, [orden.id])).rows[0].v === true);
ok("segundo es idempotente", (await admin(`select public.confirmar_pago($1,'hash1') v`, [orden.id])).rows[0].v === false);
let saldo = (await como(A, `select * from public.mi_saldo`)).rows[0];
ok(`venta retenida 7 días (retenido ${saldo.retenido_centavos})`, Number(saldo.retenido_centavos) === 11920 && Number(saldo.disponible_centavos) === 0);
ok("B no ve el saldo de A", Number((await como(B, `select * from public.mi_saldo`)).rows[0].retenido_centavos) === 0);
ok("B no puede llamar saldo_de de A", Number((await como(B, `select * from public.saldo_de($1)`, [A])).rows[0].retenido_centavos) === 0);
const venta = (await como(A, `select correo, neto_centavos from public.mis_ventas`)).rows[0];
ok(`creadora ve correo enmascarado (${venta?.correo})`, venta?.correo === "f•••@correo.com");
ok("creadora no lee órdenes directo", (await como(A, `select * from public.ordenes`)).rows.length === 0);

// Pasan los 7 días y llegan más ventas.
await admin(`update public.movimientos_saldo set disponible_desde = now() - interval '1 day'`);
for (let i = 2; i <= 3; i++) {
  const o = (await admin(`insert into public.ordenes (set_id,creadora_id,correo,metodo,precio_centavos,comision_centavos,procesador,procesador_ref)
    values ($1,$2,'otro@correo.com','tarjeta',14900,2980,'prueba','ref${i}') returning id`, [set, A])).rows[0].id;
  await admin(`select public.confirmar_pago($1,'hash${i}')`, [o]);
}
await admin(`update public.movimientos_saldo set disponible_desde = now() - interval '1 day'`);
saldo = (await como(A, `select * from public.mi_saldo`)).rows[0];
ok(`disponible tras 7 días: ${saldo.disponible_centavos}`, Number(saldo.disponible_centavos) === 35760);

ok("sin CLABE no hay retiro", (await falla(A, `select public.solicitar_retiro(20000)`, "sin_cuenta_bancaria")) === true);
ok("CLABE inválida rechazada", (await falla(null, `insert into public.cuentas_bancarias (creadora_id,clabe,titular) values ('${A}','012180001234567890','X')`, "check constraint")) === true);
const clabe1 = clabeCon("01218000123456789");
const clabeBancoRaro = clabeCon("99918000123456789");
ok("banco no reconocido rechazado", (await falla(null, `insert into public.cuentas_bancarias (creadora_id,clabe,titular) values ('${A}','${clabeBancoRaro}','X')`, "foreign key")) === true);
const c1 = (await admin(`insert into public.cuentas_bancarias (creadora_id,clabe,titular) values ($1,$2,'VALERIA RUIZ') returning id`, [A, clabe1])).rows[0].id;
await admin(`select public.activar_cuenta_bancaria($1)`, [c1]);
const cuenta = (await como(A, `select * from public.mi_cuenta_bancaria`)).rows[0];
ok(`CLABE enmascarada (${cuenta.clabe}, ${cuenta.banco})`, cuenta.clabe === "•••• " + clabe1.slice(-4) && cuenta.banco === "BBVA México");
ok("primera CLABE no pausa retiros", cuenta.retiros_pausados_hasta === null);
ok("retiro mínimo $200", (await falla(A, `select public.solicitar_retiro(19999)`, "retiro_minimo")) === true);
ok("no retira más de lo disponible", (await falla(A, `select public.solicitar_retiro(40000)`, "saldo_insuficiente")) === true);
const retiro = (await como(A, `select public.solicitar_retiro(30000) id`)).rows[0].id;
saldo = (await como(A, `select * from public.mi_saldo`)).rows[0];
ok(`retiro descuenta (queda ${saldo.disponible_centavos})`, Number(saldo.disponible_centavos) === 5760);
await admin(`select public.revertir_retiro($1,'CLABE cancelada')`, [retiro]);
saldo = (await como(A, `select * from public.mi_saldo`)).rows[0];
ok("retiro fallido regresa el dinero", Number(saldo.disponible_centavos) === 35760);

const c2 = (await admin(`insert into public.cuentas_bancarias (creadora_id,clabe,titular) values ($1,$2,'VALERIA RUIZ') returning id`, [A, clabeCon("07218000123456789")])).rows[0].id;
await admin(`select public.activar_cuenta_bancaria($1)`, [c2]);
ok("cambiar CLABE pausa retiros 24 h", (await falla(A, `select public.solicitar_retiro(20000)`, "retiros_pausados")) === true);
ok("solo una CLABE activa", (await admin(`select count(*)::int n from public.cuentas_bancarias where creadora_id=$1 and estado='activa'`, [A])).rows[0].n === 1);

await admin(`select public.registrar_contracargo($1)`, [orden.id]);
saldo = (await como(A, `select * from public.mi_saldo`)).rows[0];
ok("contracargo descuenta el neto", Number(saldo.disponible_centavos) === 35760 - 11920);
ok("contracargo revoca el acceso", (await admin(`select revocado_en from public.accesos where orden_id=$1`, [orden.id])).rows[0].revocado_en !== null);

console.log("\n── social");
await como(FAN, `insert into public.seguimientos (fan_id, creadora_id) values ($1,$2)`, [FAN, A]);
await como(FAN, `insert into public.me_gusta (fan_id, set_id) values ($1,$2)`, [FAN, set]);
ok("contador de seguidores público", Number((await como("anon", `select seguidores from public.contadores_creadora`)).rows[0]?.seguidores) === 1);
ok("anon no ve quién sigue a quién", (await como("anon", `select * from public.seguimientos`)).rows.length === 0);
ok("B no puede bloquear con orden ajena", (await falla(B, `select public.bloquear_fan($1)`, "orden_no_encontrada", [orden.id])) === true);
await como(A, `select public.bloquear_fan($1)`, [orden.id]);
ok("bloqueo con correo enmascarado", (await como(A, `select correo from public.mis_bloqueos`)).rows[0]?.correo === "f•••@correo.com");
ok("checkout detecta bloqueo (sin importar mayúsculas)", (await admin(`select public.esta_bloqueado($1,' FAN@correo.com') v`, [A])).rows[0].v === true);

console.log("\n── retiro de set (E5)");
await como(A, `select public.retirar_set($1)`, [set]);
ok("set retirado, compras conservadas", (await admin(`select count(*)::int n from public.accesos where set_id=$1`, [set])).rows[0].n === 3);

console.log("\n── slug y motivos (C5, A1)");
ok("slug del título", (await admin(`select slug from public.sets where id=$1`, [set])).rows[0].slug === "mazunte");
const s2 = (await como(A, `insert into public.sets (creadora_id,titulo,precio_centavos) values ($1,'Mazunte',9900) returning slug`, [A])).rows[0].slug;
ok("mismo título → slug con número", s2 === "mazunte-2");
const s3 = (await como(A, `insert into public.sets (creadora_id,titulo,precio_centavos) values ($1,'Año Nuevo · Oaxaca!',9900) returning slug`, [A])).rows[0].slug;
ok("slug sin acentos ni signos", s3 === "ano-nuevo-oaxaca");
ok("otra creadora puede repetir slug", (await como(B, `insert into public.sets (creadora_id,titulo,precio_centavos) values ($1,'Mazunte',9900) returning slug`, [B])).rows[0].slug === "mazunte");
ok("creadora no puede cambiar el slug", (await falla(A, `update public.sets set slug='otro' where slug='mazunte-2'`, "permission denied")) === true);
ok("motivos de rechazo cargados", (await admin(`select count(*)::int n from public.motivos_rechazo`)).rows[0].n === 6);

console.log("\n── SPEI manual (F6, panel de pagos)");
const spei = (q) => admin(`insert into public.ordenes (set_id,creadora_id,correo,metodo,precio_centavos,comision_centavos,procesador,procesador_ref,spei_referencia)
  values ($1,$2,'fan@correo.com','spei',14900,2980,'spei_manual',$3,$4) returning id`, [set, A, `ref_${q}`, q]);
const om = (await spei("VLO7KQ4M")).rows[0].id;
ok("concepto repetido se rechaza", (await falla(null, `insert into public.ordenes (set_id,creadora_id,correo,metodo,precio_centavos,comision_centavos,procesador,procesador_ref,spei_referencia)
  values ($1,$2,'x@correo.com','spei',14900,2980,'spei_manual','ref_x','VLO7KQ4M')`, "ordenes_concepto_spei_manual_idx", [set, A])) === true);
ok("otro procesador puede repetir referencia", (await admin(`insert into public.ordenes (set_id,creadora_id,correo,metodo,precio_centavos,comision_centavos,procesador,procesador_ref,spei_referencia)
  values ($1,$2,'x@correo.com','spei',14900,2980,'prueba','ref_y','VLO7KQ4M') returning id`, [set, A])).rows.length === 1);
ok("anon no confirma SPEI manual", (await falla("anon", `select public.confirmar_spei_manual($1,$2,'h')`, "permission denied", [om, STAFF])) === true);
ok("creadora no confirma SPEI manual", (await falla(A, `select public.confirmar_spei_manual($1,$2,'h')`, "permission denied", [om, A])) === true);
ok("solo staff confirma", (await falla(null, `select public.confirmar_spei_manual($1,$2,'h')`, "no_es_staff", [om, A])) === true);
ok("no confirma órdenes de otro procesador", (await falla(null, `select public.confirmar_spei_manual($1,$2,'h')`, "orden_no_es_spei_manual", [orden.id, STAFF])) === true);
await admin(`update public.ordenes set estado='vencida' where id=$1`, [om]);
ok("confirma aunque haya vencido", (await admin(`select public.confirmar_spei_manual($1,$2,'hm1') v`, [om, STAFF])).rows[0].v === true);
ok("segunda confirmación es idempotente", (await admin(`select public.confirmar_spei_manual($1,$2,'hm2') v`, [om, STAFF])).rows[0].v === false);
const conf = (await admin(`select estado, confirmada_por from public.ordenes where id=$1`, [om])).rows[0];
ok("queda pagada y con quién confirmó", conf.estado === "pagada" && conf.confirmada_por === STAFF);
ok("crea un solo acceso", (await admin(`select count(*)::int n from public.accesos where orden_id=$1`, [om])).rows[0].n === 1);

console.log("\n── tokens (compra con Stripe, desbloqueo con saldo)");
const setB = (await admin(`update public.sets set estado='publicado', publicado_en=now() where creadora_id=$1 returning id`, [B])).rows[0].id;
const setA = (await admin(`update public.sets set estado='publicado', publicado_en=now() where creadora_id=$1 and slug='mazunte-2' returning id`, [A])).rows[0].id;
const compraT = (await admin(`insert into public.compras_tokens (fan_id,tokens,precio_centavos,procesador,procesador_ref) values ($1,50,5000,'stripe','cs_1') returning id`, [FAN])).rows[0].id;
const saldoT = async () => (await como(FAN, `select tokens from public.mi_saldo_tokens`, [], "fan@correo.com")).rows[0].tokens;
ok("saldo inicial 0", (await saldoT()) === 0);
ok("fan no puede acreditarse tokens", (await falla(FAN, `select public.acreditar_tokens($1)`, "permission denied", [compraT], "fan@correo.com")) === true);
ok("fan no puede insertar movimientos", (await falla(FAN, `insert into public.movimientos_tokens (fan_id,tipo,tokens) values ($1,'ajuste',1000)`, "permission denied", [FAN], "fan@correo.com")) === true);
ok("acreditar_tokens", (await admin(`select public.acreditar_tokens($1) v`, [compraT])).rows[0].v === true);
ok("acreditar es idempotente", (await admin(`select public.acreditar_tokens($1) v`, [compraT])).rows[0].v === false);
ok("saldo 50 tras la compra", (await saldoT()) === 50);
ok("otro usuario no ve el saldo", (await como(B, `select tokens from public.mi_saldo_tokens`, [], "otra@x.com")).rows[0].tokens === 0);
ok("no alcanza para un set de 99", (await falla(FAN, `select * from public.desbloquear_con_tokens($1,'t1')`, "saldo_insuficiente", [setB], "fan@correo.com")) === true);
ok("saldo intacto tras el intento", (await saldoT()) === 50);
const compraT2 = (await admin(`insert into public.compras_tokens (fan_id,tokens,precio_centavos,procesador,procesador_ref) values ($1,250,25000,'stripe','cs_2') returning id`, [FAN])).rows[0].id;
await admin(`select public.acreditar_tokens($1)`, [compraT2]);
ok("fan bloqueado por la creadora no desbloquea", (await falla(FAN, `select * from public.desbloquear_con_tokens($1,'t0')`, "fan_bloqueado", [setA], "fan@correo.com")) === true);
const d1 = (await como(FAN, `select * from public.desbloquear_con_tokens($1,'t1')`, [setB], "fan@correo.com")).rows[0];
ok("desbloqueo crea orden nueva", d1.nueva === true);
ok("descuenta 99 (quedan 201)", (await saldoT()) === 201);
const ot = (await admin(`select metodo, estado, precio_centavos, neto_centavos, fan_id from public.ordenes where id=$1`, [d1.orden_id])).rows[0];
ok("orden pagada con tokens a nombre del fan", ot.metodo === "tokens" && ot.estado === "pagada" && ot.fan_id === FAN);
ok("creadora recibe neto 79.20 retenido", Number((await como(B, `select retenido_centavos from public.mi_saldo`)).rows[0].retenido_centavos) === 7920);
ok("fan ve el set en Mis compras", (await como(FAN, `select metodo from public.mis_compras where set_id=$1`, [setB], "fan@correo.com")).rows[0]?.metodo === "tokens");
const d2 = (await como(FAN, `select * from public.desbloquear_con_tokens($1,'t2')`, [setB], "fan@correo.com")).rows[0];
ok("segundo desbloqueo no cobra", d2.nueva === false && d2.orden_id === d1.orden_id && (await saldoT()) === 201);
ok("anon no desbloquea", (await falla("anon", `select * from public.desbloquear_con_tokens($1,'t3')`, "permission denied", [setB])) === true);
ok("usuario sin cuenta de fan no desbloquea", (await falla(B, `select * from public.desbloquear_con_tokens($1,'t4')`, "sin_cuenta_fan", [setB], "otra@x.com")) === true);
ok("set no publicado no se desbloquea", (await falla(FAN, `select * from public.desbloquear_con_tokens($1,'t5')`, "set_no_disponible", [set], "fan@correo.com")) === true);

console.log("\n── links de la creadora y slugs reservados");
const lk = (await como(A, `insert into public.links_creadora (creadora_id,titulo,url,red) values ($1,'Instagram','https://instagram.com/vale','instagram') returning id`, [A])).rows[0].id;
ok("creadora agrega un link", !!lk);
ok("anon ve links de creadora verificada", (await como("anon", `select titulo from public.links_creadora where creadora_id=$1`, [A])).rows.length === 1);
ok("rechaza javascript:", (await falla(A, `insert into public.links_creadora (creadora_id,titulo,url) values ($1,'x','javascript:alert(1)')`, "links_creadora_url_check", [A])) === true);
ok("rechaza http sin cifrar", (await falla(A, `insert into public.links_creadora (creadora_id,titulo,url) values ($1,'x','http://sitio.com')`, "links_creadora_url_check", [A])) === true);
ok("rechaza título vacío", (await falla(A, `insert into public.links_creadora (creadora_id,titulo,url) values ($1,'   ','https://sitio.com')`, "links_creadora_titulo_check", [A])) === true);
ok("B no agrega links a A", (await falla(B, `insert into public.links_creadora (creadora_id,titulo,url) values ($1,'x','https://sitio.com')`, "row-level security", [A])) === true);
ok("B no edita links de A", (await como(B, `update public.links_creadora set titulo='hack' where id=$1 returning id`, [lk])).rows.length === 0);
ok("creadora no puede inflar clics", (await falla(A, `update public.links_creadora set clics=999 where id=$1`, "permission denied", [lk])) === true);
ok("abrir_link suma clic y da la URL", (await como("anon", `select public.abrir_link($1) u`, [lk])).rows[0].u === "https://instagram.com/vale");
ok("clic contado", (await admin(`select clics from public.links_creadora where id=$1`, [lk])).rows[0].clics === 1);
await como(A, `update public.links_creadora set activo=false where id=$1`, [lk]);
ok("link apagado no es público", (await como("anon", `select * from public.links_creadora where creadora_id=$1`, [A])).rows.length === 0);
ok("link apagado no abre", (await como("anon", `select public.abrir_link($1) u`, [lk])).rows[0].u === null);
ok("creadora sí ve su link apagado", (await como(A, `select * from public.links_creadora where id=$1`, [lk])).rows.length === 1);
for (let i = 2; i <= 20; i++) await como(A, `insert into public.links_creadora (creadora_id,titulo,url) values ($1,$2,'https://sitio.com')`, [A, `Link ${i}`]);
ok("máximo 20 links", (await falla(A, `insert into public.links_creadora (creadora_id,titulo,url) values ($1,'21','https://sitio.com')`, "limite_links", [A])) === true);
const sTok = (await como(A, `insert into public.sets (creadora_id,titulo,precio_centavos) values ($1,'Tokens',9900) returning slug`, [A])).rows[0].slug;
ok(`título "Tokens" no usa un slug reservado (${sTok})`, sTok === "tokens-2");

console.log("\n── mayoría de edad del fan");
const CF = "fan@correo.com";
ok("fan no se pone la fecha a mano", (await falla(FAN, `update public.fans set mayor_edad_en=now() where id=$1`, "permission denied", [FAN], CF)) === true);
ok("fan sí cambia su nombre", (await como(FAN, `update public.fans set nombre_visible='Beto' where id=$1 returning id`, [FAN], CF)).rows.length === 1);
ok("sin confirmar no escribe", (await falla(FAN, `select public.escribir_a_creadora($1,'hola')`, "falta_mayoria_edad", [A], CF)) === true);
const edad1 = (await como(FAN, `select public.confirmar_mayoria_edad() v`, [], CF)).rows[0].v;
const edad2 = (await como(FAN, `select public.confirmar_mayoria_edad() v`, [], CF)).rows[0].v;
ok("confirma una vez y la fecha no cambia", !!edad1 && String(edad1) === String(edad2));
ok("anon no confirma", (await falla("anon", `select public.confirmar_mayoria_edad()`, "permission denied")) === true);

console.log("\n── lista de aviso (F1)");
ok("creadora sin verificar no recibe avisos", (await falla("anon", `select public.pedir_aviso($1,'x@correo.com')`, "creadora_no_disponible", [B])) === true);
await como("anon", `select public.pedir_aviso($1,' Nueva@Correo.com ')`, [A]);
await como("anon", `select public.pedir_aviso($1,'nueva@correo.com')`, [A]);
ok("correo inválido rechazado", (await falla("anon", `select public.pedir_aviso($1,'no-es-correo')`, "correo_invalido", [A])) === true);
ok("creadora ve 1 correo (sin duplicados)", (await como(A, `select correos from public.mi_lista_aviso`)).rows[0].correos === 1);
ok("creadora no lee los correos", (await como(A, `select * from public.lista_aviso`)).rows.length === 0);
ok("anon no lee la lista", (await como("anon", `select * from public.lista_aviso`)).rows.length === 0);
ok("staff sí la lee", (await como(STAFF, `select correo from public.lista_aviso`)).rows[0]?.correo === "nueva@correo.com");

console.log("\n── suscripciones con tokens");
await admin(`update public.creadoras set verificacion='aprobada', usuario='otra' where id=$1`, [B]);
const saldoB = async () => Number((await como(B, `select retenido_centavos from public.mi_saldo`)).rows[0].retenido_centavos);
const retB0 = await saldoB();
ok("sin oferta no hay suscripción", (await falla(FAN, `select public.suscribirse($1)`, "suscripcion_no_disponible", [B], CF)) === true);
ok("precio mínimo 49 tokens", (await falla(B, `update public.creadoras set suscripcion_tokens=20 where id=$1`, "check constraint", [B])) === true);
await como(B, `update public.creadoras set suscripcion_tokens=150 where id=$1`, [B]);
ok("con 201 tokens se suscribe", !!(await como(FAN, `select public.suscribirse($1) v`, [B], CF)).rows[0].v);
ok("descuenta 150 (quedan 51)", (await saldoT()) === 51);
ok(`creadora recibe neto 120 retenido`, (await saldoB()) - retB0 === 12000);
await como(FAN, `select public.suscribirse($1)`, [B], CF);
ok("suscribirse otra vez no cobra", (await saldoT()) === 51);
ok("creadora ve 1 suscriptora activa", (await como(B, `select activas from public.mis_suscriptores`)).rows[0].activas === 1);
ok("creadora no ve quién es", (await como(B, `select * from public.suscripciones`)).rows.length === 0);
ok("suscripción deja ver sus sets", (await como(FAN, `select public.ver_por_suscripcion($1) v`, [setB], CF)).rows[0].v === true);
ok("no deja ver sets de otra creadora", (await como(FAN, `select public.ver_por_suscripcion($1) v`, [setA], CF)).rows[0].v === false);
ok("fan no cobra periodos a mano", (await falla(FAN, `select public.cobrar_periodo(id) from public.mis_suscripciones`, "permission denied", [], CF)) === true);
ok("fan no corre renovaciones", (await falla(FAN, `select public.renovar_suscripciones()`, "permission denied", [], CF)) === true);
await como(FAN, `select public.cancelar_suscripcion($1)`, [B], CF);
const cancelada = (await como(FAN, `select renovar, activa from public.mis_suscripciones`, [], CF)).rows[0];
ok("cancelada sigue activa hasta fin de mes", cancelada.renovar === false && cancelada.activa === true);
await admin(`update public.suscripciones set periodo_hasta=now()-interval '1 minute', renovar=true, fin_motivo=null where fan_id=$1`, [FAN]);
ok("sin saldo no se renueva", (await admin(`select public.renovar_suscripciones() n`)).rows[0].n === 0);
ok("queda detenida por saldo", (await admin(`select fin_motivo from public.suscripciones where fan_id=$1`, [FAN])).rows[0].fin_motivo === "sin_saldo");
ok("vencida ya no deja ver", (await como(FAN, `select public.ver_por_suscripcion($1) v`, [setB], CF)).rows[0].v === false);
const compraT3 = (await admin(`insert into public.compras_tokens (fan_id,tokens,precio_centavos,procesador,procesador_ref) values ($1,250,25000,'stripe','cs_3') returning id`, [FAN])).rows[0].id;
await admin(`select public.acreditar_tokens($1)`, [compraT3]);
await como(FAN, `select public.suscribirse($1)`, [B], CF);
ok("se vuelve a suscribir (quedan 151)", (await saldoT()) === 151);
await admin(`update public.suscripciones set periodo_hasta=now()-interval '1 minute' where fan_id=$1`, [FAN]);
ok("renovación automática cobra", (await admin(`select public.renovar_suscripciones() n`)).rows[0].n === 1 && (await saldoT()) === 1);
ok("tres cobros registrados", (await como(FAN, `select count(*)::int n from public.cobros_suscripcion`, [], CF)).rows[0].n === 3);

console.log("\n── inbox y envíos");
const FAN2 = "f2f2f2f2-0000-0000-0000-000000000005";
await admin(`insert into auth.users values ($1,'nuevo@correo.com')`, [FAN2]);
await como(FAN2, `insert into public.fans (id) values ($1)`, [FAN2], "nuevo@correo.com");
await como(FAN2, `select public.confirmar_mayoria_edad()`, [], "nuevo@correo.com");
ok("fan bloqueado no escribe", (await falla(FAN, `select public.escribir_a_creadora($1,'hola')`, "fan_bloqueado", [A], CF)) === true);
await admin(`delete from public.bloqueos where creadora_id=$1`, [A]);
ok("texto vacío rechazado", (await falla(FAN, `select public.escribir_a_creadora($1,'   ')`, "texto_invalido", [A], CF)) === true);
const conv = (await como(FAN, `select public.escribir_a_creadora($1,'Hola Vale') v`, [A], CF)).rows[0].v;
ok("fan que compró escribe", !!conv);
ok("fan sin compras no escribe", (await falla(FAN2, `select public.escribir_a_creadora($1,'hola')`, "sin_compra", [A], "nuevo@correo.com")) === true);
ok("suscriptor escribe sin haber comprado sets", !!(await como(FAN, `select public.escribir_a_creadora($1,'hola') v`, [B], CF)).rows[0].v);
ok("fan no inserta mensajes directo", (await falla(FAN, `insert into public.mensajes (conversacion_id,autor,texto) values ($1,'creadora','x')`, "permission denied", [conv], CF)) === true);
const bandeja = (await como(A, `select * from public.bandeja_creadora`)).rows;
ok(`creadora ve al fan por su nombre (${bandeja[0]?.fan_nombre})`, bandeja.length === 1 && bandeja[0].fan_nombre === "Beto" && bandeja[0].sin_leer === true && bandeja[0].compras >= 1);
ok("otra creadora no ve la conversación", (await como(B, `select * from public.mensajes where conversacion_id=$1`, [conv])).rows.length === 0);
ok("no adjunta sets ajenos", (await falla(A, `select public.escribir_a_fan($1,'mira',$2)`, "set_no_disponible", [conv, setB])) === true);
await como(A, `select public.escribir_a_fan($1,'Te mando uno nuevo',$2)`, [conv, setA]);
ok("fan ve respuesta sin leer", (await como(FAN, `select sin_leer, ultimo_con_set from public.bandeja_fan where id=$1`, [conv], CF)).rows[0]?.sin_leer === true);
await como(FAN, `select public.marcar_leida($1)`, [conv], CF);
ok("marcar leída", (await como(FAN, `select sin_leer from public.bandeja_fan where id=$1`, [conv], CF)).rows[0].sin_leer === false);
ok("B no escribe en conversación de A", (await falla(B, `select public.escribir_a_fan($1,'hola',null)`, "conversacion_no_encontrada", [conv])) === true);
for (let i = 0; i < 19; i++) await como(FAN, `select public.escribir_a_creadora($1,$2)`, [A, `mensaje ${i}`], CF);
ok("máximo 20 mensajes al día", (await falla(FAN, `select public.escribir_a_creadora($1,'uno más')`, "demasiados_mensajes", [A], CF)) === true);
await como(A, `update public.creadoras set mensajes_abiertos=false where id=$1`, [A]);
ok("mensajes cerrados", (await falla(FAN, `select public.escribir_a_creadora($1,'hola')`, "mensajes_cerrados", [A], CF)) === true);
await como(A, `update public.creadoras set mensajes_abiertos=true where id=$1`, [A]);

ok("grupo inválido", (await falla(A, `select public.enviar_set_a_fans($1,'todos',null)`, "grupo_invalido", [setA])) === true);
ok("envío a compradores llega al fan", (await como(A, `select public.enviar_set_a_fans($1,'compradores','Nuevo set') n`, [setA])).rows[0].n === 1);
ok("envío a seguidores", (await como(A, `select public.enviar_set_a_fans($1,'seguidores',null) n`, [setA])).rows[0].n === 1);
await como(FAN, `select * from public.desbloquear_con_tokens($1,'t9')`, [setA], CF).catch(() => {});
await admin(`insert into public.ordenes (set_id,creadora_id,correo,fan_id,metodo,precio_centavos,comision_centavos,procesador,procesador_ref,estado,pagada_en)
  values ($1,$2,$3,$4,'tokens',9900,1980,'tokens','ya_lo_tiene','pagada',now())`, [setA, A, CF, FAN]);
ok("no le llega a quien ya lo tiene", (await como(A, `select public.enviar_set_a_fans($1,'compradores',null) n`, [setA])).rows[0].n === 0);
ok("máximo 3 envíos al día", (await falla(A, `select public.enviar_set_a_fans($1,'compradores',null)`, "demasiados_envios", [setA])) === true);

ok("staff no lee conversaciones sin reporte", (await como(STAFF, `select * from public.mensajes where conversacion_id=$1`, [conv])).rows.length === 0);
const folioC = (await como(A, `select public.reportar_conversacion($1,'acoso','Insiste mucho') f`, [conv])).rows[0].f;
ok(`reporte de conversación con folio ${folioC}`, /^VR-\d{6}$/.test(folioC));
ok("staff lee la conversación reportada", (await como(STAFF, `select * from public.mensajes where conversacion_id=$1`, [conv])).rows.length > 0);
ok("B no reporta conversación ajena", (await falla(B, `select public.reportar_conversacion($1,'spam',null)`, "conversacion_no_encontrada", [conv])) === true);
await como(A, `select public.bloquear_desde_conversacion($1)`, [conv]);
ok("bloqueado desde el inbox ya no escribe", (await falla(FAN, `select public.escribir_a_creadora($1,'hola')`, "fan_bloqueado", [A], CF)) === true);
ok("la creadora ya no le escribe", (await falla(A, `select public.escribir_a_fan($1,'hola',null)`, "fan_bloqueado", [conv])) === true);
ok("bandeja marca bloqueado", (await como(A, `select bloqueado from public.bandeja_creadora where id=$1`, [conv])).rows[0].bloqueado === true);

console.log("\n── avisos por correo (Resend)");
ok("fan no pide destinatarios", (await falla(FAN, `select * from public.tomar_aviso_set($1)`, "permission denied", [setA], CF)) === true);
ok("creadora no pide destinatarios", (await falla(A, `select * from public.tomar_aviso_set($1)`, "permission denied", [setA])) === true);
const aviso1 = (await admin(`select destinatario from public.tomar_aviso_set($1)`, [setA])).rows.map((r) => r.destinatario);
ok(`set nuevo: lista de aviso sí, bloqueado y quien ya lo tiene no (${aviso1.join(", ")})`, aviso1.length === 1 && aviso1[0] === "nueva@correo.com");
ok("el mismo set no se avisa dos veces", (await admin(`select * from public.tomar_aviso_set($1)`, [setA])).rows.length === 0);
await admin(`select public.dar_de_baja(' Nueva@Correo.com ', $1)`, [A]);
ok("baja: sale de la lista de aviso", (await como(A, `select correos from public.mi_lista_aviso`)).rows[0].correos === 0);
ok("baja inválida", (await falla(null, `select public.dar_de_baja('nada', $1)`, "baja_invalida", [A])) === true);
await admin(`update public.sets set avisado_en=null where id=$1`, [setA]);
await admin(`insert into public.lista_aviso (creadora_id, correo) values ($1,'nueva@correo.com')`, [A]);
ok("quien se dio de baja no recibe", (await admin(`select * from public.tomar_aviso_set($1)`, [setA])).rows.length === 0);
const am = (await admin(`select * from public.tomar_aviso_mensaje($1,'creadora')`, [conv])).rows[0];
ok(`mensaje nuevo avisa a la creadora (${am?.destinatario}, de ${am?.de})`, am?.destinatario === "vale@x.com" && am?.de === "Beto");
ok("máximo un aviso cada 3 h", (await admin(`select * from public.tomar_aviso_mensaje($1,'creadora')`, [conv])).rows.length === 0);
ok("no se avisa a un fan bloqueado", (await admin(`select * from public.tomar_aviso_mensaje($1,'fan')`, [conv])).rows.length === 0);
await admin(`update public.conversaciones set correo_fan_en=null where id=$1`, [conv]);
const ae = (await admin(`select * from public.tomar_avisos_envio($1,$2, now() - interval '1 day')`, [A, setA])).rows;
ok("envío a grupo avisa a quien lo recibió", ae.length === 1 && ae[0].destinatario === CF && ae[0].conversacion === conv);
ok("y respeta el límite", (await admin(`select * from public.tomar_avisos_envio($1,$2, now() - interval '1 day')`, [A, setA])).rows.length === 0);

console.log("\n── acceso por usuario y contraseña");
ok("anónimo no puede reservar usuarios", (await falla("anon", `select public.asignar_usuario_acceso('nay_pecadora')`, "permission denied")) === true);
await como(A, `select public.asignar_usuario_acceso(' Nay_Pecadora ')`);
ok("normaliza el usuario y admite guion bajo", (await como(A, `select usuario from public.usuarios_acceso`)).rows[0].usuario === "nay_pecadora");
ok("otro usuario no lee el nombre de acceso", (await como(B, `select * from public.usuarios_acceso where id=$1`, [A])).rows.length === 0);
ok("anónimo no enumera nombres", (await falla("anon", `select * from public.usuarios_acceso`, "permission denied")) === true);
ok("no permite duplicar un usuario", (await falla(B, `select public.asignar_usuario_acceso('nay_pecadora')`, "duplicate key")) === true);
ok("rechaza nombres reservados", (await falla(B, `select public.asignar_usuario_acceso('admin')`, "check constraint")) === true);
ok("rechaza caracteres inválidos", (await falla(B, `select public.asignar_usuario_acceso('bad@email')`, "check constraint")) === true);
ok("no permite escribir la cuenta de otro", (await falla(B, `update public.usuarios_acceso set usuario='robada' where id=$1`, "permission denied", [A])) === true);
ok("cliente no modifica contadores", (await falla(A, `select public.tomar_intento_acceso(repeat('a',64))`, "permission denied")) === true);
for (let i=0;i<10;i++) ok(`intento permitido ${i+1}`, (await admin(`select public.tomar_intento_acceso(repeat('a',64)) as permitido`)).rows[0].permitido);
ok("bloquea el intento once", !(await admin(`select public.tomar_intento_acceso(repeat('a',64)) as permitido`)).rows[0].permitido);
await admin(`update public.intentos_acceso set desde=now()-interval '16 minutes'`);
ok("el límite caduca", (await admin(`select public.tomar_intento_acceso(repeat('a',64)) as permitido`)).rows[0].permitido);
const NUEVA = "11111111-0000-0000-0000-000000000024";
await admin(`insert into auth.users(id,email,raw_user_meta_data) values($1,'nueva@example.test','{"usuario_acceso":"cuenta_nueva"}')`, [NUEVA]);
ok("el alta reserva el nombre atómicamente", (await admin(`select usuario from public.usuarios_acceso where id=$1`, [NUEVA])).rows[0].usuario === "cuenta_nueva");
ok("un alta no permite apropiarse de un nombre ocupado", (await falla(null, `insert into auth.users(id,email,raw_user_meta_data) values('22222222-0000-0000-0000-000000000024','otra@example.test','{"usuario_acceso":"nay_pecadora"}')`, "duplicate key")) === true);

console.log("\n── publicación de la cuenta de pruebas");
ok("cliente no activa excepciones", (await falla(A, `insert into public.creadoras_prueba(creadora_id,motivo) values ($1,'auto')`, "permission denied", [A])) === true);
ok("cliente no lee auditoría de pruebas", (await falla(A, `select * from public.publicaciones_prueba`, "permission denied")) === true);
await admin(`insert into public.creadoras_prueba(creadora_id,motivo) values ($1,'Piloto autorizado')`, [A]);
await admin(`update public.creadoras set verificacion='aprobada' where id=$1`, [A]);
async function setPiloto(creadora) {
  const s = (await como(creadora, `insert into public.sets(creadora_id,titulo,precio_centavos) values ($1,'Piloto',9900) returning id`, [creadora])).rows[0].id;
  await admin(`insert into public.medios(creadora_id,set_id,estado,ancho,alto) values ($1,$2,'lista',1200,1600)`, [creadora,s]);
  return s;
}
const piloto = await setPiloto(A);
ok("piloto conserva declaración obligatoria", (await falla(A, `select public.enviar_a_moderacion($1,false)`, "falta_declaracion", [piloto])) === true);
await como(A, `select public.enviar_a_moderacion($1,true)`, [piloto]);
ok("cuenta habilitada publica sin staff", (await admin(`select estado from public.sets where id=$1`, [piloto])).rows[0].estado === "publicado");
ok("publicación automática deja registro", (await admin(`select count(*)::int n from public.publicaciones_prueba where set_id=$1`, [piloto])).rows[0].n === 1);
const normal = await setPiloto(B);
await como(B, `select public.enviar_a_moderacion($1,true)`, [normal]);
ok("otra cuenta sigue en moderación", (await admin(`select estado from public.sets where id=$1`, [normal])).rows[0].estado === "moderacion");
await admin(`update public.creadoras_prueba set activa=false where creadora_id=$1`, [A]);
const desactivado = await setPiloto(A);
await como(A, `select public.enviar_a_moderacion($1,true)`, [desactivado]);
ok("desactivar excepción restaura moderación", (await admin(`select estado from public.sets where id=$1`, [desactivado])).rows[0].estado === "moderacion");

console.log(fallas ? `\n${fallas} pruebas fallaron` : "\nTodas las pruebas pasaron");
process.exit(fallas ? 1 : 0);
