import fs from 'node:fs/promises'
import path from 'node:path'

const SECURITY_TYPES = {
  none: 0,
  ssl: 1,
  tls: 1,
  starttls: 2,
  auto: 9,
}

function getEnv(name, fallback) {
  const value = process.env[name]
  return value === undefined || value === '' ? fallback : value
}

function requireEnv(name, fallback) {
  const value = getEnv(name, fallback)
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function parseSecurity(name, fallback) {
  const value = requireEnv(name, fallback).toLowerCase()
  const type = SECURITY_TYPES[value]

  if (type === undefined) {
    throw new Error(
      `Unsupported ${name} value "${value}". Use one of: ${Object.keys(SECURITY_TYPES).join(', ')}`
    )
  }

  return type
}

function parseDomains(rawDomains) {
  return rawDomains
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function parseArgs(argv) {
  const args = { output: path.resolve(process.cwd(), 'packages/email-ui/.generated/snappymail') }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--output') {
      args.output = path.resolve(process.cwd(), argv[index + 1])
      index += 1
    } else if (value === '--help') {
      args.help = true
    }
  }

  return args
}

function buildDomainConfig({ domain, imap, smtp, shortLogin }) {
  return {
    IMAP: {
      host: imap.host,
      port: imap.port,
      type: imap.type,
      timeout: 300,
      shortLogin,
      lowerLogin: true,
      sasl: ['SCRAM-SHA3-512', 'SCRAM-SHA-512', 'SCRAM-SHA-256', 'SCRAM-SHA-1', 'PLAIN', 'LOGIN'],
      ssl: {
        verify_peer: false,
        verify_peer_name: false,
        allow_self_signed: false,
        SNI_enabled: true,
        disable_compression: true,
        security_level: 1,
      },
      disabled_capabilities: ['METADATA', 'OBJECTID', 'PREVIEW', 'STATUS=SIZE'],
      use_expunge_all_on_delete: false,
      fast_simple_search: true,
      force_select: false,
      message_all_headers: false,
      message_list_limit: 10000,
      search_filter: '',
    },
    SMTP: {
      host: smtp.host,
      port: smtp.port,
      type: smtp.type,
      timeout: 60,
      shortLogin,
      lowerLogin: true,
      sasl: ['SCRAM-SHA3-512', 'SCRAM-SHA-512', 'SCRAM-SHA-256', 'SCRAM-SHA-1', 'PLAIN', 'LOGIN'],
      ssl: {
        verify_peer: false,
        verify_peer_name: false,
        allow_self_signed: false,
        SNI_enabled: true,
        disable_compression: true,
        security_level: 1,
      },
      useAuth: true,
      setSender: false,
      usePhpMail: false,
    },
    Sieve: {
      host: 'localhost',
      port: 4190,
      type: 0,
      timeout: 10,
      shortLogin,
      lowerLogin: true,
      sasl: ['SCRAM-SHA3-512', 'SCRAM-SHA-512', 'SCRAM-SHA-256', 'SCRAM-SHA-1', 'PLAIN', 'LOGIN'],
      ssl: {
        verify_peer: false,
        verify_peer_name: false,
        allow_self_signed: false,
        SNI_enabled: true,
        disable_compression: true,
        security_level: 1,
      },
      enabled: false,
    },
    whiteList: '',
    tlaoMetadata: {
      domain,
      generatedBy: '@tlao/email-ui',
      loginMode: shortLogin ? 'localpart' : 'email',
    },
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    process.stdout.write(
      `Usage: pnpm --filter @tlao/email-ui run render:snappymail -- --output <path>\n`
    )
    return
  }

  const domains = parseDomains(
    requireEnv('SNAPPYMAIL_ALLOWED_DOMAINS', process.env.MAIL_PRIMARY_DOMAIN)
  )

  if (domains.length === 0) {
    throw new Error('SNAPPYMAIL_ALLOWED_DOMAINS must contain at least one domain')
  }

  const loginMode = requireEnv('SNAPPYMAIL_LOGIN_MODE', 'email').toLowerCase()
  if (loginMode !== 'email' && loginMode !== 'localpart') {
    throw new Error('SNAPPYMAIL_LOGIN_MODE must be "email" or "localpart"')
  }

  const shortLogin = loginMode === 'localpart'
  const imap = {
    host: requireEnv('SNAPPYMAIL_IMAP_HOST', process.env.MAIL_FQDN),
    port: Number.parseInt(requireEnv('SNAPPYMAIL_IMAP_PORT', '993'), 10),
    type: parseSecurity('SNAPPYMAIL_IMAP_SECURITY', 'ssl'),
  }
  const smtp = {
    host: requireEnv('SNAPPYMAIL_SMTP_HOST', process.env.MAIL_FQDN),
    port: Number.parseInt(requireEnv('SNAPPYMAIL_SMTP_PORT', '587'), 10),
    type: parseSecurity('SNAPPYMAIL_SMTP_SECURITY', 'starttls'),
  }

  const domainDirectory = path.join(args.output, '_data_', '_default_', 'domains')
  await fs.mkdir(domainDirectory, { recursive: true })

  for (const domain of domains) {
    const outputPath = path.join(domainDirectory, `${domain}.json`)
    const contents = `${JSON.stringify(buildDomainConfig({ domain, imap, smtp, shortLogin }), null, 2)}\n`
    await fs.writeFile(outputPath, contents, 'utf8')
    process.stdout.write(`Rendered ${outputPath}\n`)
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
