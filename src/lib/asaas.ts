import fs from "fs";
import path from "path";

export type AsaasCustomer = {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
};

export type AsaasSubscription = {
  customer: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
  value: number;
  nextDueDate: string;
  cycle: "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "ANNUALLY";
  description?: string;
  externalReference?: string;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: "FIXED" | "PERCENTAGE";
  };
};

class AsaasService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    let apiKey = process.env.ASAAS_API_KEY;
    let apiUrl =
      process.env.ASAAS_API_URL || "https://api-sandbox.asaas.com/v3";

    // Fallback manual se o Next.js falhar em carregar o env (comum em alguns ambientes Windows/OneDrive)
    if (!apiKey) {
      try {
        const envPath = path.join(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, "utf8");
          const lines = envContent.split("\n");
          for (const line of lines) {
            if (line.startsWith("ASAAS_API_KEY=")) {
              apiKey = line.split("=")[1].replace(/['"]/g, "").trim();
            }
            if (line.startsWith("ASAAS_API_URL=")) {
              apiUrl = line.split("=")[1].replace(/['"]/g, "").trim();
            }
          }
        }
      } catch (e) {
        console.error("Erro ao ler .env manualmente:", e);
      }
    }

    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey || "",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Asaas API Error:", data);
      throw new Error(
        data.errors?.[0]?.description || "Erro na integração com Asaas",
      );
    }

    return data;
  }

  // Clientes
  async createCustomer(customer: AsaasCustomer) {
    return this.request<{ id: string }>("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    });
  }

  // Assinaturas
  async createSubscription(subscription: AsaasSubscription) {
    return this.request<{ id: string; status: string }>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  }

  async getSubscription(id: string) {
    return this.request<any>(`/subscriptions/${id}`);
  }

  async cancelSubscription(id: string) {
    return this.request<any>(`/subscriptions/${id}`, {
      method: "DELETE",
    });
  }

  // Webhooks (Para validação básica se necessário)
  async listWebhooks() {
    return this.request<any>("/webhook");
  }
}

export const asaas = new AsaasService();
