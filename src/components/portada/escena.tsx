"use client";

import { useEffect, useRef, useState } from "react";
import { LockIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import styles from "@/app/portada.module.css";

type Punto = { x: number; y: number };

/** Siluetas propias, sin imágenes ni contenido de usuarias. */
function silueta(tipo: number): Punto[] {
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 400;
  const c = lienzo.getContext("2d");
  if (!c) return [];
  c.fillStyle = "black";
  if (tipo === 0) {
    c.lineWidth = 23;
    c.beginPath(); c.arc(200, 144, 63, Math.PI, 0); c.stroke();
    c.fillRect(126, 143, 23, 43); c.fillRect(251, 143, 23, 43);
    c.beginPath(); c.roundRect(98, 175, 204, 151, 26); c.fill();
    c.globalCompositeOperation = "destination-out";
    c.beginPath(); c.arc(200, 237, 17, 0, Math.PI * 2); c.fill();
    c.fillRect(192, 239, 16, 38);
  } else if (tipo === 1) {
    c.save(); c.translate(200, 200); c.rotate(-0.16);
    c.lineWidth = 12; c.beginPath(); c.roundRect(-112, -106, 178, 219, 22); c.stroke(); c.restore();
    c.save(); c.translate(226, 214); c.rotate(0.13);
    c.beginPath(); c.roundRect(-89, -111, 178, 222, 22); c.fill();
    c.globalCompositeOperation = "destination-out";
    c.beginPath(); c.arc(0, -15, 23, Math.PI, 0); c.lineWidth = 9; c.stroke();
    c.beginPath(); c.roundRect(-36, -14, 72, 57, 9); c.fill(); c.restore();
  } else {
    c.lineWidth = 13;
    c.beginPath(); c.arc(200, 205, 112, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(200, 205, 88, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 22; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(159, 181); c.lineTo(200, 247); c.lineTo(241, 181); c.stroke();
  }
  const pixeles = c.getImageData(0, 0, 400, 400).data;
  const puntos: Punto[] = [];
  for (let y = 55; y < 345; y += 6) for (let x = 55; x < 345; x += 6) {
    if (pixeles[(y * 400 + x) * 4 + 3] > 100) puntos.push({ x: x + Math.sin(x * y) * 1.6, y: y + Math.cos(x + y) * 1.6 });
  }
  return puntos.sort((a, b) => Math.sin(a.x * 12.9 + a.y * 78.2) - Math.sin(b.x * 12.9 + b.y * 78.2));
}

export function EscenaPortada() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reloj = useRef(0);
  const [pausada, pausar] = useState(false);
  useEffect(() => {
    const elemento = canvas.current;
    const contexto = elemento?.getContext("2d");
    if (!elemento || !contexto) return;
    const figuras = [0, 1, 2].map(silueta);
    if (figuras.some((f) => !f.length)) return;
    const colores = getComputedStyle(elemento);
    const rosa = colores.getPropertyValue("--accent").trim();
    const ciruela = colores.getPropertyValue("--text").trim();
    const suave = colores.getPropertyValue("--accent-soft").trim();
    const reducido = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, tiempo = reloj.current, anterior = 0, visible = true;
    const pintar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const ancho = elemento.clientWidth;
      if (elemento.width !== Math.round(ancho * dpr)) { elemento.width = Math.round(ancho * dpr); elemento.height = elemento.width; }
      contexto.setTransform(elemento.width / 400, 0, 0, elemento.height / 400, 0, 0);
      contexto.clearRect(0, 0, 400, 400);
      const etapa = reducido.matches ? 0 : tiempo / 4500;
      const indice = Math.floor(etapa) % 3;
      const cambio = Math.max(0, Math.min(1, ((etapa % 1) - 0.58) / 0.42));
      const mezcla = cambio * cambio * (3 - 2 * cambio);
      for (let i = 0; i < 950; i++) {
        const a = figuras[indice][i % figuras[indice].length];
        const b = figuras[(indice + 1) % 3][i % figuras[(indice + 1) % 3].length];
        const flotar = reducido.matches ? 0 : Math.sin(tiempo / 1100 + i * 1.7) * 1.8;
        const x = a.x + (b.x - a.x) * mezcla + flotar;
        const y = a.y + (b.y - a.y) * mezcla + flotar * 0.7;
        contexto.fillStyle = i % 5 === 0 ? ciruela : rosa;
        contexto.globalAlpha = 0.55 + (i % 4) * 0.15;
        contexto.beginPath(); contexto.arc(x, y, i % 7 === 0 ? 2.2 : 1.5, 0, Math.PI * 2); contexto.fill();
      }
      contexto.globalAlpha = 1; contexto.fillStyle = suave;
      for (let i = 0; i < 32; i++) { const angulo = i * 2.399, radio = 155 + (i % 5) * 6; contexto.beginPath(); contexto.arc(200 + Math.cos(angulo) * radio, 200 + Math.sin(angulo) * radio, 1.2, 0, Math.PI * 2); contexto.fill(); }
      elemento.dataset.listo = "true";
    };
    const animar = (ahora: number) => { if (anterior) tiempo += Math.min(ahora - anterior, 60); anterior = ahora; pintar(); frame = requestAnimationFrame(animar); };
    const actualizar = () => { cancelAnimationFrame(frame); anterior = 0; pintar(); if (!pausada && !reducido.matches && visible && !document.hidden) frame = requestAnimationFrame(animar); };
    const observer = new IntersectionObserver(([entrada]) => { visible = entrada.isIntersecting; actualizar(); }); observer.observe(elemento);
    const resize = new ResizeObserver(actualizar); resize.observe(elemento);
    reducido.addEventListener("change", actualizar); document.addEventListener("visibilitychange", actualizar); actualizar();
    return () => { reloj.current = tiempo; cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); reducido.removeEventListener("change", actualizar); document.removeEventListener("visibilitychange", actualizar); };
  }, [pausada]);
  return <div className={styles.escena}><div className={styles.anillo} aria-hidden="true" /><div className={styles.particulas} aria-hidden="true"><canvas ref={canvas} /><LockIcon className={styles.fallback} size={140} weight="duotone" /></div><div className={styles.notaArriba}><span /> Solo para tus fans</div><div className={styles.notaAbajo}><LockIcon size={18} weight="bold" /><div>Lo que creas vale.<small>Tú decides cuánto.</small></div></div><p className={styles.firma}>un poquito de misterio</p><button className={styles.pausa} type="button" onClick={() => pausar(!pausada)} aria-label={pausada ? "Reanudar animación" : "Pausar animación"} aria-pressed={pausada}>{pausada ? <PlayIcon size={16} weight="fill" /> : <PauseIcon size={16} weight="bold" />}</button></div>;
}
