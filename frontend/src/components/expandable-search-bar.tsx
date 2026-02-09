'use client';

import React, { useEffect, useRef, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ExpandableSearchBarProps = {
  expandDirection?: 'left' | 'right';
  placeholder?: string;
  onSearch?: (query: string) => void;
  onQueryChange?: (query: string) => void;
  results?: { id: string; title: string }[];
  className?: string;
  defaultOpen?: boolean;
  width?: number;
};

const COLLAPSED_SIZE = 40;

export default function ExpandableSearchBar(props: ExpandableSearchBarProps) {
  const {
    expandDirection = 'right',
    placeholder = 'Search...',
    onSearch,
    onQueryChange,
    results = [],
    className = '',
    defaultOpen = false,
    width = 280,
  } = props;

  const [open, setOpen] = useState(defaultOpen);
  const [value, setValue] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const inputPadding = expandDirection === 'right' ? 'pl-11' : 'pl-10';
  const placeholderLeft = expandDirection === 'right' ? 'left-11' : 'left-10';

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        !containerRef.current?.contains(e.target as Node) &&
        open &&
        value === ''
      ) {
        setOpen(false);
        setValue('');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, value]);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(id);
    } else {
      setValue('');
      if (onQueryChange) onQueryChange('');
    }
  }, [open, onQueryChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onQueryChange) onQueryChange(newValue);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setValue('');
        if (onQueryChange) onQueryChange('');
      }

      if (e.key === 'Enter' && open && value.trim()) {
        onSearch?.(value);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, value, onSearch, onQueryChange]);

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block', className)}
      style={{ width: COLLAPSED_SIZE, height: COLLAPSED_SIZE }}
    >
      {/* Icon button (always visible, overlays left of bar) */}
      <button
        type='button'
        aria-label={open ? 'Close search' : 'Open search'}
        onClick={() => setOpen((s) => !s)}
        className={cn(
          'absolute inset-0 z-20 grid place-items-center rounded-full border',
          'bg-secondary text-foreground/80 hover:text-foreground transition-colors',
          'dark:bg-secondary dark:text-foreground/80 dark:hover:text-foreground'
        )}
      >
        {open ? <X className='size-4' /> : <Search className='size-4' />}
      </button>

      <AnimatePresence>
        {open && (
          <div className={cn(
            'absolute top-0 z-10',
            expandDirection === 'left' ? 'right-0' : 'left-0'
          )}>
            <motion.form
              key='form'
              onSubmit={handleSubmit}
              className={cn(
                'h-10 rounded-full border bg-background text-foreground shadow-sm overflow-hidden flex items-center relative z-20',
              )}
              style={{ width: width }}
              initial={{ width: COLLAPSED_SIZE, opacity: 0.98 }}
              animate={{ width: width, opacity: 1 }}
              exit={{
                width: COLLAPSED_SIZE,
                opacity: 0,
                transition: { type: 'spring', stiffness: 260, damping: 26 },
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              {/* Absolutely positioned left search icon */}
              <span className='absolute left-3 z-10 text-muted-foreground'>
                <Search className='size-4' />
              </span>

              <div className='relative flex-1 min-w-0 flex items-center h-full'>
                <input
                  ref={inputRef}
                  type='text'
                  value={value}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={cn(
                    'w-full bg-transparent text-sm outline-none placeholder-transparent h-full flex items-center',
                    inputPadding
                  )}
                />

                <AnimatePresence>
                  {open && !value && (
                    <motion.span
                      key='ph'
                      className={cn(
                        'pointer-events-none absolute w-full truncate text-muted-foreground/80 text-sm select-none text-left flex items-center h-full top-0',
                        placeholderLeft
                      )}
                      initial={{ opacity: 1, x: 0 }}
                      animate={{ opacity: 0.9, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {placeholder}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.button
                    key='go'
                    type='submit'
                    className='h-10 w-10 grid place-items-center text-muted-foreground hover:text-foreground'
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    aria-label='Search'
                  >
                    <Search className='size-4' />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.form>

            {/* Dropdown Results */}
            <AnimatePresence>
              {results && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-12 left-0 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden py-2"
                >
                  {results.map((book) => (
                    <div key={book.id} className="px-4 py-2 hover:bg-muted cursor-pointer transition-colors text-sm">
                      {book.title}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
