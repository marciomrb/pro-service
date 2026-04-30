import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CategoriesManager from "@/components/admin/categories-manager";
import { getCategories } from "@/actions/admin-actions";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const result = await getCategories();
  const categories = result.categories || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Categorias e Subcategorias</h1>
        <p className="text-muted-foreground mt-1">
          Adicione, edite ou exclua categorias para organizar os serviços oferecidos.
        </p>
      </div>

      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
