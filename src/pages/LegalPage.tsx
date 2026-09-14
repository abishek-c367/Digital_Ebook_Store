import { SEO } from '@/components/SEO';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'refund';
}

const content = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      { heading: 'Information We Collect', body: 'We collect your email address when you make a purchase or create an account. This is used to associate you with your purchases and send you reading links. We do not sell or share your personal information with third parties.' },
      { heading: 'How We Use Your Data', body: 'Your email is used to verify purchases, generate secure reading links, and provide access to your purchased books. Payment processing is handled by Stripe — we do not store your credit card information.' },
      { heading: 'Data Security', body: 'All access tokens are cryptographically hashed before storage. Book files are stored in private storage and never exposed publicly. All communication with our servers is encrypted via HTTPS.' },
      { heading: 'Your Rights', body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us. You retain lifetime access to purchased books.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      { heading: 'Purchases', body: 'When you purchase a book on Folio, you are granted a personal, non-transferable license to read the book through our online reader. This license is for your individual use only.' },
      { heading: 'Protected Reading', body: 'Books on Folio are protected through our secure online reading platform. You may not download, copy, redistribute, or share access to purchased books. Sharing your reading link with others is prohibited.' },
      { heading: 'Watermarking', body: 'The reading interface may display a watermark identifying your email address. This is a deterrent against unauthorized redistribution and does not affect your reading experience.' },
      { heading: 'Account Security', body: 'You are responsible for maintaining the security of your account and reading links. If you believe your access has been compromised, contact us immediately.' },
      { heading: 'Intellectual Property', body: 'All books on Folio are the intellectual property of their respective authors. The platform, design, and reading technology are property of Folio.' },
    ],
  },
  refund: {
    title: 'Refund Policy',
    sections: [
      { heading: 'Digital Goods', body: 'Due to the nature of digital content, all sales are generally final. However, we understand that circumstances may arise.' },
      { heading: 'Refund Requests', body: 'If you are unsatisfied with your purchase, you may request a refund within 14 days of purchase by contacting support. Refunds are evaluated on a case-by-case basis.' },
      { heading: 'Access Revocation', body: 'If a refund is issued, your access to the book will be revoked and your reading link will be deactivated.' },
      { heading: 'Technical Issues', body: 'If you are unable to access your purchased book due to a technical issue on our end, contact support for a full refund or alternative access arrangement.' },
    ],
  },
};

export function LegalPage({ type }: LegalPageProps) {
  const page = content[type];

  return (
    <>
      <SEO title={`${page.title} — Folio`} description={`${page.title} for the Folio digital publishing platform.`} />

      <section className="border-b border-ink-200/60 bg-ink-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl font-light text-ink-900">{page.title}</h1>
          <p className="mt-2 text-sm text-ink-500">Last updated: September 2026</p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {page.sections.map((section, i) => (
              <div key={i}>
                <h2 className="font-serif text-xl text-ink-900">{section.heading}</h2>
                <p className="mt-3 font-serif text-lg leading-relaxed text-ink-700">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
