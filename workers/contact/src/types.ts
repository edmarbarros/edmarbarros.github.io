export interface Env {
  CONTACT_LIMITS: KVNamespace;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET: string;
  ALLOWED_ORIGIN: string;
  TO_EMAIL: string;
  FROM_EMAIL: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  website: string;      // honeypot — must be empty
  ts: number;           // ms epoch when the page was rendered client-side
  turnstileToken: string;
}
