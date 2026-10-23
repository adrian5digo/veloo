import type { Metadata } from "next";
import { Avisos } from "./avisos";

export const metadata: Metadata = { title: "Avisos · Veloo" };

export default async function Page({ searchParams }: PageProps<"/avisos">) {
  const { siguiente, de } = await searchParams;
  const nombre = typeof de === "string" && de.length <= 40 ? de : null;
  return (
    <Avisos
      siguiente={typeof siguiente === "string" ? siguiente : "/inicio"}
      ejemplo={nombre ? `${nombre} subió algo nuevo` : "Una creadora que sigues subió algo nuevo"}
    />
  );
}
