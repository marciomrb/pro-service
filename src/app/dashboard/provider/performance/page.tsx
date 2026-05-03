import { createClient } from '@/lib/supabase/server'
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import PerformanceClient from "./performance-client"

export default async function PerformancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch provider profile
  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('hourly_rate')
    .eq('id', user.id)
    .single()

  // Fetch all views for this provider
  const { data: views } = await supabase
    .from('profile_views')
    .select('created_at')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: true })

  // Fetch all bookings for this provider
  const { data: bookings } = await supabase
    .from('bookings')
    .select('status, created_at')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: true })

  const hourlyRate = Number(profile?.hourly_rate || 0)

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/dashboard/provider">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance e Métricas</h1>
          <p className="text-muted-foreground">Acompanhe o crescimento do seu negócio em detalhes.</p>
        </div>
      </div>

      <PerformanceClient 
        views={views || []} 
        bookings={bookings || []} 
        hourlyRate={hourlyRate}
      />
    </div>
  )
}
