import type { Metadata } from "next";
import { Entrar } from "./entrar";

export const metadata: Metadata = { title: "Entrar · Veloo" };

export default async function Page({ searchParams }: PageProps<"/entrar">) {
  const { siguiente, vencido, codigo } = await searchParams;
  return <Entrar siguiente={typeof siguiente === "string" ? siguiente : "/app/subir"} vencido={vencido === "1"} codigo={codigo === "1"} />;
}
