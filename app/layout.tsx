import "./globals.css";
import { Inter, Geist } from "next/font/google";
import { Providers } from "./providers";
import { Metadata } from "next";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DNAProof | Hybrid Document Verification",
  description: "Secure, scalable, and privacy-preserving document verification using Ethereum and Hyperledger Fabric.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
