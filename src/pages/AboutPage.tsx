import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Award, Users } from 'lucide-react';
import { SEO } from '@/components/SEO';

export function AboutPage() {
  return (
    <>
      <SEO
        title="About — Folio"
        description="Learn about Folio, a premium digital publishing house dedicated to carefully crafted e-books."
      />

      {/* Hero */}
      <section className="border-b border-ink-200/60 bg-ink-50">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="eyebrow">Our Story</span>
          <h1 className="mt-4 font-serif text-5xl font-light leading-tight text-ink-900 text-balance">
            A publishing house for the curious mind.
          </h1>
          <p className="mt-6 font-serif text-xl leading-relaxed text-ink-600">
            Folio was founded on a simple belief: that books worth reading should be crafted with the same care as the ideas they contain.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading">Our Mission</h2>
          <div className="mt-6 space-y-4 font-serif text-lg leading-relaxed text-ink-700">
            <p>
              In an age of endless content, depth is rare. We created Folio to be a counterbalance — a place where books are written with intention, edited with rigor, and presented with elegance.
            </p>
            <p>
              Every book in our catalog is selected for its intellectual contribution and crafted for the reading experience. We believe that the medium should honor the message, which is why we've built a reading platform that is as refined as the books it hosts.
            </p>
            <p>
              Our authors are practitioners and thinkers — people who have spent years mastering their craft and are now distilling that knowledge into works that will stand the test of time.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="eyebrow">What We Value</span>
            <h2 className="mt-2 section-heading">Principles that guide everything.</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                <BookOpen className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-serif text-xl text-ink-900">Craftsmanship</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Every book is written, edited, and designed with meticulous attention to detail. We prioritize quality over quantity.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                <Award className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-serif text-xl text-ink-900">Integrity</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                We protect our authors' work with robust digital rights management and never compromise on the security of their intellectual property.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-700">
                <Users className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-serif text-xl text-ink-900">Accessibility</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Knowledge should be accessible. Our reader works on every device, ensuring that great books are always within reach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-light text-ink-50 sm:text-4xl">
            Explore the catalog.
          </h2>
          <p className="mt-4 font-serif text-lg text-ink-300">
            Discover books that will change how you think.
          </p>
          <Link to="/books" className="btn-gold mt-8">
            Browse Books
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
