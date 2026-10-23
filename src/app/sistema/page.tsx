import type { Metadata } from "next";
import { Vitrina } from "./vitrina";

export const metadata: Metadata = { title: "Componentes · Veloo" };

export default function Page() {
  return <Vitrina />;
}
