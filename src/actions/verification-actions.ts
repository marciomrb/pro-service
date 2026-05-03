'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadDocumentAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado' }

  const file = formData.get('file') as File
  const documentType = formData.get('type') as string

  if (!file || !documentType) {
    return { error: 'Arquivo e tipo de documento são obrigatórios' }
  }

  // Upload to storage: folder per user
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${documentType.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('provider-documents')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: `Erro no upload: ${uploadError.message}` }
  }

  // Save to database
  const { error: dbError } = await supabase
    .from('provider_documents')
    .insert({
      provider_id: user.id,
      document_type: documentType,
      document_url: fileName,
      status: 'pending'
    })

  if (dbError) {
    console.error('DB error:', dbError)
    // Cleanup storage on DB failure
    await supabase.storage.from('provider-documents').remove([fileName])
    return { error: `Erro no banco de dados: ${dbError.message}` }
  }

  revalidatePath('/dashboard/provider/verification')
  return { success: true }
}

export async function getProviderDocuments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('provider_documents')
    .select('*')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }

  return data || []
}

export async function getDocumentUrl(path: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.storage
    .from('provider-documents')
    .createSignedUrl(path, 60 * 60) // 1 hour

  if (error) {
    console.error('Error creating signed URL:', error)
    return null
  }

  return data.signedUrl
}

export async function deleteDocumentAction(documentId: string, filePath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Check ownership
  const { data: doc, error: fetchError } = await supabase
    .from('provider_documents')
    .select('provider_id, status')
    .eq('id', documentId)
    .single()

  if (fetchError || !doc) return { error: 'Documento não encontrado' }
  if (doc.provider_id !== user.id) return { error: 'Acesso negado' }
  if (doc.status === 'approved') return { error: 'Não é possível remover um documento já aprovado' }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('provider-documents')
    .remove([filePath])

  if (storageError) {
    console.error('Storage delete error:', storageError)
    // Continue even if storage delete fails, or return error?
  }

  // Delete from DB
  const { error: dbError } = await supabase
    .from('provider_documents')
    .delete()
    .eq('id', documentId)

  if (dbError) {
    console.error('DB delete error:', dbError)
    return { error: `Erro ao deletar no banco: ${dbError.message}` }
  }

  revalidatePath('/dashboard/provider/verification')
  return { success: true }
}
