import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Briefcase, User } from "lucide-react";
import { signup } from "@/actions/auth-actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastrar | ProService",
  other: {
    "disable-extension-feature": "read-dom",
  },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side info */}
        <div className="space-y-6 hidden md:block">
          <Link href="/" className="flex items-center mb-8">
            <img src="/logo_full.webp" alt="ProService" className="h-10 w-auto" />
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Crie sua conta
          </h1>
          <p className="text-lg text-muted-foreground">
            Junte-se à melhor plataforma para conectar clientes com
            profissionais avaliados.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Para Clientes</h3>
                <p className="text-sm text-muted-foreground">
                  Encontre profissionais de confiança para seus projetos com
                  rapidez e segurança.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  Para Profissionais
                </h3>
                <p className="text-sm text-muted-foreground">
                  Mostre seu trabalho, seja contratado e expanda seu negócio.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side form */}
        <Card className="p-6 sm:p-8 rounded-3xl shadow-xl border-primary/10 w-full max-w-md mx-auto">
          <div className="md:hidden mb-8 text-center">
            <Link href="/" className="flex items-center justify-center">
              <img src="/logo_full.webp" alt="ProService" className="h-8 w-auto" />
            </Link>
          </div>

          {message && (
            <div className="mb-4 p-4 text-sm text-destructive bg-destructive/10 rounded-xl">
              {message}
            </div>
          )}

          <form action={signup} className="space-y-5">
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none"
                htmlFor="fullName"
              >
                Nome Completo
              </label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="João Silva"
                required
                className="h-12 rounded-xl focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none"
                htmlFor="email"
              >
                E-mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nome@exemplo.com"
                required
                className="h-12 rounded-xl focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none"
                htmlFor="password"
              >
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-12 rounded-xl focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium leading-none">
                Estou me cadastrando como:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="client"
                    className="peer sr-only"
                    defaultChecked
                  />
                  <div className="rounded-xl border-2 border-muted bg-transparent p-4 text-center hover:bg-muted peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-colors">
                    Cliente
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="provider"
                    className="peer sr-only"
                  />
                  <div className="rounded-xl border-2 border-muted bg-transparent p-4 text-center hover:bg-muted peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-colors">
                    Profissional
                  </div>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-accent text-base font-bold shadow-md transition-colors mt-6"
            >
              Criar Conta
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-accent transition-colors"
            >
              Entrar
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
