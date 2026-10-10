import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelioSense | Solar Yield Telemetry",
  description: "Carbon-styled ML inference dashboard for real-time solar AC yield prediction",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-carbon-gray100 text-carbon-gray10 min-h-screen">
        {children}
      </body>
    </html>
  );
}
