'use client'

import { Card } from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  DollarSign, 
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { format, subDays, startOfDay, isSameDay, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PerformanceClientProps {
  views: { created_at: string }[]
  bookings: { status: string; created_at: string }[]
  hourlyRate: number
}

export default function PerformanceClient({ views, bookings, hourlyRate }: PerformanceClientProps) {
  // Last 30 days interval
  const endDate = new Date()
  const startDate = subDays(endDate, 30)
  
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  })

  // Prepare data for charts
  const chartData = days.map(day => {
    const dayViews = views.filter(v => isSameDay(new Date(v.created_at), day)).length
    const dayBookings = bookings.filter(b => isSameDay(new Date(b.created_at), day)).length
    const dayCompletedBookings = bookings.filter(b => 
      b.status === 'completed' && isSameDay(new Date(b.created_at), day)
    ).length
    
    return {
      date: format(day, 'dd/MM'),
      fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
      views: dayViews,
      bookings: dayBookings,
      earnings: dayCompletedBookings * hourlyRate,
      conversion: dayViews > 0 ? (dayBookings / dayViews) * 100 : 0
    }
  })

  // Totals
  const totalViews = views.length
  const totalBookings = bookings.length
  const totalEarnings = bookings.filter(b => b.status === 'completed').length * hourlyRate
  const avgConversion = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0

  // Comparison (Current 15 days vs Previous 15 days)
  const last15Days = chartData.slice(-15)
  const prev15Days = chartData.slice(-30, -15)
  
  const getGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const viewsGrowth = getGrowth(
    last15Days.reduce((acc, d) => acc + d.views, 0),
    prev15Days.reduce((acc, d) => acc + d.views, 0)
  )

  const earningsGrowth = getGrowth(
    last15Days.reduce((acc, d) => acc + d.earnings, 0),
    prev15Days.reduce((acc, d) => acc + d.earnings, 0)
  )

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Ganhos Totais" 
          value={`R$ ${totalEarnings.toLocaleString('pt-BR')}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          trend={earningsGrowth}
          description="Últimos 30 dias"
        />
        <MetricCard 
          title="Visualizações" 
          value={totalViews}
          icon={<Users className="w-5 h-5 text-blue-500" />}
          trend={viewsGrowth}
          description="Acessos ao seu perfil"
        />
        <MetricCard 
          title="Agendamentos" 
          value={totalBookings}
          icon={<CalendarCheck className="w-5 h-5 text-orange-500" />}
          description="Solicitações recebidas"
        />
        <MetricCard 
          title="Taxa de Conversão" 
          value={`${avgConversion.toFixed(1)}%`}
          icon={<Percent className="w-5 h-5 text-purple-500" />}
          description="Views vira agendamentos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Earnings Chart */}
        <Card className="p-6 rounded-3xl border-none shadow-sm bg-white dark:bg-zinc-900">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Fluxo de Faturamento</h3>
            <p className="text-sm text-muted-foreground">Ganhos estimados baseados em serviços concluídos</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEarnings)" 
                  name="Ganhos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Views Chart */}
        <Card className="p-6 rounded-3xl border-none shadow-sm bg-white dark:bg-zinc-900">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Visualizações de Perfil</h3>
            <p className="text-sm text-muted-foreground">Interesse dos clientes no seu perfil</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="views" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  name="Views"
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Conversion Chart */}
        <Card className="p-6 rounded-3xl border-none shadow-sm bg-white dark:bg-zinc-900 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Taxa de Conversão Diária</h3>
            <p className="text-sm text-muted-foreground">Porcentagem de visualizações que resultaram em agendamentos</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversion" 
                  stroke="#a855f7" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                  name="Conversão (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, trend, description }: any) {
  return (
    <Card className="p-6 rounded-3xl border-none shadow-sm bg-white dark:bg-zinc-900">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-xs font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <h3 className="text-2xl font-black mt-1">{value}</h3>
        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-bold">{description}</p>
      </div>
    </Card>
  )
}
