"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { createServiceRequest } from "@/actions/service-request-actions";
import { getUserProfile } from "@/actions/profile-actions";
import { useGeolocation } from "@/hooks/use-geolocation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewServiceRequestPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] =
    useState<string>("");
  const [urgency, setUrgency] = useState<string>("normal");
  const [availableSubCategories, setAvailableSubCategories] = useState<any[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [locationType, setLocationType] = useState<"saved" | "current" | "custom">("current");
  const [customAddress, setCustomAddress] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [customState, setCustomState] = useState("");
  const [customZip, setCustomZip] = useState("");
  const [customLat, setCustomLat] = useState<number | null>(null);
  const [customLng, setCustomLng] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { location, error: geoError, loading: geoLoading, getLocation } = useGeolocation();

  useEffect(() => {
    async function loadCategories() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (data) {
        setCategories(data);
      }
    }
    loadCategories();

    async function loadProfile() {
      const p = await getUserProfile();
      if (p) {
        setProfile(p);
        if (p.location) {
          setLocationType("saved");
        }
      }
    }
    loadProfile();
  }, []);

  const mainCategories = categories.filter((c) => !c.parent_id);

  const handleCategoryChange = (value: string) => {
    setSelectedParentId(value);
    setSelectedSubCategoryId("");
    const subs = categories.filter((c) => c.parent_id === value);
    setAvailableSubCategories(subs);
  };

  const handleGeocode = async () => {
    if (locationType !== "custom") return;
    if (!customAddress || !customCity || !customState) return;

    setIsGeocoding(true);
    try {
      const fullAddress = `${customAddress}, ${customNumber}, ${customCity}, ${customState}, ${customZip}, Brazil`;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK") {
        const { lat, lng } = data.results[0].geometry.location;
        setCustomLat(lat);
        setCustomLng(lng);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    const budgetRaw = formData.get("budget") as string;

    const result = await createServiceRequest({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category_id: selectedSubCategoryId || selectedParentId,
      budget: budgetRaw ? parseFloat(budgetRaw) : null,
      urgency,
      location: 
        locationType === "current" && location 
          ? { lat: location.latitude, lng: location.longitude }
          : locationType === "saved" && profile?.latitude && profile?.longitude
            ? { 
                lat: profile.latitude, 
                lng: profile.longitude 
              }
            : locationType === "custom" && customLat && customLng
              ? { lat: customLat, lng: customLng }
              : undefined,
      address: locationType === "custom" 
        ? customAddress
        : locationType === "saved" 
          ? (profile.client_profiles?.[0]?.address || profile.client_profiles?.address)
          : undefined,
      street_number: locationType === "custom"
        ? customNumber
        : locationType === "saved"
          ? (profile.client_profiles?.[0]?.street_number || profile.client_profiles?.street_number)
          : undefined,
      latitude: locationType === "custom" ? customLat || undefined : (locationType === "saved" ? profile?.latitude : undefined),
      longitude: locationType === "custom" ? customLng || undefined : (locationType === "saved" ? profile?.longitude : undefined),
    });

    setIsSubmitting(false);

    if (result.success) {
      setStatus({
        type: "success",
        message:
          "Solicitação publicada com sucesso! Em breve profissionais entrarão em contato.",
      });
    } else {
      setStatus({
        type: "error",
        message: result.error || "Erro ao publicar solicitação. Tente novamente.",
      });
    }
  }

  if (status?.type === "success") {
    return (
      <div className="max-w-2xl mx-auto py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Solicitação Enviada!</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          {status.message}
        </p>
        <div className="flex gap-4">
          <Link
            href="/dashboard/client"
            className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Voltar ao Painel
          </Link>
          <button
            onClick={() => setStatus(null)}
            className="px-6 py-3 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors"
          >
            Nova Solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Solicitar Serviço
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Descreva o que você precisa e encontre os melhores profissionais.
        </p>
      </div>

      {status?.type === "error" && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p>{status.message}</p>
        </div>
      )}

      <Card className="p-6 sm:p-8 rounded-3xl border-border/50 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground ml-1">
              O que você precisa?
            </label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                name="title"
                required
                placeholder="Ex: Instalação de Ar Condicionado"
                className="w-full pl-12 pr-4 h-12 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">
                Categoria Principal
              </label>
              <Select
                value={selectedParentId}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full h-12 bg-muted/20 border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">
                Subcategoria (Opcional)
              </label>
              <Select
                value={selectedSubCategoryId}
                onValueChange={setSelectedSubCategoryId}
                disabled={
                  !selectedParentId || availableSubCategories.length === 0
                }
              >
                <SelectTrigger className="w-full h-12 bg-muted/20 border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue
                    placeholder={
                      availableSubCategories.length > 0
                        ? "Selecione..."
                        : "Nenhuma subcategoria"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSubCategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground ml-1">
              Descrição Detalhada
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Descreva o máximo de detalhes possível sobre o serviço necessário..."
              className="w-full p-4 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">
                Orçamento Estimado (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  name="budget"
                  min="0"
                  placeholder="Ex: 500"
                  className="w-full pl-12 pr-4 h-12 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">
                Urgência
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger className="w-full h-12 pl-12 bg-muted/20 border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all">
                    <SelectValue placeholder="Normal (Sem pressa)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal (Sem pressa)</SelectItem>
                    <SelectItem value="medium">Média (Próximos dias)</SelectItem>
                    <SelectItem value="high">Alta (Urgente/Hoje)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground ml-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Localização do Serviço
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {profile?.location && (
                <button
                  type="button"
                  onClick={() => setLocationType("saved")}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    locationType === "saved"
                      ? "bg-primary text-white border-primary"
                      : "bg-muted/20 border-input hover:bg-muted/30"
                  }`}
                >
                  Endereço Salvo
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setLocationType("current");
                  if (!location) getLocation();
                }}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  locationType === "current"
                    ? "bg-primary text-white border-primary"
                    : "bg-muted/20 border-input hover:bg-muted/30"
                }`}
              >
                Localização Atual
              </button>
              <button
                type="button"
                onClick={() => setLocationType("custom")}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  locationType === "custom"
                    ? "bg-primary text-white border-primary"
                    : "bg-muted/20 border-input hover:bg-muted/30"
                }`}
              >
                Outro Endereço
              </button>
            </div>

            {locationType === "current" && (
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={geoLoading}
                  className={`w-full h-12 rounded-xl font-bold gap-2 flex items-center justify-center transition-all ${
                    location 
                      ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                      : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                  }`}
                >
                  {geoLoading ? "Obtendo..." : location ? "Localização Capturada" : "Capturar GPS agora"}
                  <Navigation className={`w-4 h-4 ${geoLoading ? 'animate-pulse' : ''}`} />
                </button>
                {location && (
                  <p className="text-xs text-muted-foreground text-center">
                    Coordenadas: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                )}
                {geoError && <p className="text-xs text-destructive text-center">{geoError}</p>}
              </div>
            )}

            {locationType === "saved" && profile && (
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-sm text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Usando o endereço do seu perfil: <span className="font-bold">
                    {[
                      profile.client_profiles?.[0]?.address || profile.client_profiles?.address,
                      profile.client_profiles?.[0]?.street_number || profile.client_profiles?.street_number,
                      profile.client_profiles?.[0]?.city || profile.client_profiles?.city,
                      profile.client_profiles?.[0]?.state || profile.client_profiles?.state
                    ].filter(Boolean).join(', ') || "Localização salva"}
                  </span>
                </p>
                {profile.latitude && profile.longitude && (
                  <p className="text-[10px] text-muted-foreground mt-1 ml-6">
                    Coordenadas: {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            )}

              {locationType === "custom" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3">
                    <input
                      name="address"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      onBlur={handleGeocode}
                      placeholder="Rua / Logradouro"
                      className="w-full px-4 h-12 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required={locationType === "custom"}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      name="street_number"
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value)}
                      onBlur={handleGeocode}
                      placeholder="Nº"
                      className="w-full px-4 h-12 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required={locationType === "custom"}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <input
                      name="city"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      onBlur={handleGeocode}
                      placeholder="Cidade"
                      className="w-full px-4 h-12 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required={locationType === "custom"}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      name="state"
                      value={customState}
                      onChange={(e) => setCustomState(e.target.value)}
                      onBlur={handleGeocode}
                      placeholder="UF"
                      className="w-full px-4 h-12 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required={locationType === "custom"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 flex items-end gap-2">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={customLat !== null ? customLat : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomLat(val === "" ? null : Number(val));
                          }}
                          placeholder="Lat"
                          className="w-full px-4 h-12 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={customLng !== null ? customLng : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomLng(val === "" ? null : Number(val));
                          }}
                          placeholder="Lng"
                          className="w-full px-4 h-12 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!customLat || !customLng}
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${customLat},${customLng}`, '_blank')}
                      className="h-12 w-12 rounded-2xl border border-primary/20 text-primary hover:bg-primary/5 flex items-center justify-center shrink-0"
                      title="Ver no Google Maps"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">CEP</label>
                      <input
                        name="zipcode"
                        value={customZip}
                        onChange={(e) => setCustomZip(e.target.value)}
                        onBlur={handleGeocode}
                        placeholder="00000-000"
                        className="w-full px-4 h-12 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        required={locationType === "custom"}
                      />
                    </div>
                  </div>
                </div>

                {isGeocoding && (
                   <p className="text-[10px] text-primary animate-pulse flex items-center gap-2 px-1">
                     <Loader2 className="w-3 h-3 animate-spin" /> Buscando coordenadas...
                   </p>
                )}
                
                {customLat && customLng && !isGeocoding && (
                  <p className="text-[10px] text-green-600 flex items-center gap-2 px-1">
                    <CheckCircle2 className="w-3 h-3" /> Localização identificada via Google Maps
                  </p>
                )}

                <p className="text-[11px] text-muted-foreground italic px-1">
                  Nota: Informe o endereço completo para que os profissionais possam te encontrar.
                </p>
              </div>
            )}

            {!location && locationType === "current" && !geoLoading && (
              <p className="text-[11px] text-muted-foreground text-center italic">
                Recomendado: Profissionais próximos poderão encontrar sua solicitação mais facilmente.
              </p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white font-medium rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? "Publicando..." : "Publicar Solicitação"}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Ao publicar, profissionais poderão ver sua solicitação e enviar
              propostas.
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
