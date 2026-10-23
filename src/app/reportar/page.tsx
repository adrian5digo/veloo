import type { Metadata } from "next";
import { Reportar } from "./reportar";

export const metadata: Metadata = { title: "Reportar · Veloo", robots: { index: false } };

export default async function Page({ searchParams }: PageProps<"/reportar">) {
  const { set, creadora } = await searchParams;
  return <Reportar setId={typeof set === "string" ? set : undefined} usuario={typeof creadora === "string" ? creadora : undefined} />;
}
