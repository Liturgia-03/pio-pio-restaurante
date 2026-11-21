import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesero Pío Pío | Salón y Comandas",
  description: "Toma de pedidos y atención en salón para meseros de Pío Pío Asadero y Restaurante.",
  manifest: "/manifest-waiter.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mesero Pío Pío",
  },
  icons: {
    apple: "/logo-pio-pio.png",
  },
};

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
