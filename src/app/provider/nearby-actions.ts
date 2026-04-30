'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/actions/notification-actions'

export async function notifyNearbyProviders(lat: number, lng: number, bookingId: string, address: string) {
  const supabase = await createClient()

  // Use the RPC function we created earlier
  const { data: providers, error } = await supabase.rpc('find_nearby_providers', {
    request_lat: lat,
    request_lng: lng,
    radius_meters: 10000 // 10km radius
  })

  if (error) {
    console.error('Error finding nearby providers:', error)
    return
  }

  if (providers) {
    for (const provider of providers) {
      await createNotification({
        userId: provider.id,
        title: 'New Service Opportunity Nearby!',
        message: `A client near you (${address}) is looking for a professional. Check the feed for details.`
      })
    }
  }
}
