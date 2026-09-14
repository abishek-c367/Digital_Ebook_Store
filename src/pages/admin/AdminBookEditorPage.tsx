import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { useAuth } from '@/lib/AuthContext';
import type { Category } from '@/types';

interface BookForm {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  long_description: string;
  author: string;
  author_bio: string;
  price_cents: number;
  cover_url: string;
  private_file_path: string;
  category_id: string;
  pages: number;
  language: string;
  publication_date: string;
  format: string;
  what_you_learn: string;
  who_for: string;
  table_of_contents: string;
  faqs: string;
  featured: boolean;
  published: boolean;
}

const emptyForm: BookForm = {
  title: '',
  slug: '',
  subtitle: '',
  description: '',
  long_description: '',
  author: '',
  author_bio: '',
  price_cents: 0,
  cover_url: '',
  private_file_path: '',
  category_id: '',
  pages: 0,
  language: 'English',
  publication_date: '',
  format: 'PDF',
  what_you_learn: '',
  who_for: '',
  table_of_contents: '[]',
  faqs: '[]',
  featured: false,
  published: false,
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function AdminBookEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [form, setForm] = useState<BookForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories(data as Category[]);
    });

    if (isEdit && id) {
      supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error || !data) {
            showToast('error', 'Book not found.');
            navigate('/admin/books');
            return;
          }
          setForm({
            title: data.title || '',
            slug: data.slug || '',
            subtitle: data.subtitle || '',
            description: data.description || '',
            long_description: data.long_description || '',
            author: data.author || '',
            author_bio: data.author_bio || '',
            price_cents: data.price_cents || 0,
            cover_url: data.cover_url || '',
            private_file_path: data.private_file_path || '',
            category_id: data.category_id || '',
            pages: data.pages || 0,
            language: data.language || 'English',
            publication_date: data.publication_date || '',
            format: data.format || 'PDF',
            what_you_learn: (data.what_you_learn || []).join('\n'),
            who_for: data.who_for || '',
            table_of_contents: JSON.stringify(data.table_of_contents || [], null, 2),
            faqs: JSON.stringify(data.faqs || [], null, 2),
            featured: data.featured || false,
            published: data.published || false,
          });
          setLoading(false);
        });
    }
  }, [id, isEdit, navigate]);

  const handleChange = (field: keyof BookForm, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Cover image must be under 5MB.');
      return;
    }

    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-cover.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('book-covers')
        .getPublicUrl(fileName);

      handleChange('cover_url', urlData.publicUrl);
      showToast('success', 'Cover image uploaded.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to upload cover.');
    }
    setUploadingCover(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('error', 'Book file must be under 50MB.');
      return;
    }

    setUploadingFile(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `${user.id}/${Date.now()}-book.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('book-content')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      handleChange('private_file_path', fileName);
      showToast('success', 'Book file uploaded.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to upload book file.');
    }
    setUploadingFile(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const whatYouLearn = form.what_you_learn
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      let toc: unknown[] = [];
      try {
        toc = JSON.parse(form.table_of_contents);
      } catch {
        showToast('error', 'Table of Contents must be valid JSON.');
        setSaving(false);
        return;
      }

      let faqs: unknown[] = [];
      try {
        faqs = JSON.parse(form.faqs);
      } catch {
        showToast('error', 'FAQs must be valid JSON.');
        setSaving(false);
        return;
      }

      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        subtitle: form.subtitle || null,
        description: form.description,
        long_description: form.long_description || null,
        author: form.author,
        author_bio: form.author_bio || null,
        price_cents: form.price_cents,
        currency: 'usd',
        cover_url: form.cover_url || null,
        private_file_path: form.private_file_path || null,
        category_id: form.category_id || null,
        pages: form.pages || null,
        language: form.language,
        publication_date: form.publication_date || null,
        format: form.format,
        what_you_learn: whatYouLearn,
        who_for: form.who_for || null,
        table_of_contents: toc,
        faqs: faqs,
        featured: form.featured,
        published: form.published,
      };

      if (isEdit && id) {
        const { error } = await supabase.from('books').update(payload).eq('id', id);
        if (error) throw error;
        showToast('success', 'Book updated.');
      } else {
        const { error } = await supabase.from('books').insert(payload);
        if (error) throw error;
        showToast('success', 'Book created.');
      }
      navigate('/admin/books');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save book.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/books" className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Books
      </Link>

      <h1 className="font-serif text-3xl font-light text-ink-900">
        {isEdit ? 'Edit Book' : 'Add New Book'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="font-serif text-lg text-ink-900 mb-4">Basic Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label-field">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => {
                  handleChange('title', e.target.value);
                  if (!isEdit) handleChange('slug', slugify(e.target.value));
                }}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Slug (URL) *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="input-field"
                placeholder="auto-generated-from-title"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Author *</label>
              <input
                type="text"
                required
                value={form.author}
                onChange={(e) => handleChange('author', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="input-field"
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Short Description *</label>
              <textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="input-field resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Long Description</label>
              <textarea
                rows={5}
                value={form.long_description}
                onChange={(e) => handleChange('long_description', e.target.value)}
                className="input-field resize-none"
              />
            </div>
          </div>
        </div>

        {/* Cover Image Upload */}
        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="font-serif text-lg text-ink-900 mb-4">Cover Image</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {form.cover_url ? (
              <div className="relative flex-shrink-0">
                <img
                  src={form.cover_url}
                  alt="Cover preview"
                  className="h-40 w-28 rounded-lg object-cover shadow-md"
                />
                <button
                  type="button"
                  onClick={() => handleChange('cover_url', '')}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md transition-colors hover:bg-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-40 w-28 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-ink-200 bg-ink-50">
                <ImageIcon className="h-8 w-8 text-ink-300" strokeWidth={1} />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm text-white transition-colors hover:bg-ink-800 disabled:opacity-50"
              >
                {uploadingCover ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Upload Cover Image</>
                )}
              </button>
              <p className="mt-2 text-xs text-ink-500">PNG or JPG, up to 5MB. Recommended size: 1200x1800px.</p>
              <div className="mt-3">
                <label className="label-field">Or paste an image URL</label>
                <input
                  type="url"
                  value={form.cover_url}
                  onChange={(e) => handleChange('cover_url', e.target.value)}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Book Content Upload */}
        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="font-serif text-lg text-ink-900 mb-4">Book Content File</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.epub"
            onChange={handleFileUpload}
            className="hidden"
          />
          {form.private_file_path ? (
            <div className="flex items-center justify-between rounded-lg border border-accent-200 bg-accent-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
                  <FileText className="h-5 w-5 text-accent-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-900">Book file uploaded</p>
                  <p className="text-xs text-ink-500">{form.private_file_path.split('/').pop()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('private_file_path', '')}
                className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-200 bg-ink-50 py-10 transition-colors hover:border-ink-300 hover:bg-ink-100 disabled:opacity-50"
            >
              {uploadingFile ? (
                <><Loader2 className="h-8 w-8 animate-spin text-ink-400" /><p className="mt-2 text-sm text-ink-500">Uploading...</p></>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-ink-400" strokeWidth={1} />
                  <p className="mt-2 text-sm text-ink-600">Click to upload book file</p>
                  <p className="mt-1 text-xs text-ink-400">PDF or EPUB, up to 50MB</p>
                </>
              )}
            </button>
          )}
        </div>

        {/* Pricing & Details */}
        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="font-serif text-lg text-ink-900 mb-4">Pricing & Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Price (in cents) *</label>
              <input
                type="number"
                required
                min="0"
                value={form.price_cents}
                onChange={(e) => handleChange('price_cents', Number(e.target.value))}
                className="input-field"
                placeholder="e.g. 4900 for $49.00"
              />
            </div>
            <div>
              <label className="label-field">Pages</label>
              <input
                type="number"
                min="0"
                value={form.pages}
                onChange={(e) => handleChange('pages', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Language</label>
              <input
                type="text"
                value={form.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Format</label>
              <input
                type="text"
                value={form.format}
                onChange={(e) => handleChange('format', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Publication Date</label>
              <input
                type="date"
                value={form.publication_date}
                onChange={(e) => handleChange('publication_date', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="font-serif text-lg text-ink-900 mb-4">Book Content</h2>
          <div className="space-y-4">
            <div>
              <label className="label-field">About the Author</label>
              <textarea
                rows={3}
                value={form.author_bio}
                onChange={(e) => handleChange('author_bio', e.target.value)}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="label-field">What You'll Learn (one per line)</label>
              <textarea
                rows={5}
                value={form.what_you_learn}
                onChange={(e) => handleChange('what_you_learn', e.target.value)}
                className="input-field resize-none"
                placeholder="Understanding attention mechanisms&#10;Building transformers from scratch"
              />
            </div>
            <div>
              <label className="label-field">Who This Book Is For</label>
              <textarea
                rows={2}
                value={form.who_for}
                onChange={(e) => handleChange('who_for', e.target.value)}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="label-field">Table of Contents (JSON)</label>
              <textarea
                rows={8}
                value={form.table_of_contents}
                onChange={(e) => handleChange('table_of_contents', e.target.value)}
                className="input-field resize-none font-mono text-xs"
                placeholder='[{"title":"Chapter 1","sections":["Section A","Section B"]}]'
              />
            </div>
            <div>
              <label className="label-field">FAQs (JSON)</label>
              <textarea
                rows={6}
                value={form.faqs}
                onChange={(e) => handleChange('faqs', e.target.value)}
                className="input-field resize-none font-mono text-xs"
                placeholder='[{"question":"How do I access the book?","answer":"Through our secure reader."}]'
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="font-serif text-lg text-ink-900 mb-4">Publication Status</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => handleChange('featured', e.target.checked)}
                className="h-4 w-4 rounded accent-ink-900"
              />
              <span className="text-sm text-ink-700">Feature this book on the homepage</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => handleChange('published', e.target.checked)}
                className="h-4 w-4 rounded accent-ink-900"
              />
              <span className="text-sm text-ink-700">Publish (make visible to customers)</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-6">
          <Link to="/admin/books" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> {isEdit ? 'Update Book' : 'Create Book'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
