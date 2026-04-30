'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone || 
                         document.referrer.includes('android-app://')
    
    if (isStandalone) {
      setShowBanner(false)
      return
    }

    const checkDismissed = () => {
      const dismissedUntil = localStorage.getItem('pwa-banner-dismissed-until')
      return dismissedUntil && Date.now() < parseInt(dismissedUntil)
    }

    if (checkDismissed()) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!checkDismissed()) {
        setShowBanner(true)
      }
    }

    const handleAppInstalled = () => {
      setShowBanner(false)
      setDeferredPrompt(null)
      localStorage.setItem('pwa-installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Fallback: show banner if not standalone after 3 seconds for iOS or others
    const timer = setTimeout(() => {
      if (!isStandalone && !checkDismissed() && !localStorage.getItem('pwa-installed')) {
        setShowBanner(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000
    localStorage.setItem('pwa-banner-dismissed-until', (Date.now() + oneWeekInMs).toString())
    setShowBanner(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS/others where prompt isn't supported
      alert('To install: tap the share button and "Add to Home Screen"')
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-10 duration-500">
      <Card className="p-4 bg-primary text-white border-none shadow-2xl rounded-3xl flex items-center gap-4 relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-bold text-sm">Install ProService App</h4>
          <p className="text-[10px] text-white/80">Get a native experience and instant notifications.</p>
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
  )
}
