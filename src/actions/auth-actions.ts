'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?message=Erro na autenticação: Credenciais inválidas')
  }

  // Fetch user role to redirect correctly
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  revalidatePath('/', 'layout')
  
  if (profile?.role === 'provider') {
    redirect('/dashboard/provider')
  } else if (profile?.role === 'admin') {
    redirect('/dashboard/admin')
  } else {
    redirect('/dashboard/client')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string || 'client'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  })

  if (error) {
    redirect('/register?message=Erro ao criar conta: ' + error.message)
  }

  // If we have a session (auto-login enabled in Supabase)
  if (data.session) {
    // Create base profile if it doesn't exist (extra safety)
    await supabase.from('profiles').upsert({
      id: data.user!.id,
      full_name: fullName,
      role: role,
    }, { onConflict: 'id' })

    // Initialize sub-profile
    if (role === 'provider') {
      await supabase.from('provider_profiles').upsert({ id: data.user!.id }, { onConflict: 'id' })
    } else {
      await supabase.from('client_profiles').upsert({ id: data.user!.id }, { onConflict: 'id' })
    }

    revalidatePath('/', 'layout')
    
    // Redirect based on role
    if (role === 'provider') {
      redirect('/dashboard/provider')
    } else {
      redirect('/dashboard/client')
    }
  } else {
    // If email confirmation is required
    redirect(`/auth/confirm-email?email=${encodeURIComponent(email)}`)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithGoogle(formData?: FormData) {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')
  
  // Get role from formData if available
  const role = formData?.get('role') as string || 'client'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?role=${role}`,
    },
  })

  if (error) {
    redirect('/login?message=Erro ao entrar com Google: ' + error.message)
  }

  if (data.url) {
    redirect(data.url)
  }
}
