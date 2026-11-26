import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ilenHR · Leave workspace", description: "ilenHR candidate build exercise. Fictional demo data only." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
