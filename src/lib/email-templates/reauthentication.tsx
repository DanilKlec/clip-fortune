import * as React from 'react'

import { MagicLinkEmail } from './magic-link'

interface ReauthenticationEmailProps {
  token: string
  siteUrl?: string
}

export const ReauthenticationEmail = ({
  token,
  siteUrl,
}: ReauthenticationEmailProps) => (
  <MagicLinkEmail token={token} siteUrl={siteUrl} />
)

export default ReauthenticationEmail
