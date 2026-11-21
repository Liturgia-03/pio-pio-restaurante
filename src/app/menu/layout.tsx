import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menú Pío Pío | Carta Digital",
  description: "Carta digital interactiva de Asadero y Restaurante Pío Pío. Pollos asados, apanados, combos, bandejas y bebidas.",
  manifest: "/manifest-menu.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Menú Pío Pío",
  },
  icons: {
    apple: "/logo-pio-pio.png",
  },
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
