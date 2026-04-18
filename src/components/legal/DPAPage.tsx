import { LegalPageLayout } from './LegalPageLayout';
import { SEO } from '../SEO';

export function DPAPage() {
  return (
    <LegalPageLayout title="Data Processing Addendum (DPA)" lastUpdated="GDPR/CCPA Compliant">
      <SEO title="Data Processing Addendum" description="Doctoringo AI Data Processing Addendum — GDPR and CCPA compliant data processing agreement." url="/dpa" />
      <h2>1. Scope and Purpose</h2>
      <p>
        This Data Processing Addendum ("DPA") supplements the Terms of Service and Privacy Policy
        of Doctoringo AI. It governs the processing of personal data by Doctoringo AI ("Processor")
        on behalf of its users ("Controllers") in compliance with the General Data Protection
        Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
      </p>

      <h2>2. Definitions</h2>
      <ul>
        <li><strong>"Personal Data"</strong> — Any information relating to an identified or identifiable natural person.</li>
        <li><strong>"Processing"</strong> — Any operation performed on Personal Data, including collection, storage, use, and deletion.</li>
        <li><strong>"Controller"</strong> — The user who determines the purposes and means of processing Personal Data.</li>
        <li><strong>"Processor"</strong> — Doctoringo AI, which processes Personal Data on behalf of the Controller.</li>
        <li><strong>"Sub-processor"</strong> — A third party engaged by the Processor to assist in data processing.</li>
      </ul>

      <h2>3. Data Processing Details</h2>
      <h3>3.1 Categories of Data</h3>
      <ul>
        <li>Account information (name, email).</li>
        <li>Chat messages and legal research queries.</li>
        <li>Generated documents and their content.</li>
        <li>Usage analytics and interaction data.</li>
        <li>Payment information (limited to last 4 digits and card brand).</li>
      </ul>

      <h3>3.2 Purpose of Processing</h3>
      <p>
        Personal Data is processed solely for the purpose of providing the Doctoringo AI
        legal research service, including AI-powered chat, document generation, and
        legal information retrieval.
      </p>

      <h3>3.3 Duration</h3>
      <p>
        Data is processed for the duration of the user's account activity and retained
        in accordance with our Privacy Policy retention schedule.
      </p>

      <h2>4. Processor Obligations</h2>
      <p>Doctoringo AI shall:</p>
      <ul>
        <li>Process Personal Data only on documented instructions from the Controller.</li>
        <li>Ensure that persons authorized to process Personal Data have committed to confidentiality.</li>
        <li>Implement appropriate technical and organizational security measures.</li>
        <li>Assist the Controller in responding to data subject requests.</li>
        <li>Delete or return Personal Data upon termination of the service.</li>
        <li>Make available all information necessary to demonstrate compliance.</li>
      </ul>

      <h2>5. Security Measures</h2>
      <p>We implement the following technical and organizational measures:</p>
      <ul>
        <li>TLS 1.3 encryption for all data in transit.</li>
        <li>AES-256 encryption for data at rest.</li>
        <li>Regular security assessments and penetration testing.</li>
        <li>Access controls with role-based permissions.</li>
        <li>Audit logging of all data access and modifications.</li>
        <li>Automated backup with encrypted storage.</li>
        <li>Incident response procedures with 72-hour breach notification.</li>
      </ul>

      <h2>6. Sub-processors</h2>
      <p>The following sub-processors are authorized to process Personal Data:</p>
      <ul>
        <li><strong>Google Cloud Platform</strong> (EU region) — Infrastructure and hosting.</li>
        <li><strong>Google Gemini API</strong> — AI language model processing.</li>
        <li><strong>OpenAI API</strong> — Fallback AI language model processing.</li>
        <li><strong>Flitt</strong> — Payment processing (PCI DSS compliant).</li>
        <li><strong>Firebase</strong> — Anonymized analytics.</li>
      </ul>
      <p>
        We will notify users of any changes to sub-processors with at least 14 days' notice.
      </p>

      <h2>7. International Data Transfers</h2>
      <p>
        Personal Data is primarily stored and processed within the European Economic Area (EEA)
        on Google Cloud Platform servers in Frankfurt, Germany. Where data is transferred
        outside the EEA (e.g., to AI model providers), we ensure adequate safeguards through
        Standard Contractual Clauses (SCCs) approved by the European Commission.
      </p>

      <h2>8. Data Subject Rights</h2>
      <p>
        We assist Controllers in fulfilling data subject requests including access, rectification,
        erasure, restriction, portability, and objection. Users can exercise these rights through
        Settings → Privacy or by contacting us directly.
      </p>

      <h2>9. Breach Notification</h2>
      <p>
        In the event of a Personal Data breach, Doctoringo AI shall notify the affected Controller
        without undue delay and no later than 72 hours after becoming aware of the breach,
        providing all information required under GDPR Article 33.
      </p>

      <h2>10. Contact</h2>
      <p>
        For DPA-related inquiries, contact our Data Protection Officer at{' '}
        <a href="mailto:knowhowaiassistant@gmail.com">knowhowaiassistant@gmail.com</a>.
      </p>
    </LegalPageLayout>
  );
}
