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
} from "lucide-react";
import { createBooking } from "@/actions/booking-actions";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function BookingForm({
  providerId,
  providerName,
}: {
  providerId: string;
  providerName: string;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    location,
    error: geoError,
    loading: geoLoading,
    getLocation,
  } = useGeolocation();

  const handleSubmit = async () => {
    if (!date) return;
    setIsSubmitting(true);
    try {
      await createBooking({
        providerId,
        date,
        description,
        address,
        location: location
          ? { lat: location.latitude, lng: location.longitude }
          : undefined,
      });
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 rounded-3xl border-primary/10 shadow-xl space-y-6 overflow-hidden bg-card/50 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Book a Service</h3>
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
              <span>Select Date</span>
            </div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-2xl border border-primary/5 bg-muted/20"
              disabled={(date) => date < new Date()}
            />
            <Button
              className="w-full rounded-2xl h-12 text-lg font-bold shadow-lg"
              onClick={() => setStep(2)}
              disabled={!date}
            >
              Continue <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Clock className="w-5 h-5" />
              <span>Job Details</span>
            </div>
            <Textarea
              placeholder="Tell the professional what you need..."
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
                Back
              </Button>
              <Button
                className="flex-[2] rounded-2xl h-12 text-lg font-bold shadow-lg bg-primary hover:bg-accent"
                onClick={() => setStep(3)}
                disabled={!description.trim()}
              >
                Next <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-primary font-bold">
              <MapPin className="w-5 h-5" />
              <span>Service Location</span>
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
                    ? "Getting Location..."
                    : location
                      ? "Current Location Added"
                      : "Use Current Location"}
                  <Navigation
                    className={`w-4 h-4 ${geoLoading ? "animate-pulse" : ""}`}
                  />
                </Button>
                {location && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    Coordinates: {location.latitude.toFixed(4)},{" "}
                    {location.longitude.toFixed(4)}
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
                    Or add address
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
                Back
              </Button>
              <Button
                className="flex-[2] rounded-2xl h-12 text-lg font-bold shadow-lg bg-primary hover:bg-accent"
                onClick={handleSubmit}
                disabled={isSubmitting || (!location && !address)}
              >
                {isSubmitting ? "Booking..." : `Book ${providerName}`}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center text-muted-foreground">
        Your request will be sent to <strong>{providerName}</strong> for
        approval.
      </p>
    </Card>
  );
}
