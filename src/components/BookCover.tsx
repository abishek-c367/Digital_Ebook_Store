import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  coverUrl: string | null;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-24',
  md: 'w-40',
  lg: 'w-56',
  xl: 'w-72',
};

export function BookCover({ coverUrl, title, size = 'md', className = '' }: BookCoverProps) {
  return (
    <div
      className={`relative ${sizeClasses[size]} aspect-[2/3] flex-shrink-0 overflow-hidden rounded-lg shadow-book ${className}`}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-ink-200 p-4 text-center">
          <BookOpen className="mb-2 h-8 w-8 text-ink-400" strokeWidth={1} />
          <span className="font-serif text-sm text-ink-500">{title}</span>
        </div>
      )}
    </div>
  );
}
