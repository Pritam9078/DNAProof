"use client";

import { motion } from "framer-motion";

const logos = [
  "Ethereum", "Hyperledger", "IPFS", "Polygon", "Chainlink", "ConsenSys"
];

export const TrustLogos = () => {
  return (
    <section className="py-20 border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[10px] font-black tracking-[0.4em] uppercase text-foreground/30 mb-12">
          Powering Trust for Global Enterprises
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
          {logos.map((logo) => (
            <div key={logo} className="text-2xl font-black italic tracking-tighter">
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
