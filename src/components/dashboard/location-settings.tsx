"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Navigation,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import {
  updateProfileLocation,
  updateLocationDetails,
} from "@/actions/profile-actions";
import { toast } from "sonner";

export default function LocationSettings({ profile }: { profile: any }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeoUpdating, setIsGeoUpdating] = useState(false);
  const { location, getLocation, loading: geoLoading } = useGeolocation();

  // Determine which sub-profile to use, handling both array and object formats from Supabase
  const role = profile?.role || "client";
  const rawSubProfile =
    role === "provider" ? profile?.provider_profiles : profile?.client_profiles;
  const subProfile =
    (Array.isArray(rawSubProfile) ? rawSubProfile[0] : rawSubProfile) || {};

  const [cep, setCep] = useState(subProfile?.zipcode || "");
  const [city, setCity] = useState(subProfile?.city || "");
  const [state, setState] = useState(subProfile?.state || "");
  const [address, setAddress] = useState(subProfile?.address || "");
  const [number, setNumber] = useState(subProfile?.street_number || "");
  // Prioritize base profile coordinates over sub-profile coordinates
  const [lat, setLat] = useState(
    profile?.latitude || subProfile?.latitude || null,
  );
  const [lng, setLng] = useState(
    profile?.longitude || subProfile?.longitude || null,
  );
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Sync state if profile changes (e.g. after update or navigation)
  useEffect(() => {
    const newZip = subProfile?.zipcode || "";
    const newCity = subProfile?.city || "";
    const newState = subProfile?.state || "";
    const newAddress = subProfile?.address || "";
    const newNumber = subProfile?.street_number || "";
    const newLat = profile?.latitude || subProfile?.latitude || null;
    const newLng = profile?.longitude || subProfile?.longitude || null;

    if (newZip !== cep) setCep(newZip);
    if (newCity !== city) setCity(newCity);
    if (newState !== state) setState(newState);
    if (newAddress !== address) setAddress(newAddress);
    if (newNumber !== number) setNumber(newNumber);
    if (newLat !== lat) setLat(newLat);
    if (newLng !== lng) setLng(newLng);
  }, [
    subProfile?.zipcode,
    subProfile?.city,
    subProfile?.state,
    subProfile?.address,
    subProfile?.street_number,
    profile?.latitude,
    profile?.longitude,
    subProfile?.latitude,
    subProfile?.longitude,
  ]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCep(value);
  };

  const handleGeocode = async () => {
    if (!address || !city || !state) return;

    setIsGeocoding(true);
    try {
      const fullAddress = `${address}, ${number}, ${city}, ${state}, ${cep}, Brazil`;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`,
      );
      const data = await response.json();

      if (data.status === "OK") {
        const { lat: newLat, lng: newLng } = data.results[0].geometry.location;
        setLat(newLat);
        setLng(newLng);
        toast.success("Coordenadas atualizadas via Google Maps!");
      } else {
        console.error("Geocoding failed:", data.status);
        toast.error(
          "Não foi possível encontrar as coordenadas para este endereço.",
        );
      }
    } catch (error) {
      console.error("Error during geocoding:", error);
    } finally {
      setIsGeocoding(false);
    }
  };

  async function handleGeoAccess() {
    setIsGeoUpdating(true);
    try {
      const loc = await getLocation();
      if (loc) {
        await updateProfileLocation(loc.latitude, loc.longitude);
        toast.success("Localização GPS atualizada!");
      }
    } catch (error) {
      toast.error("Erro ao obter localização.");
    } finally {
      setIsGeoUpdating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);

    const result = await updateLocationDetails({
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zipcode: formData.get("zipcode") as string,
      address: formData.get("address") as string,
      street_number: formData.get("street_number") as string,
      latitude: lat ? Number(lat) : undefined,
      longitude: lng ? Number(lng) : undefined,
    });

    if (result.success) {
      toast.success("Endereço atualizado com sucesso!");
    } else {
      toast.error("Erro ao atualizar endereço.");
    }
    setIsUpdating(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8 rounded-[32px] border-primary/5 shadow-xl shadow-primary/[0.02] bg-card/50 backdrop-blur-xl space-y-8">
        <div>
          <h2 className="text-xl font-bold">Localização</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure sua localização para encontrar serviços próximos a você.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Navigation
                className={`w-5 h-5 text-primary ${isGeoUpdating || geoLoading ? "animate-pulse" : ""}`}
              />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                Usar minha localização atual
              </h4>
              <p className="text-xs text-muted-foreground">
                Captura suas coordenadas GPS exatas para serviços próximos.
              </p>
              {profile?.location && (
                <div className="space-y-1 mt-1">
                  <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Coordenadas salvas no
                    seu perfil
                  </p>
                  {profile.latitude !== undefined &&
                    profile.longitude !== undefined && (
                      <p className="text-[9px] text-muted-foreground font-mono">
                        LAT: {Number(profile.latitude).toFixed(6)} | LNG:{" "}
                        {Number(profile.longitude).toFixed(6)}
                      </p>
                    )}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeoAccess}
            disabled={isGeoUpdating || geoLoading}
            className="rounded-xl font-bold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all px-6 h-10 shrink-0"
          >
            {isGeoUpdating || geoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {profile?.location ? "Atualizar GPS" : "Permitir Acesso"}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="sm:col-span-3 space-y-2">
              <Label
                htmlFor="address"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                Logradouro / Endereço
              </Label>
              <Input
                id="address"
                name="address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={handleGeocode}
                placeholder="Ex: Rua das Flores"
                className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
              />
            </div>
            <div className="sm:col-span-1 space-y-2">
              <Label
                htmlFor="street_number"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                Número
              </Label>
              <Input
                id="street_number"
                name="street_number"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onBlur={handleGeocode}
                placeholder="Ex: 123"
                className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="city"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                Cidade
              </Label>
              <Input
                id="city"
                name="city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={handleGeocode}
                placeholder="Ex: São Paulo"
                className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="state"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                Estado
              </Label>
              <Input
                id="state"
                name="state"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                onBlur={handleGeocode}
                placeholder="Ex: SP"
                className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="zipcode"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                CEP
              </Label>
              <Input
                id="zipcode"
                name="zipcode"
                required
                value={cep}
                onChange={handleCepChange}
                onBlur={handleGeocode}
                placeholder="00000-000"
                className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div className="space-y-2">
                  <Label
                    htmlFor="latitude"
                    className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                  >
                    Latitude
                  </Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={lat !== null ? lat : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLat(val === "" ? null : Number(val));
                    }}
                    className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="longitude"
                    className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                  >
                    Longitude
                  </Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={lng !== null ? lng : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLng(val === "" ? null : Number(val));
                    }}
                    className="h-12 rounded-2xl bg-muted/20 border border-input focus-visible:ring-primary"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!lat || !lng}
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                    "_blank",
                  )
                }
                className="h-12 w-12 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 shrink-0"
                title="Ver no Google Maps"
              >
                <ExternalLink className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-muted">
            <Button
              type="submit"
              disabled={isUpdating}
              className="h-12 px-8 rounded-2xl font-bold bg-primary hover:bg-accent shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isUpdating ? "Salvando..." : "Atualizar Localização"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
