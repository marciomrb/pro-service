import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ShieldCheck, User, Wrench } from "lucide-react";
import {
  updateUserRole as _updateUserRole,
  deleteUser as _deleteUser,
} from "@/actions/admin-actions";
import { DeleteUserButton } from "@/components/admin/delete-user-button";

import { unstable_noStore as noStore } from "next/cache";

async function updateRole(
  userId: string,
  role: "client" | "provider" | "admin",
): Promise<void> {
  "use server";
  await _updateUserRole(userId, role);
}

export default async function AdminUsersPage() {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, created_at")
    .order("created_at", { ascending: false });

  const roleLabels: Record<string, string> = {
    client: "Cliente",
    provider: "Prestador",
    admin: "Admin",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    provider:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    client:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  };

  const roleBarColors: Record<string, string> = {
    admin: "bg-red-500",
    provider: "bg-blue-500",
    client: "bg-green-500",
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Gerenciar Usuários
        </h1>
        <p className="text-muted-foreground mt-1">
          Lista de todos os usuários registrados — {users?.length || 0}{" "}
          usuário(s) encontrado(s).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map((u: any) => (
          <Card
            key={u.id}
            className="p-6 rounded-3xl border-border/50 shadow-sm flex flex-col gap-4 relative overflow-hidden"
          >
              {/* Role color bar */}
              <div
                className={`absolute top-0 left-0 w-full h-1 ${roleBarColors[u.role] || "bg-gray-400"}`}
              />

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 relative shrink-0">
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt={u.full_name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-primary text-lg">
                      {u.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <h3
                    className="font-bold text-lg leading-tight truncate"
                    title={u.full_name}
                  >
                    {u.full_name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {u.email}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                      roleColors[u.role] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {roleLabels[u.role] || u.role?.toUpperCase() || "CLIENT"}
                  </span>
                </div>
              </div>

              {/* Change role actions */}
              <div className="flex flex-wrap gap-1.5">
                {(["client", "provider", "admin"] as const).map((r) => (
                  <form key={r} action={updateRole.bind(null, u.id, r)}>
                    <button
                      type="submit"
                      disabled={u.role === r}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-default ${
                        u.role === r
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted hover:bg-primary/10 hover:text-primary text-foreground"
                      }`}
                    >
                      {r === "client" && (
                        <User className="w-3 h-3 inline mr-1" />
                      )}
                      {r === "provider" && (
                        <Wrench className="w-3 h-3 inline mr-1" />
                      )}
                      {r === "admin" && (
                        <ShieldCheck className="w-3 h-3 inline mr-1" />
                      )}
                      {roleLabels[r]}
                    </button>
                  </form>
                ))}
              </div>

              {/* Delete action */}
              <div className="mt-auto pt-4 border-t border-border/50">
                {u.id !== user.id ? (
                  <DeleteUserButton userId={u.id} userName={u.full_name} />
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-1">
                    Sua própria conta
                  </p>
                )}
              </div>
            </Card>
        ))}

        {(!users || users.length === 0) && (
          <div className="col-span-full py-12 flex flex-col items-center text-center text-muted-foreground bg-muted/20 rounded-3xl">
            <p>Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
