import type { Metadata } from "next";
import { NuevoSet } from "./nuevo-set";

export const metadata: Metadata = { title: "Nuevo set · Veloo" };

export default function Page() {
  return <NuevoSet />;
}
