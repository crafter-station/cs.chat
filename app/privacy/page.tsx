import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl overflow-y-auto px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to C3.chat
      </Link>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Last updated: March 13, 2026
      </p>

      <div className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight max-w-none">
        <h2>1. Information We Collect</h2>

        <h3>Anonymous Users</h3>
        <p>
          When you use C3.chat without an account, we generate a device
          fingerprint to enforce daily usage limits. This fingerprint is a
          hashed identifier and does not contain personally identifiable
          information.
        </p>

        <h3>Registered Users</h3>
        <p>When you create an account, we collect:</p>
        <ul>
          <li>Email address and display name (via Clerk authentication)</li>
          <li>Account tier and subscription status</li>
        </ul>

        <h3>Chat Data</h3>
        <p>
          We store your conversation threads and messages to provide chat
          history. Messages are sent to third-party AI model providers for
          processing.
        </p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain the Service</li>
          <li>To enforce usage limits and prevent abuse</li>
          <li>To process payments and manage subscriptions</li>
          <li>To improve the Service and fix bugs</li>
        </ul>

        <h2>3. Third-Party Services</h2>
        <p>
          We use the following third-party services that may process your data:
        </p>
        <ul>
          <li>
            <strong>AI Model Providers</strong> (OpenAI, Anthropic, Google,
            etc.) — your messages are sent to the selected model provider for
            response generation
          </li>
          <li>
            <strong>Clerk</strong> — authentication and user management
          </li>
          <li>
            <strong>Polar</strong> — payment processing and subscriptions
          </li>
          <li>
            <strong>Neon</strong> — database hosting
          </li>
        </ul>
        <p>
          Each provider operates under their own privacy policy. We recommend
          reviewing their policies for details on how they handle data.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          Chat threads and messages are retained until you delete them.
          Anonymous usage data (fingerprints and daily counters) may be
          periodically purged.
        </p>

        <h2>5. Data Security</h2>
        <p>
          We implement reasonable security measures to protect your data,
          including encrypted connections (HTTPS) and secure database access.
          However, no method of transmission over the Internet is 100% secure.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Delete your chat history at any time</li>
          <li>Delete your account and associated data</li>
          <li>Request a copy of your stored data</li>
        </ul>
        <p>
          To exercise these rights, contact us at{" "}
          <a href="mailto:hello@crafterstation.com">hello@crafterstation.com</a>.
        </p>

        <h2>7. Cookies</h2>
        <p>
          We use essential cookies for authentication and session management. We
          do not use tracking or advertising cookies.
        </p>

        <h2>8. Children&apos;s Privacy</h2>
        <p>
          The Service is not directed at children under 13. We do not knowingly
          collect personal information from children.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. We will notify users of
          material changes by updating the &quot;Last updated&quot; date.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about this policy? Reach us at{" "}
          <a href="mailto:hello@crafterstation.com">hello@crafterstation.com</a>.
        </p>
      </div>
    </main>
  );
}
