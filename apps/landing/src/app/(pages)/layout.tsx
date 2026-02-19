import Navbar from '@/components/Navbar'
import { LandingFooter } from '@/components/LandingFooter'

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
  ? `v${process.env.NEXT_PUBLIC_APP_VERSION}`
  : undefined

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-background text-foreground pt-16">{children}</main>
      <LandingFooter version={appVersion} />
    </div>
  )
}
