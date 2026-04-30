'use client'

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, AlertTriangle } from "lucide-react";

export default function AccountSettings({ user }: { user: any }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8 rounded-[32px] border-primary/5 shadow-xl shadow-primary/[0.02] bg-card/50 backdrop-blur-xl space-y-8">
        <div>
          <h2 className="text-xl font-bold">Segurança da Conta</h2>
          <p className="text-sm text-muted-foreground mt-1">Atualize sua senha e mantenha sua conta segura.</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Senha Atual</Label>
              <Input 
                id="current_password" 
                type="password"
                className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nova Senha</Label>
              <Input 
                id="new_password" 
                type="password"
                className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button className="h-12 px-8 rounded-2xl font-bold bg-primary hover:bg-accent shadow-lg shadow-primary/20">
              Atualizar Senha
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-8 rounded-[32px] border-destructive/20 shadow-xl bg-destructive/5 space-y-6">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-destructive/10 text-destructive rounded-2xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-destructive">Zona de Perigo</h3>
            <p className="text-sm text-muted-foreground mt-1">A exclusão da sua conta é permanente e não pode ser desfeita.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="destructive" className="rounded-xl font-bold">Excluir Conta</Button>
        </div>
      </Card>
    </div>
  );
}
