import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'
  const roleFromParams = searchParams.get('role') as string || 'client'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // If no profile exists, create one with the role from query params
        // Note: The database trigger handle_new_user might have already run, 
        // but it might not have the correct role for OAuth users.
        if (!profile) {
          const fullName = user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuário'
          
          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: fullName,
            role: roleFromParams,
          })
          
          // Also initialize sub-profile
          if (roleFromParams === 'provider') {
            await supabase.from('provider_profiles').upsert({ id: user.id })
            return NextResponse.redirect(`${origin}/dashboard/provider`)
          } else {
            await supabase.from('client_profiles').upsert({ id: user.id })
            return NextResponse.redirect(`${origin}/dashboard/client`)
          }
        }

        // Redirect based on existing profile role
        if (profile.role === 'provider') {
          return NextResponse.redirect(`${origin}/dashboard/provider`)
        } else if (profile.role === 'admin') {
          return NextResponse.redirect(`${origin}/dashboard/admin`)
        } else {
          return NextResponse.redirect(`${origin}/dashboard/client`)
        }
      }
    }
  }

  // Redirect to login if something went wrong
  return NextResponse.redirect(`${origin}/login?message=Erro ao processar login social`)
}
