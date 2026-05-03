'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPendingVerifications() {
  const supabase = await createClient()
  
  // Fetch providers who have at least one 'pending' document
  const { data, error } = await supabase
    .from('provider_documents')
    .select(`
      provider_id,
      profiles (
        full_name,
        email
      )
    `)
    .eq('status', 'pending')
    // Grouping by provider_id is tricky in Supabase JS client without raw SQL, 
    // but we can fetch and then unique in JS.
  
  if (error) {
    console.error('Error fetching pending verifications:', error)
    return []
  }

  // Deduplicate by provider_id
  const uniqueProviders = Array.from(new Map(data.map(item => [item.provider_id, item])).values())
  
  return uniqueProviders
}

export async function getProviderDocumentsForAdmin(providerId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('provider_documents')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching provider documents:', error)
    return []
  }

  return data
}

export async function updateDocumentStatusAction(
  documentId: string, 
  providerId: string, 
  status: 'approved' | 'rejected' | 'pending', 
  rejectionReason?: string
) {
  const supabase = await createClient()
  
  const { error: updateError } = await supabase
    .from('provider_documents')
    .update({ 
      status, 
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)

  if (updateError) {
    console.error('Error updating document status:', updateError)
    return { error: updateError.message }
  }

  // Check if all documents for this provider are now approved
  // (Or at least the critical ones: RG/CNH and Proof of Address)
  const { data: allDocs } = await supabase
    .from('provider_documents')
    .select('status, document_type')
    .eq('provider_id', providerId)

  const criticalTypes = ['Documento de Identidade (RG/CNH)', 'Comprovante de Residência']
  const approvedDocs = allDocs?.filter(d => d.status === 'approved').map(d => d.document_type) || []
  
  const isNowVerified = criticalTypes.every(type => approvedDocs.includes(type))

  if (isNowVerified) {
    await supabase
      .from('provider_profiles')
      .update({ is_verified: true })
      .eq('id', providerId)
  } else {
    // If any critical document is not approved (pending or rejected), they are not verified
    await supabase
      .from('provider_profiles')
      .update({ is_verified: false })
      .eq('id', providerId)
  }

  revalidatePath(`/dashboard/admin/verification/${providerId}`)
  revalidatePath('/dashboard/admin/verification')
  revalidatePath('/explore')
  
  return { success: true }
}
