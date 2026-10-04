import { LegalPage, legalMetadata } from '@/components/layout/LegalPage'

export const generateMetadata = () => legalMetadata('privacy')

export default function Page() {
  return <LegalPage slug="privacy" />
}
