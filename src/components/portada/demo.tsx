"use client";
import { useState } from "react";
import { ArrowRightIcon, CheckIcon, CreditCardIcon, CopyIcon, ImageIcon, LinkIcon, LockIcon } from "@phosphor-icons/react";
import styles from "@/app/portada.module.css";

const pasos = [
  { titulo: "Arma tu set", texto: "Reúne tus fotos y elige el precio. Antes de publicarse, el equipo revisa tu set." },
  { titulo: "Comparte tu link", texto: "Tu página reúne tus sets y tus links. Ponla en tu bio o compártela en tus historias." },
  { titulo: "Recibe tu pago", texto: "En el piloto, tus fans pagan el set con tarjeta. Una vez comprado, su acceso es permanente." },
];
export function DemoPortada() {
  const [paso, cambiarPaso] = useState(0);
  return <div className={styles.demo}>
    <div className={styles.pasos} aria-label="Pasos para compartir un set">{pasos.map((p, i) => <button key={p.titulo} type="button" aria-pressed={paso === i} onClick={() => cambiarPaso(i)} className={paso === i ? styles.pasoActivo : styles.paso}><span className={styles.numero}>0{i + 1}</span><span><strong>{p.titulo}</strong><span className={styles.pasoTexto}>{p.texto}</span></span><ArrowRightIcon size={20} weight="bold" /></button>)}</div>
    <div className={styles.demoLienzo}><p className={styles.etiquetaDemo}>Una vuelta por tu futura bóveda <span>Ejemplo ilustrativo</span></p><div className={styles.telefono}><div className={styles.telefonoBarra}><span /><span>veloo</span><LockIcon size={18} weight="bold" /></div><div className={styles.demoContenido} key={paso}>
      <p className={styles.demoSobre}>{paso === 0 ? "Tu próximo set" : paso === 1 ? "Tu página, a tu manera" : "Así se registra una compra"}</p><h3>{paso === 0 ? "Domingo sin prisa" : paso === 1 ? "La bóveda de Dani" : "Alguien quiere ver más"}</h3>
      {paso !== 2 ? <><div className={styles.setEjemplo}><div className={styles.veloEjemplo} /><span className={styles.candado}><LockIcon size={24} weight="bold" /></span><span className={styles.precio}>$149 MXN</span></div><div className={styles.setPie}><span><ImageIcon size={18} weight="bold" /> 12 fotos</span><span>Vista con velo</span></div></> : <div className={styles.compraEjemplo}><span className={styles.moneda}><CreditCardIcon size={40} weight="bold" /></span><p>Set comprado</p><strong>$149 MXN</strong><span className={styles.compraEstado}><CheckIcon size={16} weight="bold" /> Acceso al set confirmado</span></div>}
      {paso === 0 ? <div className={styles.detalleDemo}><span>Precio de tu set</span><strong>$149 MXN</strong></div> : paso === 1 ? <div className={styles.linkEjemplo}><LinkIcon size={18} weight="bold" /><span>veloo.vip/u/dani</span><CopyIcon size={18} weight="bold" /></div> : <p className={styles.notaTokens}>Comisión del 20%. Tu parte queda retenida 7 días.</p>}
      <div className={styles.demoEstado}><span />{paso === 0 ? "Listo para mandar a revisión" : paso === 1 ? "Un link para tu bio" : "Movimiento de ejemplo, sin cobro"}</div>
    </div></div><span className={styles.notaMano}>{paso === 0 ? "empieza con algo tuyo" : paso === 1 ? "llévalo a tus historias" : "cada set cuenta"}</span></div>
  </div>;
}
