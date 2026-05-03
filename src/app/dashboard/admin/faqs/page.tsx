import { createClient } from '@/lib/supabase/server'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  HelpCircle,
  Plus,
  Search,
  MoreVertical,
  ChevronRight,
  Trash2,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { FAQManagementClient } from './faq-management-client'

export default async function AdminFAQsPage() {
  const supabase = await createClient()
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'admin') {
    return <div className="p-10 text-center">Acesso negado.</div>
  }

  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">Gestão de FAQs</h1>
          <p className="text-muted-foreground font-medium">Gerencie as perguntas frequentes da plataforma</p>
        </div>
      </div>

      <FAQManagementClient initialFaqs={faqs || []} />
    </div>
  )
}
