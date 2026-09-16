interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({ title, description, image, url, type = 'website' }: SEOProps) {
  const fullTitle = title.includes('Folio') ? title : `${title} | Folio`;
  const desc = description || 'Folio — a premium digital publishing house for carefully crafted e-books on AI, machine learning, programming, and more.';
  const imgUrl = image || 'https://images.pexels.com/photos/25630341/pexels-photo-25630341.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
  const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://folio.example.com');

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={imgUrl} />
      <meta property="og:url" content={pageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={imgUrl} />
    </>
  );
}
