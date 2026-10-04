import { LegalPage, legalMetadata } from '@/components/layout/LegalPage'

export const generateMetadata = () => legalMetadata('offer')

export default function Page() {
  return <LegalPage slug="offer" />
}
