'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileLocation(lat: number, lng: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  // PostGIS point format: 'POINT(lng lat)'
  const point = `POINT(${lng} ${lat})`

  const { error } = await supabase
    .from('profiles')
    .update({ 
      location: point,
      latitude: lat,
      longitude: lng
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile location:', error)
    return
  }

  // Also update the sub-profile columns for consistency
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile) {
    const table = profile.role === 'provider' ? 'provider_profiles' : 'client_profiles'
    await supabase
      .from(table)
      .upsert({ 
        id: user.id, 
        latitude: lat, 
        longitude: lng 
      }, { onConflict: 'id' })
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
}

export async function updateLocationDetails(details: {
  city?: string
  state?: string
  zipcode?: string
  address?: string
  street_number?: string
  latitude?: number
  longitude?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  const table = profile.role === 'provider' ? 'provider_profiles' : 'client_profiles'

  const { error } = await supabase
    .from(table)
    .upsert({
      id: user.id,
      ...details
    }, { onConflict: 'id' })

  if (error) {
    console.error(`Error updating ${table}:`, error)
    return { error: error.message }
  }

  // If latitude and longitude are provided, also update the base profile's location point and columns
  if (details.latitude !== undefined && details.longitude !== undefined) {
    const point = `POINT(${details.longitude} ${details.latitude})`
    await supabase
      .from('profiles')
      .update({ 
        location: point,
        latitude: details.latitude,
        longitude: details.longitude
      })
      .eq('id', user.id)
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateProfile(formData: {
  full_name?: string
  avatar_url?: string
  bio?: string
  profession_title?: string
  hourly_rate?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Update base profile dynamically based on provided fields
  const profileData: any = {}
  if (formData.full_name !== undefined) profileData.full_name = formData.full_name
  if (formData.avatar_url !== undefined) profileData.avatar_url = formData.avatar_url

  if (Object.keys(profileData).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)

    if (profileError) return { error: `Base Profile Error: ${profileError.message}` }
  }

  // Update or Insert provider profile
  if (formData.bio !== undefined || formData.profession_title !== undefined || formData.hourly_rate !== undefined) {
    const { error: providerError } = await supabase
      .from('provider_profiles')
      .upsert({
        id: user.id,
        bio: formData.bio,
        profession_title: formData.profession_title,
        hourly_rate: formData.hourly_rate,
      }, { onConflict: 'id' })

    if (providerError) return { error: `Provider Profile Error: ${providerError.message}` }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      client_profiles(city, state, zipcode, phone, address, street_number, latitude, longitude),
      provider_profiles(city, state, zipcode, bio, profession_title, hourly_rate, address, street_number, latitude, longitude)
    `)
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function updateBillingInfo(data: { cpf_cnpj: string, phone: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('provider_profiles')
    .update({
      cpf_cnpj: data.cpf_cnpj,
      phone: data.phone
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/provider/subscription')
  return { success: true }
}
