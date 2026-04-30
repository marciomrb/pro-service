"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Trash2, Loader2, Info } from "lucide-react";
import { addCategory, editCategory, deleteCategory } from "@/actions/admin-actions";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
};

export default function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  // For the form
  const [formData, setFormData] = useState({ name: "", icon: "", parent_id: "" });

  const resetForm = () => {
    setFormData({ name: "", icon: "", parent_id: "" });
    setEditingId(null);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("icon", formData.icon);
    data.append("parent_id", formData.parent_id);

    startTransition(async () => {
      let result;
      if (editingId) {
        result = await editCategory(editingId, data);
      } else {
        result = await addCategory(data);
      }

      if (result.error) {
        setStatus({ type: "error", message: result.error });
      } else {
        setStatus({ type: "success", message: editingId ? "Categoria atualizada!" : "Categoria criada!" });
        // Instead of hard reloading, NextJS server actions revalidatePath handles refreshing data on the next page load, 
        // but since we passed initialCategories we can force a window reload or just let RSC handle it if wrapped properly.
        // For simple UI refresh:
        window.location.reload(); 
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) {
        setStatus({ type: "error", message: result.error });
      } else {
        setStatus({ type: "success", message: "Categoria excluída com sucesso!" });
        window.location.reload();
      }
    });
  };

  const mainCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="space-y-8">
      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          status.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
        }`}>
          <Info className="w-5 h-5 flex-shrink-0" />
          <p>{status.message}</p>
        </div>
      )}

      <Card className="p-6 rounded-3xl border-border/50 shadow-sm">
        <h2 className="text-xl font-bold mb-4">{editingId ? "Editar Categoria" : "Nova Categoria"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Reforma"
                className="bg-muted/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone (Opcional)</Label>
              <Input 
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Ex: Wrench"
                className="bg-muted/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria Pai (Opcional - para Subcategorias)</Label>
              <select 
                value={formData.parent_id}
                onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                className="w-full h-10 px-3 py-2 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Nenhuma (Categoria Principal)</option>
                {mainCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isPending} className="rounded-xl flex gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Salvar Alterações" : "Adicionar Categoria"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Categorias Cadastradas</h2>
        {mainCategories.length === 0 && <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainCategories.map(category => (
            <Card key={category.id} className="p-4 rounded-2xl border-border/50 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {category.icon ? category.icon.charAt(0) : category.name.charAt(0)}
                  </div>
                  <h3 className="font-bold">{category.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => {
                    setEditingId(category.id);
                    setFormData({ name: category.name, icon: category.icon || "", parent_id: "" });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(category.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Subcategories */}
              <div className="space-y-2 mt-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subcategorias</p>
                <div className="flex flex-col gap-2">
                  {categories.filter(c => c.parent_id === category.id).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between bg-muted/30 p-2 rounded-lg text-sm">
                      <span>{sub.name}</span>
                      <div className="flex gap-1">
                        <button onClick={() => {
                          setEditingId(sub.id);
                          setFormData({ name: sub.name, icon: sub.icon || "", parent_id: sub.parent_id || "" });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }} className="p-1 text-muted-foreground hover:text-primary">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.filter(c => c.parent_id === category.id).length === 0 && (
                    <span className="text-sm text-muted-foreground">Nenhuma subcategoria</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
