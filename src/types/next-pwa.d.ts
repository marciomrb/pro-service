declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  export default function withPWAInit(options: any): (config: NextConfig) => NextConfig;
}
