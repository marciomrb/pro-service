'use client'

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { format } from "date-fns"

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  category: string
  created_at: string
  profiles?: {
    full_name: string
    email: string
  }
}

export function ExportTicketsButton({ tickets }: { tickets: any[] }) {
  const exportToCSV = () => {
    if (!tickets || tickets.length === 0) return

    const headers = ["ID", "Usuario", "Email", "Assunto", "Categoria", "Status", "Prioridade", "Data Criacao"]
    const rows = tickets.map(t => [
      t.id,
      t.profiles?.full_name || "N/A",
      t.profiles?.email || "N/A",
      t.subject,
      t.category,
      t.status,
      t.priority,
      format(new Date(t.created_at), "yyyy-MM-dd HH:mm:ss")
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `tickets-suporte-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button 
      onClick={exportToCSV}
      className="rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20"
    >
      <Download className="w-4 h-4 mr-2" /> Exportar Relatório
    </Button>
  )
}
