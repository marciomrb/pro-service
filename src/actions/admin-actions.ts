"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return { error: error.message };
  }
  return { categories: data };
}

export async function addCategory(formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get("name") as string;
  const icon = formData.get("icon") as string;
  const parent_id = formData.get("parent_id") as string;

  const { error } = await supabase.from("categories").insert({
    name,
    icon: icon || null,
    parent_id: parent_id || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/categories");
  return { success: true };
}

export async function editCategory(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get("name") as string;
  const icon = formData.get("icon") as string;
  const parent_id = formData.get("parent_id") as string;

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      icon: icon || null,
      parent_id: parent_id || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/categories");
  return { success: true };
}

export async function updateUserRole(userId: string, role: 'client' | 'provider' | 'admin') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Não autenticado' };

  const { data: requester } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (requester?.role !== 'admin') return { error: 'Sem permissão' };

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Não autenticado' };

  const { data: requester } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (requester?.role !== 'admin') return { error: 'Sem permissão' };

  // Proteção: admin não pode deletar a si mesmo
  if (userId === user.id) return { error: 'Você não pode deletar sua própria conta.' };

  // Usar o cliente admin para deletar da AUTH.USERS
  // Isso vai disparar o CASCADE para deletar o PROFILE automaticamente
  const adminSupabase = await createAdminClient();
  const { error } = await adminSupabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Erro ao deletar usuário:", error);
    return { error: `Erro ao remover usuário da autenticação: ${error.message}` };
  }

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function getCouponRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupon_requests")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { requests: data };
}

export async function updateCouponRequest(
  requestId: string, 
  status: 'APPROVED' | 'REJECTED', 
  percentage?: number, 
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Não autenticado' };

  const { data: requester } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (requester?.role !== 'admin') return { error: 'Sem permissão' };

  // Inicia transação manual (simulada via server actions sequenciais)
  const { data: request, error: fetchError } = await supabase
    .from('coupon_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) return { error: 'Solicitação não encontrada' };

  const { error: updateError } = await supabase
    .from('coupon_requests')
    .update({ 
      status, 
      approved_percentage: percentage,
      admin_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (updateError) return { error: updateError.message };

  // Se aprovado, cria o cupom na tabela coupons
  if (status === 'APPROVED' && percentage) {
    const { error: couponError } = await supabase
      .from('coupons')
      .insert({
        code: request.requested_code,
        discount_percentage: percentage,
        max_uses: 1, // Geralmente cupons de solicitação são para uso único do próprio prestador
        is_active: true,
        restricted_to_provider_id: request.provider_id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias de validade
      });

    if (couponError) {
      console.error("Erro ao criar cupom após aprovação:", couponError);
      // Notar que a solicitação foi marcada como aprovada, mas o cupom falhou. 
      // Em um sistema real, usaríamos uma transação ou função RPC.
    }
  }

  revalidatePath('/dashboard/admin/coupons');
  return { success: true };
}
