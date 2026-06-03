export interface CertificationValidationInput {
  name: string
  issuer?: string | null
  issuedDate?: string | Date | null
  expiryDate?: string | Date | null
  credentialUrl?: string | null
}

export interface CertificationValidationResult {
  status: 'validated' | 'review' | 'unverified'
  score: number
  summary: string
  issuerConfidence: 'high' | 'medium' | 'low'
  validationMethod: 'ai' | 'heuristic'
  employerVisible: boolean
}

const KNOWN_CERTIFICATE_HOSTS = [
  'credly.com',
  'coursera.org',
  'linkedin.com',
  'aws.amazon.com',
  'microsoft.com',
  'google.com',
  'cisco.com',
  'oracle.com',
  'ibm.com',
  'peoplecert.org',
  'certiport.com',
  'scrum.org',
  'salesforce.com',
  'skillsoft.com',
]

export function getCertificationHeuristicValidation(
  certification: CertificationValidationInput,
): CertificationValidationResult {
  const name = certification.name.trim()
  const issuer = certification.issuer?.trim() ?? ''
  const credentialUrl = certification.credentialUrl?.trim() ?? ''

  let score = 0

  if (name) score += 25
  if (issuer) score += 20

  let knownHost = false
  if (credentialUrl) {
    score += 20
    knownHost = KNOWN_CERTIFICATE_HOSTS.some((host) => credentialUrl.toLowerCase().includes(host))
    if (knownHost) score += 15
    if (credentialUrl.startsWith('https://')) score += 5
  }

  if (certification.issuedDate) score += 10

  const expiry = certification.expiryDate ? new Date(certification.expiryDate) : null
  if (!expiry) {
    score += 5
  } else if (expiry.getTime() >= Date.now()) {
    score += 10
  }

  if (issuer && name.toLowerCase().includes(issuer.toLowerCase())) {
    score += 5
  }

  score = Math.min(score, 100)

  let status: CertificationValidationResult['status'] = 'unverified'
  if ((knownHost && score >= 65) || score >= 80) status = 'validated'
  else if (score >= 45) status = 'review'

  return {
    status,
    score,
    summary:
      status === 'validated'
        ? 'Validation evidence is strong enough to show this certificate to employers.'
        : status === 'review'
          ? 'Certificate looks credible but needs stronger proof such as a verification link or clearer issuer details.'
          : 'Certificate cannot be confidently validated yet from the details provided.',
    issuerConfidence: knownHost || score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low',
    validationMethod: 'heuristic',
    employerVisible: status === 'validated',
  }
}
