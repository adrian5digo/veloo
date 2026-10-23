import Link from "next/link";
import { ArrowDownIcon, ArrowUpRightIcon, LockIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Boton } from "@/components/ui";
import { EscenaPortada } from "@/components/portada/escena";
import { DemoPortada } from "@/components/portada/demo";
import styles from "./portada.module.css";

export default function Page() {
  return (
    <div className={styles.portada}>
      <header className={styles.header}>
        <Link href="/" aria-label="Veloo, inicio" className={styles.logo}><span><LockIcon size={20} weight="bold" /></span>veloo</Link>
        <nav aria-label="Principal" className={styles.nav}><a href="#como-funciona" className={styles.navDetalle}>Cómo funciona</a><Link href="/entrar" className={styles.entrar}>Entrar <ArrowUpRightIcon size={18} weight="bold" /></Link></nav>
      </header>
      <main>
        <section className={styles.hero} aria-labelledby="titulo-portada">
          <div className={styles.heroTexto}>
            <p className={styles.eyebrow}><span /> Un espacio para lo que creas</p>
            <h1 id="titulo-portada">Tú creas.<br />Le pones precio.<br /><span>Lo haces tuyo.</span></h1>
            <p className={styles.intro}>Tus fotos, tus sets, tu propia página. Comparte un link y deja que tus fans vean lo que hay detrás del velo.</p>
            <div className={styles.acciones}><Boton href="/entrar?siguiente=/app/registro">Crear mi bóveda <ArrowUpRightIcon size={20} weight="bold" /></Boton><p>Para creadoras y fans mayores de 18 años.</p></div>
          </div>
          <EscenaPortada />
          <a href="#como-funciona" className={styles.bajar}><ArrowDownIcon size={18} weight="bold" /> Así se ve en Veloo</a>
        </section>
        <section id="como-funciona" className={styles.como} aria-labelledby="titulo-como">
          <div className={styles.cabeceraSeccion}><p className={styles.eyebrow}>01 de tu cámara a tu bóveda</p><h2 id="titulo-como">Algo tuyo.<br />Un link para compartirlo.</h2><p>Arma un set, elige su precio y compártelo con quienes quieren ver más de ti.</p></div>
          <DemoPortada />
        </section>
        <section className={styles.cierre} aria-labelledby="titulo-cierre"><ShieldCheckIcon size={32} weight="bold" /><div><p className={styles.eyebrow}>02 tú decides qué compartes</p><h2 id="titulo-cierre">Un poquito de misterio.<br />Todo bajo tu control.</h2></div><div className={styles.cierreTexto}><p>Tus originales son privados. Tus fans ven una vista con velo hasta tener acceso al set.</p><p>Solo contenido sin desnudos ni contenido sexual. Para mayores de 18 años.</p><Link href="/entrar?siguiente=/app/registro">Empezar mi bóveda <ArrowUpRightIcon size={18} weight="bold" /></Link></div></section>
      </main>
      <footer className={styles.footer}><span className={styles.marcaFooter}>veloo</span><p>Hecho para compartir a tu manera.</p><div><Link href="/terminos">Términos</Link><Link href="/privacidad">Privacidad</Link></div></footer>
    </div>
  );
}
