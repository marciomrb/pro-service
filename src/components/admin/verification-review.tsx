"use client";

import { useState } from "react";
import { updateDocumentStatusAction } from "@/actions/admin-verification-actions";
import { getDocumentUrl } from "@/actions/verification-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  AlertCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VerificationReviewProps {
  documents: any[];
  providerId: string;
}

export function VerificationReview({
  documents,
  providerId,
}: VerificationReviewProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{
    [key: string]: string;
  }>({});
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  const handleStatusUpdate = async (
    docId: string,
    status: "approved" | "rejected" | "pending",
  ) => {
    if (status === "rejected" && !rejectionReason[docId]) {
      toast.error("Por favor, informe o motivo da rejeição.");
      return;
    }

    setLoading(docId);
    try {
      const result = await updateDocumentStatusAction(
        docId,
        providerId,
        status,
        status === "rejected" ? rejectionReason[docId] : undefined,
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          status === "approved"
            ? "Documento aprovado!"
            : "Documento rejeitado.",
        );
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao atualizar o status.");
    } finally {
      setLoading(null);
    }
  };

  const handleViewFile = async (path: string) => {
    const url = await getDocumentUrl(path);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Erro ao gerar link de visualização.");
    }
  };

  return (
    <div className="grid gap-6">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className="p-6 rounded-3xl border-border/50 shadow-sm overflow-hidden flex flex-col md:flex-row gap-6"
        >
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">{doc.document_type}</h3>
                  <p className="text-xs text-muted-foreground">
                    Enviado em{" "}
                    {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  doc.status === "approved"
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : doc.status === "rejected"
                      ? "bg-red-500/10 text-red-600 border-red-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                }`}
              >
                {doc.status === "approved"
                  ? "Aprovado"
                  : doc.status === "rejected"
                    ? "Rejeitado"
                    : "Pendente"}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-2xl gap-2 h-12 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => handleViewFile(doc.document_url)}
            >
              <Eye className="w-4 h-4" />
              Visualizar Documento
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </Button>

            {doc.status === "rejected" && doc.rejection_reason && (
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex gap-3 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Motivo da rejeição:</strong> {doc.rejection_reason}
                </p>
              </div>
            )}
          </div>

          <div className="w-full md:w-72 space-y-4 border-t md:border-t-0 md:border-l border-border/50 pt-6 md:pt-0 md:pl-6">
            {doc.status === "pending" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">
                    Motivo (se rejeitar)
                  </label>
                  <Input
                    placeholder="Ex: Documento ilegível..."
                    className="rounded-xl h-10"
                    value={rejectionReason[doc.id] || ""}
                    onChange={(e) =>
                      setRejectionReason({
                        ...rejectionReason,
                        [doc.id]: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={loading === doc.id}
                    onClick={() => handleStatusUpdate(doc.id, "rejected")}
                  >
                    {loading === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Rejeitar
                  </Button>
                  <Button
                    className="rounded-xl bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading === doc.id}
                    onClick={() => handleStatusUpdate(doc.id, "approved")}
                  >
                    {loading === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Aprovar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Ação concluída
                </p>

                <AnimatePresence mode="wait">
                  {confirmReset === doc.id ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-2"
                    >
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                        Tem certeza?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg text-[10px] font-bold"
                          onClick={() => setConfirmReset(null)}
                        >
                          Não
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 rounded-lg text-[10px] font-bold px-3"
                          onClick={() => {
                            handleStatusUpdate(doc.id, "pending");
                            setConfirmReset(null);
                          }}
                        >
                          Sim, resetar
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <Button
                      variant="link"
                      className="text-xs text-primary font-bold hover:no-underline hover:text-accent transition-colors"
                      onClick={() => setConfirmReset(doc.id)}
                      disabled={loading === doc.id}
                    >
                      Alterar decisão
                    </Button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
