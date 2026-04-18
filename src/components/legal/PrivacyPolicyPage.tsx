import { LegalPageLayout } from './LegalPageLayout';
import { SEO } from '../SEO';

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="Last updated: February 2, 2026">
      <SEO title="Privacy Policy" description="Doctoringo AI Privacy Policy — how we collect, use, and protect your personal data. GDPR compliant." url="/privacy-policy" />
      <h2>1. Introduction</h2>
      <p>
        Doctoringo AI ("we", "us", "our") is committed to protecting your privacy and ensuring the
        security of your personal data. This Privacy Policy explains how we collect, use, store,
        and protect your information when you use our Service.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Account Information</h3>
      <p>
        When you create an account via Google OAuth, we collect your name, email address,
        and profile picture. We do not store your Google password.
      </p>

      <h3>2.2 Usage Data</h3>
      <p>
        We collect information about how you use the Service, including chat messages,
        search queries, documents generated, and feature interactions. This data is used
        to provide and improve the Service.
      </p>

      <h3>2.3 Payment Information</h3>
      <p>
        Payment processing is handled by our partner Flitt. We store only the last 4 digits
        of your card number and card brand for display purposes. We do not store full card
        numbers or CVV codes.
      </p>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li>To provide and maintain the Service, including AI-powered legal research.</li>
        <li>To process payments and manage subscriptions.</li>
        <li>To send transactional communications (invoices, account notifications).</li>
        <li>To improve the Service based on usage patterns and feedback.</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2>4. Data Storage and Security</h2>
      <p>
        Your data is stored on secure servers hosted by Google Cloud Platform in the
        Europe West (Frankfurt) region. We employ industry-standard security measures including:
      </p>
      <ul>
        <li>Encryption in transit (TLS/SSL) and at rest.</li>
        <li>Session-based authentication with CSRF protection.</li>
        <li>Regular security audits and vulnerability assessments.</li>
        <li>Access controls and audit logging.</li>
      </ul>

      <h2 id="data-usage">5. AI Model Training</h2>
      <p>
        By default, your chat conversations are <strong>not</strong> used to train AI models.
        You may opt in to help improve Doctoringo AI through the Privacy settings in your account.
        This setting can be changed at any time.
      </p>

      <h2 id="location">6. Location Data</h2>
      <p>
        With your consent, we may use coarse location metadata (city/region level) to provide
        jurisdiction-relevant legal information. This is optional and can be disabled in your
        Privacy settings. We do not collect precise GPS coordinates.
      </p>

      <h2>7. Data Retention</h2>
      <p>
        We retain your account data for as long as your account is active. Chat history
        is retained until you choose to delete it. You may export all your data or request
        complete account deletion at any time through your account settings.
      </p>

      <h2>8. Your Rights (GDPR/CCPA)</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> — Request a copy of all data we hold about you.</li>
        <li><strong>Rectification</strong> — Correct inaccurate personal data.</li>
        <li><strong>Erasure</strong> — Request deletion of your personal data.</li>
        <li><strong>Portability</strong> — Export your data in a structured format.</li>
        <li><strong>Restriction</strong> — Limit how we process your data.</li>
        <li><strong>Objection</strong> — Object to certain types of data processing.</li>
      </ul>
      <p>
        To exercise these rights, use the data export and deletion features in Settings → Privacy,
        or contact us at <a href="mailto:knowhowaiassistant@gmail.com">knowhowaiassistant@gmail.com</a>.
      </p>

      <h2>9. Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul>
        <li><strong>Google Cloud Platform</strong> — Infrastructure and hosting.</li>
        <li><strong>Google OAuth</strong> — Authentication.</li>
        <li><strong>Flitt</strong> — Payment processing.</li>
        <li><strong>Firebase</strong> — Analytics (anonymized).</li>
        <li><strong>Google Gemini / OpenAI</strong> — AI model providers.</li>
      </ul>

      <h2>10. Children's Privacy</h2>
      <p>
        The Service is not intended for users under 16 years of age. We do not knowingly
        collect personal data from children.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material
        changes via email or through the Service.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy-related inquiries, contact our Data Protection team at{' '}
        <a href="mailto:knowhowaiassistant@gmail.com">knowhowaiassistant@gmail.com</a>.
      </p>
    </LegalPageLayout>
  );
}
