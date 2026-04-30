'use client'

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bell, Mail, Smartphone } from "lucide-react";

export default function NotificationSettings() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8 rounded-[32px] border-primary/5 shadow-xl shadow-primary/[0.02] bg-card/50 backdrop-blur-xl space-y-8">
        <div>
          <h2 className="text-xl font-bold">Preferências de Notificação</h2>
          <p className="text-sm text-muted-foreground mt-1">Escolha como você deseja ser notificado sobre atividades.</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold">Notificações por E-mail</h4>
                <p className="text-sm text-muted-foreground">Receba atualizações importantes no seu e-mail.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
               <input type="checkbox" id="email_notif" defaultChecked className="w-5 h-5 accent-primary rounded cursor-pointer" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold">Notificações Push</h4>
                <p className="text-sm text-muted-foreground">Receba alertas no seu navegador ou celular.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
               <input type="checkbox" id="push_notif" defaultChecked className="w-5 h-5 accent-primary rounded cursor-pointer" />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold">Alertas de Promoções</h4>
                <p className="text-sm text-muted-foreground">Receba ofertas e novidades da plataforma.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
               <input type="checkbox" id="promo_notif" className="w-5 h-5 accent-primary rounded cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-muted">
          <Button className="h-12 px-8 rounded-2xl font-bold bg-primary hover:bg-accent shadow-lg shadow-primary/20">
            Salvar Preferências
          </Button>
        </div>
      </Card>
    </div>
  );
}
