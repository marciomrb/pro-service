"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  MapPin,
  Navigation,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createBooking } from "@/actions/booking-actions";
import { getProviderAvailability, getBlockedDates, type AvailabilitySlot, type BlockedDate } from "@/actions/availability-actions";
import { useGeolocation } from "@/hooks/use-geolocation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingForm({
  providerId,
  providerName,
}: {
  providerId: string;
  providerName: string;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);

  const {
    location,
    error: geoError,
    loading: geoLoading,
    getLocation,
  } = useGeolocation();

  useEffect(() => {
    async function loadData() {
      setIsLoadingAvailability(true);
      const [availData, blockedData] = await Promise.all([
        getProviderAvailability(providerId),
        getBlockedDates(providerId)
      ]);
      setAvailability(availData);
      setBlockedDates(blockedData);
      setIsLoadingAvailability(false);
    }
    loadData();
  }, [providerId]);

  const dayOfWeek = date?.getDay();
  const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek && a.is_active);

  const handleSubmit = async () => {
    if (!date || !selectedTime) return;
    
    setIsSubmitting(true);
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const bookingDate = new Date(date);
      bookingDate.setHours(hours, minutes, 0, 0);

      await createBooking({
        providerId,
        date: bookingDate,
        description,
        address,
        location: location
          ? { lat: location.latitude, lng: location.longitude }
          : undefined,
      });
      toast.success("Solicitação enviada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao solicitar agendamento.");
      setIsSubmitting(false);
    }
  };

  const isDateDisabled = (d: Date) => {
    if (d < new Date(new Date().setHours(0,0,0,0))) return true;
    
    // Check if date is explicitly blocked
    const dateStr = d.toISOString().split('T')[0];
    const isBlocked = blockedDates.some(bd => bd.blocked_date === dateStr);
    if (isBlocked) return true;

    const dow = d.getDay();
    const hasAvailability = availability.some(a => a.day_of_week === dow && a.is_active);
    return !hasAvailability;
  };

  return (
    <Card className="p-6 rounded-3xl border-primary/10 shadow-xl space-y-6 overflow-hidden bg-card/50 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Solicitar Serviço</h3>
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${step >= s ? "bg-primary w-4" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-primary font-bold">
              <CalendarIcon className="w-5 h-5" />
              <span>Data e Horário</span>
            </div>
            
            <div className="flex flex-col gap-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setSelectedTime(""); // Reset time when date changes
                }}
                className="rounded-2xl border border-primary/5 bg-muted/20 mx-auto"
                disabled={isDateDisabled}
              />

              {date && !isLoadingAvailability && (
                <div className="space-y-3">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Horários Disponíveis
                  </p>
                  {dayAvailability.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {dayAvailability.map((slot, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTime(slot.start_time.slice(0, 5))}
                          className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                            selectedTime === slot.start_time.slice(0, 5)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted hover:border-primary/30"
                          }`}
                        >
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      O profissional não atende neste dia.
                    </div>
                  )}
                </div>
              )}

              {isLoadingAvailability && (
                <div className="h-20 flex items-center justify-center text-muted-foreground animate-pulse text-sm">
                  Carregando horários...
                </div>
              )}
            </div>

            <Button
              className="w-full rounded-2xl h-12 text-lg font-bold shadow-lg"
              onClick={() => setStep(2)}
              disabled={!date || !selectedTime}
            >
              Continuar <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Clock className="w-5 h-5" />
              <span>Detalhes do Trabalho</span>
            </div>
            <Textarea
              placeholder="Descreva o que você precisa... (Ex: Conserto de torneira, instalação de chuveiro)"
              className="min-h-[150px] rounded-2xl bg-muted/20 border-primary/5 p-4 text-base focus:ring-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 rounded-2xl h-12 font-bold"
                onClick={() => setStep(1)}
              >
                Voltar
              </Button>
              <Button
                className="flex-2 rounded-2xl h-12 text-lg font-bold shadow-lg bg-primary hover:bg-accent"
                onClick={() => setStep(3)}
                disabled={!description.trim()}
              >
                Próximo <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-primary font-bold">
              <MapPin className="w-5 h-5" />
              <span>Local do Serviço</span>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                <Button
                  variant={location ? "secondary" : "outline"}
                  className="w-full h-12 rounded-xl font-bold gap-2"
                  onClick={getLocation}
                  disabled={geoLoading}
                >
                  {geoLoading
                    ? "Obtendo localização..."
                    : location
                      ? "Localização Adicionada"
                      : "Usar minha localização atual"}
                  <Navigation
                    className={`w-4 h-4 ${geoLoading ? "animate-pulse" : ""}`}
                  />
                </Button>
                {location && (
                  <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Coordenadas registradas com sucesso
                  </p>
                )}
                {geoError && (
                  <p className="text-xs text-destructive text-center">
                    {geoError}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou digite o endereço
                  </span>
                </div>
              </div>

              <Input
                placeholder="Ex: Av. Paulista, 1000 - SP"
                className="h-12 rounded-xl bg-muted/20 border-primary/5"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="ghost"
                className="flex-1 rounded-2xl h-12 font-bold"
                onClick={() => setStep(2)}
              >
                Voltar
              </Button>
              <Button
                className="flex-2 rounded-2xl h-12 text-lg font-bold shadow-lg bg-primary hover:bg-accent"
                onClick={handleSubmit}
                disabled={isSubmitting || (!location && !address)}
              >
                {isSubmitting ? "Solicitando..." : `Solicitar Agendamento`}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center text-muted-foreground">
        Sua solicitação será enviada para <strong>{providerName}</strong> para
        aprovação.
      </p>
    </Card>
  );
}
