'use client'

import { useState, useTransition, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateProfile } from "@/actions/profile-actions";
import { createClient } from "@/lib/supabase/client";

export default function SettingsForm({ user, profile }: { user: any, profile: any }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para fazer o upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      // Update profile immediately
      const result = await updateProfile({ avatar_url: publicUrl });
      if (result?.error) throw new Error(result.error);
      
      setStatus({ type: 'success', message: 'Foto de perfil atualizada com sucesso!' });
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setStatus(null);
    startTransition(async () => {
      const data = {
        full_name: formData.get('full_name') as string,
        bio: formData.get('bio') as string,
        profession_title: formData.get('profession_title') as string,
        hourly_rate: Number(formData.get('hourly_rate')),
        avatar_url: avatarUrl, // Include avatar url in standard update
      }
      
      const result = await updateProfile(data);
      
      if (result?.error) {
        setStatus({ type: 'error', message: result.error });
      } else {
        setStatus({ type: 'success', message: 'Perfil atualizado com sucesso!' });
        setTimeout(() => setStatus(null), 3000);
      }
    });
  }

  return (
    <Card className="p-8 rounded-[32px] border-primary/5 shadow-xl shadow-primary/[0.02] bg-card/50 backdrop-blur-xl">
      <form action={handleSubmit} className="space-y-8">
        {/* Status Message */}
        {status && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            status.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-bold">{status.message}</p>
          </div>
        )}

        <div className="flex items-center gap-6 pb-8 border-b border-muted">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[28px] bg-primary/10 overflow-hidden border-4 border-background shadow-lg transition-transform group-hover:scale-105 relative">
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              <img src={avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarUpload}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="text-lg font-bold">Foto de Perfil</h3>
            <p className="text-sm text-muted-foreground">PNG ou JPG. Max 5MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
            <Input 
              id="full_name" 
              name="full_name"
              defaultValue={profile?.full_name || ""} 
              className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Endereço de E-mail</Label>
            <Input 
              id="email" 
              value={user.email || ""} 
              disabled 
              className="h-12 rounded-2xl bg-muted/50 border border-input cursor-not-allowed opacity-70"
            />
          </div>
        </div>

        {profile?.role === 'provider' && (
          <div className="space-y-6 pt-6 border-t border-muted">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="profession_title" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Título Profissional</Label>
                <Input 
                  id="profession_title" 
                  name="profession_title"
                  defaultValue={profile.provider_profiles?.profession_title || ""} 
                  className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
                  placeholder="Ex: Eletricista, Encanador..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Taxa Horária (R$)</Label>
                <Input 
                  id="hourly_rate" 
                  name="hourly_rate"
                  type="number"
                  defaultValue={profile.provider_profiles?.hourly_rate || 0} 
                  className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Biografia / Descrição</Label>
              <Textarea 
                id="bio" 
                name="bio"
                defaultValue={profile.provider_profiles?.bio || ""} 
                className="min-h-[120px] rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
                placeholder="Conte aos clientes sobre sua experiência..."
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isPending}
            className="h-12 px-8 rounded-2xl font-bold bg-primary hover:bg-accent shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
