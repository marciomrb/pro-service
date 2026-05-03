"use client";

import { useState } from "react";
import {
  saveAvailabilityAction,
  type AvailabilitySlot,
} from "@/actions/availability-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Copy, Save, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

interface AvailabilityEditorProps {
  initialAvailability: any[];
}

export function AvailabilityEditor({
  initialAvailability,
}: AvailabilityEditorProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(
    initialAvailability.length > 0 ? initialAvailability : [],
  );
  const [loading, setLoading] = useState(false);

  const addSlot = (dayIndex: number) => {
    const newSlot: AvailabilitySlot = {
      day_of_week: dayIndex,
      start_time: "09:00",
      end_time: "18:00",
      is_active: true,
    };
    setSlots([...slots, newSlot]);
  };

  const removeSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    setSlots(newSlots);
  };

  const updateSlot = (
    index: number,
    field: keyof AvailabilitySlot,
    value: any,
  ) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const copyToOtherDays = (fromDayIndex: number) => {
    const daySlots = slots.filter((s) => s.day_of_week === fromDayIndex);
    if (daySlots.length === 0)
      return toast.error("Não há horários para copiar.");

    const otherDays = [1, 2, 3, 4, 5]; // Default to work days
    const newSlots = slots.filter(
      (s) =>
        !otherDays.includes(s.day_of_week) || s.day_of_week === fromDayIndex,
    );

    otherDays.forEach((day) => {
      if (day !== fromDayIndex) {
        daySlots.forEach((slot) => {
          newSlots.push({ ...slot, day_of_week: day });
        });
      }
    });

    setSlots(
      newSlots.sort(
        (a, b) =>
          a.day_of_week - b.day_of_week ||
          a.start_time.localeCompare(b.start_time),
      ),
    );
    toast.success("Horários copiados para os dias úteis!");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await saveAvailabilityAction(slots);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Agenda salva com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao salvar agenda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid gap-6">
        {DAYS.map((day, dayIndex) => {
          const daySlots = slots.filter((s) => s.day_of_week === dayIndex);
          const isWeekend = dayIndex === 0 || dayIndex === 6;

          return (
            <Card
              key={day}
              className={`p-6 rounded-3xl border-border/50 shadow-sm transition-all ${isWeekend ? "bg-muted/30" : "bg-card"}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${daySlots.length > 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {day[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{day}</h3>
                    <p className="text-sm text-muted-foreground">
                      {daySlots.length === 0
                        ? "Indisponível"
                        : `${daySlots.length} horário(s) definido(s)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {daySlots.length > 0 && dayIndex === 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToOtherDays(dayIndex)}
                      className="rounded-full gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar p/ dias úteis
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(dayIndex)}
                    className="rounded-full gap-2 hover:bg-primary hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <AnimatePresence>
                  {daySlots.map((slot, i) => {
                    const originalIndex = slots.findIndex((s) => s === slot);
                    return (
                      <motion.div
                        key={originalIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50"
                      >
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={slot.start_time.slice(0, 5)}
                            onChange={(e) =>
                              updateSlot(
                                originalIndex,
                                "start_time",
                                e.target.value,
                              )
                            }
                            className="bg-transparent border-none focus-visible:ring-0 w-24 h-8 p-0 text-sm font-bold"
                          />
                          <span className="text-muted-foreground text-xs">
                            até
                          </span>
                          <Input
                            type="time"
                            value={slot.end_time.slice(0, 5)}
                            onChange={(e) =>
                              updateSlot(
                                originalIndex,
                                "end_time",
                                e.target.value,
                              )
                            }
                            className="bg-transparent border-none focus-visible:ring-0 w-24 h-8 p-0 text-sm font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              Ativo
                            </span>
                            <Switch
                              checked={slot.is_active}
                              onCheckedChange={(checked) =>
                                updateSlot(originalIndex, "is_active", checked)
                              }
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSlot(originalIndex)}
                            className="text-muted-foreground hover:text-destructive rounded-full h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {daySlots.length === 0 && (
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-muted/20 border border-dashed text-muted-foreground text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Nenhum horário de atendimento definido para este dia.
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-8 z-30 flex justify-center">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="h-14 px-12 rounded-2xl bg-primary hover:bg-accent text-white font-bold text-lg shadow-2xl shadow-primary/30 gap-3 group"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Salvar Agenda de Trabalho
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
