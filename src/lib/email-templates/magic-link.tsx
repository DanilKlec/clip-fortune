import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import icon from '@/assets/robinzone-icon.svg.asset.json'

interface MagicLinkEmailProps {
  siteName?: string
  siteUrl?: string
  token?: string
  confirmationUrl?: string
}

const SITE_ORIGIN = 'https://virality.socialsensor.io'

function resolveOrigin(siteUrl?: string): string {
  if (!siteUrl) return SITE_ORIGIN
  try {
    return new URL(siteUrl).origin
  } catch {
    return SITE_ORIGIN
  }
}

function digitsFrom(token?: string): string[] {
  const digits = (token ?? '').replace(/\D/g, '').slice(0, 4)
  return [0, 1, 2, 3].map((i) => digits[i] ?? '•')
}

export const MagicLinkEmail = ({ siteUrl, token }: MagicLinkEmailProps) => {
  const logoUrl = `${resolveOrigin(siteUrl)}${icon.url}`
  const digits = digitsFrom(token)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your Robinzone security code</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: 'center' }}>
            <Img
              src={logoUrl}
              width={72}
              height={72}
              alt="Robinzone"
              style={logo}
            />
            <Heading style={brand}>Robinzone</Heading>
          </Section>

          <Section style={helpBanner}>
            <Text style={helpText}>
              Need help? Contact us at
              <br />
              📨{' '}
              <Link href="mailto:support@socialsensor.io" style={helpLink}>
                support@socialsensor.io
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={{ textAlign: 'center' }}>
            <Heading as="h2" style={h2}>
              🔐 Robinzone Security Code
            </Heading>
            <Text style={subtle}>Your code to confirm this action:</Text>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              align="center"
              style={{ margin: '8px auto 0' }}
            >
              <tbody>
                <tr>
                  {digits.map((d, i) => (
                    <td key={i} style={digitCell}>
                      <div style={digitTile}>{d}</div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={{ textAlign: 'center', marginTop: '28px' }}>
            <Text style={sectionTitle}>⏳ Validity</Text>
            <Text style={bodyText}>
              This code is valid for <strong>10 minutes.</strong>
              <br />
              If you did not request it, you can safely ignore this email.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={{ textAlign: 'center' }}>
            <Text style={sectionTitle}>💬 Assistance</Text>
            <Text style={bodyText}>
              Our team is always ready to help with any questions.
              <br />
              You can reach us anytime at
              <br />
              <Link href="mailto:support@socialsensor.io" style={assistLink}>
                support@socialsensor.io
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={{ textAlign: 'center' }}>
            <Text style={sectionTitle}>✨ Thank You</Text>
            <Text style={bodyText}>
              Thank you for choosing <strong>Robinzone.</strong>
              <br />
              Track followers, unfollowers, and account changes
              <br />
              with confidence.
            </Text>
            <Text style={{ ...bodyText, marginTop: '18px' }}>
              Warm regards,
              <br />
              The Robinzone Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  color: '#111827',
}
const container = { maxWidth: '600px', padding: '32px 24px', margin: '0 auto' }
const logo = {
  display: 'block',
  margin: '0 auto 12px',
  borderRadius: '16px',
}
const brand = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const helpBanner = {
  backgroundColor: '#F3F4F6',
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '4px 0 8px',
}
const helpText = {
  fontSize: '13px',
  color: '#6B7280',
  textAlign: 'center' as const,
  margin: 0,
  lineHeight: '1.5',
}
const helpLink = {
  color: '#1D4ED8',
  fontWeight: 'bold' as const,
  textDecoration: 'underline',
}
const hr = {
  borderColor: '#E5E7EB',
  borderStyle: 'solid',
  borderWidth: '1px 0 0 0',
  margin: '24px 0',
}
const h2 = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}
const subtle = {
  fontSize: '14px',
  color: '#374151',
  textAlign: 'center' as const,
  margin: '0 0 16px',
}
const digitCell = { padding: '0 6px' }
const digitTile = {
  width: '72px',
  height: '80px',
  lineHeight: '80px',
  backgroundColor: '#E8F5EE',
  borderRadius: '12px',
  color: '#0E9F6E',
  fontSize: '40px',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
}
const sectionTitle = {
  fontSize: '15px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}
const bodyText = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  margin: 0,
}
const assistLink = {
  color: '#1D4ED8',
  textDecoration: 'underline',
}
