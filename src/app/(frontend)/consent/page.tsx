import { LegalPage, legalMetadata } from '@/components/layout/LegalPage'

export const generateMetadata = () => legalMetadata('consent')

export default function Page() {
  return <LegalPage slug="consent" />
}
