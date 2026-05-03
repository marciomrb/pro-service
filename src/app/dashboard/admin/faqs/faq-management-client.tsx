"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  HelpCircle,
  MoreVertical,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { upsertFAQ, deleteFAQ } from "@/app/support/actions";
import { toast } from "sonner";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

export function FAQManagementClient({ initialFaqs }: { initialFaqs: FAQ[] }) {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingFaq, setEditingFaq] = useState<Partial<FAQ>>({
    question: "",
    answer: "",
    category: "Geral",
    sort_order: 0,
  });

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase()) ||
      faq.category.toLowerCase().includes(search.toLowerCase()),
  );

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setIsOpen(true);
  };

  const handleAddNew = () => {
    setEditingFaq({
      question: "",
      answer: "",
      category: "Geral",
      sort_order:
        faqs.length > 0 ? Math.max(...faqs.map((f) => f.sort_order)) + 10 : 10,
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq.question || !editingFaq.answer) {
      toast.error("Preencha a pergunta e a resposta");
      return;
    }

    setIsSaving(true);
    try {
      await upsertFAQ(editingFaq as FAQ);
      toast.success(editingFaq.id ? "FAQ atualizado" : "FAQ criado");
      setIsOpen(false);
      // Note: revalidatePath will handle server-side update, but for instant UI:
      // In a real app we might want to refresh the page or update state
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar FAQ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta FAQ?")) return;

    setIsDeleting(id);
    try {
      await deleteFAQ(id);
      toast.success("FAQ excluída");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir FAQ");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pergunta, resposta ou categoria..."
            className="pl-10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={handleAddNew}
          className="w-full md:w-auto rounded-xl font-bold bg-primary shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar FAQ
        </Button>
      </div>

      <div className="bg-card rounded-[2rem] border border-border/50 overflow-hidden shadow-xl shadow-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Ordem
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Categoria
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Pergunta
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <tr
                    key={faq.id}
                    className="hover:bg-muted/10 transition-colors group"
                  >
                    <td className="px-6 py-5 text-sm font-bold text-muted-foreground">
                      {faq.sort_order}
                    </td>
                    <td className="px-6 py-5">
                      <Badge
                        variant="secondary"
                        className="rounded-lg font-bold"
                      >
                        {faq.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-sm text-foreground line-clamp-1">
                        {faq.question}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {faq.answer}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(faq)}
                          className="rounded-lg hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting === faq.id}
                          onClick={() => handleDelete(faq.id)}
                          className="rounded-lg hover:bg-red-500/10 hover:text-red-500"
                        >
                          {isDeleting === faq.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-muted-foreground"
                  >
                    Nenhuma FAQ encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="sm:max-w-md border-l border-border/50"
        >
          <form onSubmit={handleSave} className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle className="text-2xl font-black">
                {editingFaq.id ? "Editar FAQ" : "Nova FAQ"}
              </SheetTitle>
              <SheetDescription>
                Preencha os detalhes da pergunta frequente.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="font-bold">
                  Categoria
                </Label>
                <Input
                  id="category"
                  placeholder="Ex: Pagamentos, Perfil, Segurança"
                  value={editingFaq.category}
                  onChange={(e) =>
                    setEditingFaq({ ...editingFaq, category: e.target.value })
                  }
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question" className="font-bold">
                  Pergunta
                </Label>
                <Input
                  id="question"
                  placeholder="Como funciona o pagamento?"
                  value={editingFaq.question}
                  onChange={(e) =>
                    setEditingFaq({ ...editingFaq, question: e.target.value })
                  }
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer" className="font-bold">
                  Resposta
                </Label>
                <Textarea
                  id="answer"
                  placeholder="Explique detalhadamente..."
                  className="min-h-[150px] rounded-xl resize-none"
                  value={editingFaq.answer}
                  onChange={(e) =>
                    setEditingFaq({ ...editingFaq, answer: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order" className="font-bold">
                  Ordem de Exibição
                </Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={editingFaq.sort_order}
                  onChange={(e) =>
                    setEditingFaq({
                      ...editingFaq,
                      sort_order: parseInt(e.target.value),
                    })
                  }
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <SheetFooter className="pt-6 border-t border-border/50">
              <SheetClose
                render={
                  <Button variant="ghost" className="rounded-xl font-bold">
                    Cancelar
                  </Button>
                }
              />

              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingFaq.id ? "Salvar Alterações" : "Criar FAQ"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
