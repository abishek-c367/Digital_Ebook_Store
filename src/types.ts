export type Role = 'customer' | 'admin';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface TOCChapter {
  title: string;
  sections: string[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  long_description: string | null;
  author: string;
  author_bio: string | null;
  price_cents: number;
  currency: string;
  cover_url: string | null;
  private_file_path: string | null;
  sample_file_path: string | null;
  category_id: string | null;
  pages: number | null;
  language: string;
  publication_date: string | null;
  format: string;
  what_you_learn: string[] | null;
  who_for: string | null;
  table_of_contents: TOCChapter[] | null;
  faqs: FAQ[] | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Purchase {
  id: string;
  user_id: string | null;
  book_id: string;
  email: string;
  payment_provider: string;
  payment_id: string | null;
  amount_cents: number;
  currency: string;
  status: PurchaseStatus;
  purchased_at: string | null;
  created_at: string;
  book?: Book;
}

export interface AccessToken {
  id: string;
  purchase_id: string;
  token_hash: string;
  email: string;
  book_id: string;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string | null;
  email: string | null;
  book_id: string;
  current_page: number;
  progress_percentage: number;
  updated_at: string;
}

export interface BookWithCategory extends Book {
  category: Category | null;
}
