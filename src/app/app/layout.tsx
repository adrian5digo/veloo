import type { ReactNode } from "react";
import { EspacioCreadora } from "@/components/creadora/espacio";
import "./creadora.css";

export default function Layout({ children }: { children: ReactNode }) {
  return <EspacioCreadora>{children}</EspacioCreadora>;
}
