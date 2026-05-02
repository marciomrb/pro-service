'use client'

import Link from 'next/link';
import { Menu, X, Compass, Rss, Info, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";

interface LandingHeaderProps {
  user: any;
}

export function LandingHeader({ user }: LandingHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link 
        href="/explore" 
        className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
        onClick={() => setIsOpen(false)}
      >
        Explorar
      </Link>
      <Link 
        href="/feed" 
        className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
        onClick={() => setIsOpen(false)}
      >
        Feed
      </Link>
      <Link 
        href="#" 
        className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
        onClick={() => setIsOpen(false)}
      >
        Sobre
      </Link>
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-muted/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo_full.webp" alt="ProService" className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button className="rounded-xl font-bold bg-primary hover:bg-accent px-6 shadow-md shadow-primary/10">
                Painel
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:flex rounded-xl font-bold text-muted-foreground hover:text-primary">
                  Entrar
                </Button>
              </Link>
              <Link href="/login?tab=register">
                <Button className="rounded-xl font-bold bg-primary hover:bg-accent px-6 shadow-md shadow-primary/10">
                  Cadastrar
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden rounded-xl hover:bg-primary/5" />
              }
            >
              <Menu className="w-6 h-6 text-primary" />
            </SheetTrigger>
            
            <SheetContent 
              side="right" 
              className="w-full sm:w-[380px] rounded-l-[2.5rem] p-0 border-none bg-white shadow-2xl flex flex-col"
              showCloseButton={false}
            >
              <div className="flex-1 flex flex-col overflow-y-auto pt-12 px-8">
                <div className="flex items-center justify-between mb-12">
                  <img src="/logo_full.webp" alt="ProService" className="h-9 w-auto" />
                  <SheetClose render={<Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-primary/5 text-muted-foreground" />}>
                    <X className="w-5 h-5" />
                  </SheetClose>
                </div>
                
                <nav className="flex flex-col gap-3">
                  <Link 
                    href="/explore" 
                    className="group flex items-center p-4 rounded-2xl text-lg font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mr-4 group-hover:bg-primary/10 transition-colors">
                      <Compass className="w-6 h-6 text-primary" />
                    </div>
                    Explorar
                  </Link>
                  
                  <Link 
                    href="/feed" 
                    className="group flex items-center p-4 rounded-2xl text-lg font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mr-4 group-hover:bg-primary/10 transition-colors">
                      <Rss className="w-6 h-6 text-primary" />
                    </div>
                    Feed
                  </Link>
                  
                  <Link 
                    href="#" 
                    className="group flex items-center p-4 rounded-2xl text-lg font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mr-4 group-hover:bg-primary/10 transition-colors">
                      <Info className="w-6 h-6 text-primary" />
                    </div>
                    Sobre
                  </Link>
                </nav>
              </div>

              <div className="p-8 bg-muted/5 border-t border-muted/10">
                {!user ? (
                  <div className="flex flex-col gap-4">
                    <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                      <Button variant="outline" className="w-full rounded-2xl font-bold h-14 text-base border-primary/10 hover:bg-white flex items-center justify-center gap-2">
                        <LogIn className="w-5 h-5" />
                        Entrar
                      </Button>
                    </Link>
                    <Link href="/login?tab=register" onClick={() => setIsOpen(false)} className="w-full">
                      <Button className="w-full rounded-2xl font-bold h-14 text-base bg-primary hover:bg-accent shadow-lg shadow-primary/10 flex items-center justify-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Cadastrar
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href="/dashboard" onClick={() => setIsOpen(false)} className="w-full">
                    <Button className="w-full rounded-2xl font-bold h-14 text-base bg-primary hover:bg-accent shadow-lg shadow-primary/10 flex items-center justify-center gap-2">
                      <LayoutDashboard className="w-5 h-5" />
                      Acessar Painel
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
