"use client"

import dynamic from 'next/dynamic'

export const ThemeProvider = dynamic(
  () => import('next-themes').then((mod) => mod.ThemeProvider),
  { ssr: false }
)
