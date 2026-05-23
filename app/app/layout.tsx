import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "TuinRadar — Start je analyse",
  description: "Upload foto's van je tuin en ontvang persoonlijk advies op basis van weer, locatie en plantherkenning.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
