// Guarda en src/lib/database.types.ts la salida de generate_typescript_types (MCP de Supabase).
// Uso: node scripts/guardar-tipos.mjs <archivo.json con la respuesta del MCP>
import { readFileSync, writeFileSync } from "node:fs";

const respuesta = JSON.parse(readFileSync(process.argv[2], "utf8"));
// El MCP a veces responde [{ text: "{\"types\": …}" }] y a veces { types } directo.
const { types } = Array.isArray(respuesta) ? JSON.parse(respuesta[0].text) : respuesta;
writeFileSync(
  new URL("../src/lib/database.types.ts", import.meta.url),
  "// Generado desde Supabase (MCP generate_typescript_types). No editar a mano: regenerar tras cada migración.\n\n" + types,
);
