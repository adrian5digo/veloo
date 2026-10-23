import type { ReactNode } from "react";

export function CabeceraCreadora({ titulo, detalle, accion }: { titulo: string; detalle: string; accion?: ReactNode }) {
  return <header className="cabecera-creadora"><div><p className="antetitulo-creadora">Hecho por ti, a tu manera</p><h1>{titulo}</h1><p className="detalle-creadora">{detalle}</p></div>{accion && <div className="accion-creadora">{accion}</div>}</header>;
}
