import { LegalPageLayout } from './LegalPageLayout';
import { SEO } from '../SEO';

export function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="Last updated: January 15, 2026">
      <SEO title="Terms of Service" description="Doctoringo AI Terms of Service — rules and conditions for using our AI-powered legal assistant." url="/terms" />
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Doctoringo AI ("Service"), you agree to be bound by these Terms of Service ("Terms").
        If you do not agree to these Terms, you may not access or use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Doctoringo AI is an AI-powered legal research assistant that provides legal information,
        document drafting assistance, and legal research capabilities. The Service is designed
        to assist legal professionals and individuals with legal research tasks.
      </p>

      <h2>3. User Accounts</h2>
      <p>
        To access certain features of the Service, you must create an account using Google OAuth authentication.
        You are responsible for maintaining the confidentiality of your account and for all activities that
        occur under your account.
      </p>
      <ul>
        <li>You must provide accurate and complete information when creating your account.</li>
        <li>You are responsible for safeguarding your account credentials.</li>
        <li>You must notify us immediately of any unauthorized use of your account.</li>
      </ul>

      <h2>4. Subscription and Payment</h2>
      <p>
        Doctoringo AI offers both free and premium subscription plans. Premium subscriptions are billed
        in Georgian Lari (₾ GEL) through our payment partner Flitt.
      </p>
      <ul>
        <li>Subscription fees are non-refundable except as required by applicable law.</li>
        <li>Auto-renewal may be enabled or disabled at any time through your account settings.</li>
        <li>We reserve the right to modify pricing with 30 days prior notice.</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
        <li>Attempt to reverse engineer, decompile, or disassemble the Service.</li>
        <li>Use automated means to access the Service without our express permission.</li>
        <li>Share your account credentials with third parties.</li>
        <li>Upload malicious content or attempt to compromise the security of the Service.</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        The Service, including its design, features, and content, is owned by Doctoringo AI and
        is protected by copyright, trademark, and other intellectual property laws. Documents
        you generate using the Service belong to you.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        Doctoringo AI provides legal information and research assistance only. The Service does not
        constitute legal advice and should not be relied upon as a substitute for consultation
        with a qualified legal professional. We are not liable for any decisions made based on
        information provided by the Service.
      </p>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time for violation of these Terms.
        You may delete your account at any time by contacting our support team.
      </p>

      <h2>9. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify you of material
        changes via email or through the Service. Continued use of the Service after changes
        constitutes acceptance of the modified Terms.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of Georgia. Any disputes arising from these Terms
        shall be resolved in the courts of Tbilisi, Georgia.
      </p>

      <h2>11. Contact</h2>
      <p>
        For questions about these Terms, contact us at{' '}
        <a href="mailto:knowhowaiassistant@gmail.com">knowhowaiassistant@gmail.com</a>.
      </p>
    </LegalPageLayout>
  );
}
