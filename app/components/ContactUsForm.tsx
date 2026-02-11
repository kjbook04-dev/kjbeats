"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { gradientBgStyle } from "../context/themeHelpers";
import { useUser } from "../context/UserContext";
import { db, firebaseConfigured } from "../lib/firebase";

interface ContactSubmissionInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type ContactFormErrors = Partial<Record<keyof ContactSubmissionInput, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

export default function ContactUsForm() {
  const gBg = gradientBgStyle();
  const { user } = useUser();

  const [form, setForm] = useState<ContactSubmissionInput>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFirebaseUnavailable = !firebaseConfigured || !db;
  const initialName = useMemo(() => (user?.firstName || user?.username || "").trim(), [user?.firstName, user?.username]);
  const initialEmail = useMemo(() => (user?.email || "").trim(), [user?.email]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (!prev.name.trim() && initialName) next.name = initialName;
      if (!prev.email.trim() && initialEmail) next.email = initialEmail;
      return next;
    });
  }, [initialEmail, initialName]);

  const validate = (input: ContactSubmissionInput): ContactFormErrors => {
    const validationErrors: ContactFormErrors = {};

    const name = collapseWhitespace(input.name);
    const email = input.email.trim();
    const subject = collapseWhitespace(input.subject);
    const message = input.message.trim();

    if (!name) validationErrors.name = "Name is required.";
    else if (name.length > 100) validationErrors.name = "Name must be 100 characters or fewer.";

    if (!email) validationErrors.email = "Email is required.";
    else if (email.length > 254) validationErrors.email = "Email must be 254 characters or fewer.";
    else if (!EMAIL_PATTERN.test(email)) validationErrors.email = "Enter a valid email address.";

    if (!subject) validationErrors.subject = "Subject is required.";
    else if (subject.length > 150) validationErrors.subject = "Subject must be 150 characters or fewer.";

    if (!message) validationErrors.message = "Message is required.";
    else if (message.length < 10) validationErrors.message = "Message must be at least 10 characters.";
    else if (message.length > 5000) validationErrors.message = "Message must be 5000 characters or fewer.";

    return validationErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (isFirebaseUnavailable || !db) {
      setSubmitError("Contact form is temporarily unavailable.");
      return;
    }

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      name: collapseWhitespace(form.name),
      email: form.email.trim(),
      subject: collapseWhitespace(form.subject),
      message: form.message.trim(),
      createdAt: new Date().toISOString(),
      status: "new" as const,
      source: "contact_form" as const,
      userId: user?.id || null,
      username: user?.username || null,
    };

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, "contactSubmissions"), payload);
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setErrors({});
      setSubmitSuccess("Thanks for reaching out. Your message has been sent.");
    } catch (error) {
      console.error("Failed to submit contact form", error);
      setSubmitError("Something went wrong while sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {isFirebaseUnavailable && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200" role="alert">
          Contact form is temporarily unavailable.
        </p>
      )}

      {submitError && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200" role="alert">
          {submitError}
        </p>
      )}

      {submitSuccess && (
        <p className="rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200" role="status" aria-live="polite">
          {submitSuccess}
        </p>
      )}

      <div>
        <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-gray-200">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={100}
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          className={`w-full rounded-md border bg-gray-900 px-3 py-2 text-gray-100 outline-none transition ${errors.name ? "border-red-400" : "border-gray-600"} focus:ring-2 focus:ring-white/20`}
        />
        {errors.name && (
          <p id="contact-name-error" className="mt-1 text-sm text-red-300" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-gray-200">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={254}
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className={`w-full rounded-md border bg-gray-900 px-3 py-2 text-gray-100 outline-none transition ${errors.email ? "border-red-400" : "border-gray-600"} focus:ring-2 focus:ring-white/20`}
        />
        {errors.email && (
          <p id="contact-email-error" className="mt-1 text-sm text-red-300" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-2 block text-sm font-semibold text-gray-200">
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          maxLength={150}
          value={form.subject}
          onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          className={`w-full rounded-md border bg-gray-900 px-3 py-2 text-gray-100 outline-none transition ${errors.subject ? "border-red-400" : "border-gray-600"} focus:ring-2 focus:ring-white/20`}
        />
        {errors.subject && (
          <p id="contact-subject-error" className="mt-1 text-sm text-red-300" role="alert">
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-gray-200">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={7}
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={`w-full rounded-md border bg-gray-900 px-3 py-2 text-gray-100 outline-none transition ${errors.message ? "border-red-400" : "border-gray-600"} focus:ring-2 focus:ring-white/20`}
        />
        {errors.message && (
          <p id="contact-message-error" className="mt-1 text-sm text-red-300" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isFirebaseUnavailable}
        className={`rounded-full px-6 py-2 font-semibold text-gray-900 transition ${isSubmitting || isFirebaseUnavailable ? "cursor-not-allowed opacity-60" : "hover:scale-105"}`}
        style={gBg}
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
