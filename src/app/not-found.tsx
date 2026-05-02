"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 px-6 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Icon/Illustration Container */}
          <div className="relative mb-8 inline-block">
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="bg-primary/10 p-8 rounded-3xl backdrop-blur-sm border border-primary/20 shadow-2xl shadow-primary/20"
            >
              <Search className="w-20 h-20 text-primary" strokeWidth={1.5} />
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -top-2 -right-2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-bold shadow-lg"
            >
              404
            </motion.div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60">
            Página Perdida
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl mb-12 max-w-md mx-auto leading-relaxed">
            Parece que você seguiu um caminho que não existe. Não se preocupe,
            nosso GPS deu uma falhadinha.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-2xl px-8 h-14 text-base font-semibold group transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              )}
            >
              <Home className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Voltar ao Início
            </Link>

            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl px-8 h-14 text-base font-semibold border-2 hover:bg-muted/50 transition-all duration-300"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 w-5 h-5" />
              Voltar
            </Button>
          </div>
        </motion.div>

        {/* Floating Numbers Decorative */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none opacity-[0.03] select-none text-[20vw] font-black flex items-center justify-center">
          404
        </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
    </div>
  );
}
