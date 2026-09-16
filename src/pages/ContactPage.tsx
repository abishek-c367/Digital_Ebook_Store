import { useState } from 'react';
import { Mail, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { SEO } from '@/components/SEO';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission — in production this would send to an edge function
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <>
      <SEO
        title="Contact — Folio"
        description="Get in touch with the Folio team. We're here to help with questions about books, purchases, and reading access."
      />

      <section className="border-b border-ink-200/60 bg-ink-50">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="eyebrow">Get in Touch</span>
          <h1 className="mt-4 font-serif text-5xl font-light leading-tight text-ink-900">
            Contact Us
          </h1>
          <p className="mt-6 font-serif text-xl leading-relaxed text-ink-600">
            Questions about a book, a purchase, or your reading access? We're here to help.
          </p>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Contact info */}
            <div className="lg:col-span-1">
              <h2 className="font-serif text-2xl font-light text-ink-900">Reach us directly</h2>
              <div className="mt-6 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <Mail className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-ink-900">Email</h3>
                    <p className="text-sm text-ink-600">hello@folio.example.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
                    <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-ink-900">Response Time</h3>
                    <p className="text-sm text-ink-600">We typically respond within 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              {submitted ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-accent-200 bg-accent-50 px-8 py-16 text-center animate-scale-in">
                  <CheckCircle2 className="h-12 w-12 text-accent-600" strokeWidth={1.5} />
                  <h3 className="mt-4 font-serif text-2xl text-ink-900">Message sent.</h3>
                  <p className="mt-2 text-sm text-ink-600">Thank you for reaching out. We'll get back to you soon.</p>
                  <button onClick={() => setSubmitted(false)} className="btn-secondary mt-6">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="label-field" htmlFor="name">Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="label-field" htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="label-field" htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="input-field resize-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      <>Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
