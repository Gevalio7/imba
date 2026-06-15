import nodemailer from 'nodemailer'

const configs = [
  { host: 'smtp.gmail.com', port: 587, secure: false, user: 'bitterliterr@gmail.com', pass: process.argv[2] },
  { host: 'smtp.gmail.com', port: 465, secure: true, user: 'bitterliterr@gmail.com', pass: process.argv[2] },
]

const password = process.argv[2]
if (!password) {
  console.log('Usage: node test-smtp.mjs <app-password>')
  process.exit(1)
}

for (const cfg of configs) {
  console.log(`\n=== Testing ${cfg.host}:${cfg.port} (secure=${cfg.secure}) ===`)
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  })

  try {
    const result = await transporter.verify()
    console.log('✅ Connected:', result)
  }
  catch (err) {
    console.error('❌ Error:', err && err.message ? err.message : err)
  }
}
