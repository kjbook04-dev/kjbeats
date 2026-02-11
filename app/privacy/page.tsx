"use client";

import Link from "next/link";
import { gradientTextStyle } from "../context/themeHelpers";

export default function PrivacyPage() {
  const gText = gradientTextStyle();

  return (
    <div className="container mx-auto px-4 py-12">
  <h1 className="text-4xl font-bold mb-6" style={gText}>Privacy Policy</h1>

      <div className="max-w-3xl mx-auto space-y-6 text-gray-300">
        <p>
          This Privacy Policy explains how KJBeats ("we", "us", or "our") collects,
          uses, discloses, and protects information when you use our website and services.
        </p>

        <section>
          <h2 className="text-2xl font-semibold mb-2" style={gText}>Information We Collect</h2>
          <p>
            We may collect information you provide directly (for example, account
            information, profile details, and uploaded content) and information that is
            created or inferred from your use of the service (for example, usage data,
            device information, and analytics).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2" style={gText}>How We Use Information</h2>
          <p>
            We use information to provide, maintain, and improve our services, to
            personalize your experience, to communicate with you, and to protect the
            security and integrity of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2" style={gText}>Cookies and Tracking</h2>
          <p>
            We may use cookies, local storage, and similar technologies to remember
            preferences and to collect usage information. You can control cookies via
            your browser settings, but disabling certain cookies may limit functionality.
          </p>
        </section>

  <section>
          <h2 className="text-2xl font-semibold mb-2" style={gText}>Third-Party Services</h2>
          <p>
            We may share information with third-party service providers who perform
            services on our behalf (such as hosting, analytics, and payment
            processing). These providers are contractually restricted from using your
            information for other purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2" style={gText}>Security</h2>
          <p>
            We use reasonable administrative, technical, and physical safeguards to
            protect your information. However, no method of transmission or storage
            is completely secure—so we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2" style={gText}>Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have rights to access, correct,
            delete, or port your personal data. To exercise those rights or for
            questions about this policy, use our{" "}
            <Link className="underline" style={gText} href="/contact">
              Contact Us form
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2" style={gText}>Children</h2>
          <p>
            Our services are not directed to children under 13, and we do not knowingly
            collect personal information from children under 13. If you believe we
            have collected such information, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2" style={gText}>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the
            updated policy on this page with a revised effective date.
          </p>
        </section>

        <p className="text-sm text-gray-400">Effective date: January 26, 2026</p>
      </div>
    </div>
  );
}
