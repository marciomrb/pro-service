'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ShieldCheck, 
  Upload, 
  Clock, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Eye,
  Info
} from "lucide-react"
import { uploadDocumentAction, getProviderDocuments, getDocumentUrl, deleteDocumentAction } from "@/actions/verification-actions"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

const DOCUMENT_TYPES = [
  { id: 'identity', label: 'Documento de Identidade (RG/CNH)', description: 'Frente e verso nítidos' },
  { id: 'residence', label: 'Comprovante de Residência', description: 'Contas de luz, água ou telefone dos últimos 3 meses' },
  { id: 'professional', label: 'Certificado Profissional', description: 'Diplomas, certificados de cursos ou MEI' },
]

export default function VerificationPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState(DOCUMENT_TYPES[0].label)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setLoading(true)
    const docs = await getProviderDocuments()
    setDocuments(docs)
    setLoading(false)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return toast.error("Selecione um arquivo primeiro")

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', selectedType)

    const result = await uploadDocumentAction(formData)
    setUploading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Documento enviado para análise!")
      setFile(null)
      loadDocuments()
    }
  }

  const handleView = async (path: string) => {
    const url = await getDocumentUrl(path)
    if (url) window.open(url, '_blank')
    else toast.error("Não foi possível carregar o documento")
  }

  const handleDelete = async (id: string, path: string) => {
    if (!confirm("Tem certeza que deseja remover este documento?")) return
    
    const result = await deleteDocumentAction(id, path)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Documento removido")
      loadDocuments()
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved': return { color: 'text-green-500', icon: CheckCircle2, label: 'Aprovado', bg: 'bg-green-50' }
      case 'rejected': return { color: 'text-red-500', icon: XCircle, label: 'Rejeitado', bg: 'bg-red-50' }
      default: return { color: 'text-yellow-500', icon: Clock, label: 'Pendente', bg: 'bg-yellow-50' }
    }
  }

  const isVerified = documents.some(d => d.status === 'approved') && documents.length >= 2

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verificação Profissional</h1>
          <p className="text-muted-foreground mt-1">Aumente sua credibilidade enviando seus documentos para análise.</p>
        </div>
        {isVerified ? (
          <Badge className="bg-green-500 text-white px-4 py-1.5 rounded-full flex gap-2 animate-in fade-in zoom-in">
            <ShieldCheck className="w-4 h-4" /> Perfil Verificado
          </Badge>
        ) : (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 px-4 py-1.5 rounded-full flex gap-2">
            <Clock className="w-4 h-4" /> Verificação em Andamento
          </Badge>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <Card className="lg:col-span-2 p-6 rounded-3xl border-2 border-primary/5 shadow-xl shadow-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck className="w-32 h-32 text-primary" />
          </div>

          <form onSubmit={handleUpload} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <label className="text-sm font-bold block uppercase tracking-wider text-muted-foreground">1. Tipo de Documento</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DOCUMENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.label)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                      selectedType === type.label 
                      ? 'border-primary bg-primary/5 shadow-inner' 
                      : 'border-muted hover:border-primary/20 bg-card'
                    }`}
                  >
                    <p className={`font-bold text-sm ${selectedType === type.label ? 'text-primary' : ''}`}>{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold block uppercase tracking-wider text-muted-foreground">2. Upload do Arquivo</label>
              <div className={`relative group transition-all duration-300 ${file ? 'border-primary/50 bg-primary/5' : 'border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'} rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden`}>
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  accept="image/*,application/pdf"
                />
                
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                  {file ? <CheckCircle2 className="w-8 h-8 text-primary" /> : <Upload className="w-8 h-8 text-primary" />}
                </div>

                <div className="text-center">
                  <p className="font-bold">{file ? file.name : "Clique ou arraste o arquivo"}</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou PDF (Máx. 5MB)</p>
                </div>

                {file && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 right-4 z-30"
                  >
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-destructive hover:bg-destructive/10 rounded-full h-8 px-3">
                      Remover
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={uploading || !file} 
              className="w-full h-14 rounded-2xl bg-primary hover:bg-accent text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                "Enviar Documento"
              )}
            </Button>

            <div className="flex items-start gap-2 p-4 bg-muted/30 rounded-2xl border">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nossa equipe analisará seus documentos em até 48 horas úteis. Seus dados estão seguros e serão usados apenas para fins de verificação da plataforma.
              </p>
            </div>
          </form>
        </Card>

        {/* Requirements & Info */}
        <aside className="space-y-6">
          <Card className="p-6 rounded-3xl border-primary/10 bg-gradient-to-br from-primary/10 to-transparent">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-primary" /> Por que verificar?
            </h3>
            <ul className="space-y-3">
              {[
                "Selo de verificado no seu perfil",
                "Maior destaque nos resultados de busca",
                "Aumento na taxa de conversão em 45%",
                "Acesso a solicitações premium",
                "Segurança para você e seus clientes"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 rounded-3xl border-dashed border-2 bg-muted/10">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" /> Dicas de Upload
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Certifique-se de que a iluminação esteja boa.</p>
              <p>• Evite reflexos ou partes cortadas do documento.</p>
              <p>• Se for PDF, garanta que não esteja protegido por senha.</p>
            </div>
          </Card>
        </aside>
      </div>

      {/* History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Histórico de Documentos</h2>
          <Badge variant="outline">{documents.length} documentos</Badge>
        </div>

        <Card className="rounded-3xl border-2 border-primary/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Documento</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Envio</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                        <div className="flex flex-col items-center gap-2 animate-pulse">
                          <FileText className="w-8 h-8 opacity-20" />
                          Carregando histórico...
                        </div>
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                        Nenhum documento enviado ainda.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc, idx) => {
                      const { color, icon: StatusIcon, label, bg } = getStatusInfo(doc.status)
                      return (
                        <motion.tr 
                          key={doc.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-muted/20 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                                <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{doc.document_type}</p>
                                <p className="text-xs text-muted-foreground">ID: {doc.id.split('-')[0]}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${bg} ${color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {label}
                            </div>
                            {doc.rejection_reason && (
                              <p className="text-[10px] text-red-500 mt-1 max-w-[200px] leading-tight">
                                Motivo: {doc.rejection_reason}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleView(doc.document_url)}
                              className="rounded-full hover:bg-primary hover:text-white"
                            >
                              <Eye className="w-4 h-4 mr-2" /> Visualizar
                            </Button>
                            {doc.status !== 'approved' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(doc.id, doc.document_url)}
                                className="rounded-full hover:bg-destructive hover:text-white ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      )
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}
