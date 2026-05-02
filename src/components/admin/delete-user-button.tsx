'use client'

import { Trash2 } from "lucide-react";
import { deleteUser } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja remover ${userName}? Esta ação não pode ser desfeita.`)) {
      const result = await deleteUser(userId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuário removido com sucesso!");
      }
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleDelete}
      className="w-full flex justify-center items-center gap-2 px-4 py-2 text-destructive bg-destructive/10 hover:bg-destructive/20 font-medium rounded-xl text-sm transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      Remover Usuário
    </Button>
  );
}
