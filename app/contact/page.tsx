"use client";

import ContactUsForm from "../components/ContactUsForm";
import { useTheme } from "../context/ThemeContext";
import { gradientTextStyle } from "../context/themeHelpers";

export default function ContactPage() {
  const { currentTheme } = useTheme();
  const gText = gradientTextStyle();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-4xl font-bold" style={gText}>
          Contact Us
        </h1>
        <p className={`mb-8 text-lg ${currentTheme.text}`}>
          Send us a message below and we will respond as soon as possible, though response times may vary.
        </p>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 md:p-8">
          <ContactUsForm />
        </div>
      </div>
    </div>
  );
}
