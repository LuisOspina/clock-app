declare module 'swagger-ui-react' {
  import type { ReactNode } from 'react'
  const SwaggerUI: (props: { url: string; docExpansion?: string; tryItOutEnabled?: boolean; defaultModelsExpandDepth?: number; requestInterceptor?: (request: { headers: Record<string, string> }) => unknown }) => ReactNode
  export default SwaggerUI
}
