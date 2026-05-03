"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Smartphone } from "lucide-react";

const DISMISS_KEY = "pwa-banner-dismissed-until";
const INSTALLED_KEY = "pwa-installed";

export default function InstallBanner() {

  const checkDismissed = useCallback(() => {
    if (typeof window === "undefined") return false;

    const dismissedUntil = localStorage.getItem(DISMISS_KEY);

    return dismissedUntil && Date.now() < parseInt(dismissedUntil);
  }, []);

  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Client-only check after mount
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    if (!isStandalone && !checkDismissed() && !localStorage.getItem(INSTALLED_KEY)) {
      setShowBanner(true);
    }
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();

      setDeferredPrompt(e);

      if (!checkDismissed()) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "true");

      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [checkDismissed]);

  const handleDismiss = () => {
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

    localStorage.setItem(DISMISS_KEY, (Date.now() + oneWeekInMs).toString());

    setShowBanner(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('To install: tap the share button and "Add to Home Screen"');

      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
    }

    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-10 duration-500">
      <Card className="p-4 bg-primary text-white border-none shadow-2xl rounded-3xl flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <Smartphone className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-sm">Install ProService App</h4>

          <p className="text-[10px] text-white/80">
            Get a native experience and instant notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-white text-primary hover:bg-white/90 rounded-xl h-9 px-4 text-xs font-bold shadow-lg"
          >
            Install
          </Button>

          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
