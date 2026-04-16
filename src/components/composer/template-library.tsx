'use client';

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  FileText,
  Copy,
  Check,
  BookOpen,
  Megaphone,
  GraduationCap,
  MessageCircle,
  Bell,
  X,
  Camera,
  Users,
  Quote,
} from 'lucide-react';
import { PLATFORMS, type PlatformKey } from '@/lib/constants';

// --- Types ---

interface Template {
  id: string;
  name: string;
  category: string;
  platform: string | null;
  content: string;
  variables: string[];
}

interface TemplateLibraryProps {
  onApplyTemplate: (content: string) => void;
}

// --- Constants ---

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'educational', label: 'Educational' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'announcement', label: 'Announcement' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  promotion: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  educational: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  engagement: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  announcement: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  'behind-scenes': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  'user-generated': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  testimonial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'how-to': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
};

const CATEGORY_LABELS: Record<string, string> = {
  promotion: 'Promotion',
  educational: 'Educational',
  engagement: 'Engagement',
  announcement: 'Announcement',
  'behind-scenes': 'Behind the Scenes',
  'user-generated': 'User Generated',
  testimonial: 'Testimonial',
  'how-to': 'How-To Guide',
};

// --- Helpers ---

function getCategoryIcon(category: string) {
  const iconMap: Record<string, React.ReactNode> = {
    promotion: <Megaphone className="size-3" />,
    educational: <GraduationCap className="size-3" />,
    engagement: <MessageCircle className="size-3" />,
    announcement: <Bell className="size-3" />,
    'behind-scenes': <Camera className="size-3" />,
    'user-generated': <Users className="size-3" />,
    testimonial: <Quote className="size-3" />,
    'how-to': <BookOpen className="size-3" />,
  };
  return iconMap[category] || null;
}

function highlightVariables(text: string, maxLength?: number) {
  const content = maxLength ? text.substring(0, maxLength) : text;
  const parts = content.split(/(\{[\w]+\})/g);
  return (
    <Fragment>
      {parts.map((part, i) => {
        if (/^\{[\w]+\}$/.test(part)) {
          return (
            <span
              key={i}
              className="text-violet-600 dark:text-violet-400 font-semibold bg-violet-50 dark:bg-violet-950/40 px-0.5 rounded-sm"
            >
              {part}
            </span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </Fragment>
  );
}

// --- Component ---

export function TemplateLibrary({ onApplyTemplate }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data.success && data.data?.templates) {
          setTemplates(data.data.templates);
        }
      } catch {
        toast.error('Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory =
        activeCategory === 'all' || t.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, activeCategory, searchQuery]);

  // Apply selected template to composer
  const handleUseTemplate = useCallback(() => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate.content);
      toast.success(`Template "${selectedTemplate.name}" applied!`);
      setSelectedTemplate(null);
    }
  }, [selectedTemplate, onApplyTemplate]);

  // Copy template content to clipboard
  const handleCopy = useCallback(async () => {
    if (selectedTemplate) {
      try {
        await navigator.clipboard.writeText(selectedTemplate.content);
        setIsCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
      } catch {
        toast.error('Failed to copy');
      }
    }
  }, [selectedTemplate]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="size-4 text-amber-500" />
          Template Library
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm h-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                border transition-all duration-200 cursor-pointer
                ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50'
                }
              `}
            >
              {cat.id !== 'all' && getCategoryIcon(cat.id)}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template count info */}
        <p className="text-xs text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          {searchQuery && (
            <span> matching &quot;{searchQuery}&quot;</span>
          )}
        </p>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || activeCategory !== 'all'
                ? 'No templates match your filters'
                : 'No templates available'}
            </p>
            {(searchQuery || activeCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="text-xs text-primary hover:underline mt-1 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          /* Template cards list */
          <ScrollArea className="max-h-[400px]">
            <div className="flex flex-col gap-3 pr-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  {/* Header row: name + platform badge */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                      {template.name}
                    </h4>
                    {template.platform &&
                      PLATFORMS[template.platform as PlatformKey] && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                          style={{
                            backgroundColor:
                              PLATFORMS[template.platform as PlatformKey].color +
                              '20',
                            color:
                              PLATFORMS[template.platform as PlatformKey].color,
                          }}
                        >
                          {PLATFORMS[template.platform as PlatformKey].name}
                        </Badge>
                      )}
                  </div>

                  {/* Category badge + variable count */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${CATEGORY_COLORS[template.category] || 'bg-muted text-muted-foreground'}`}
                    >
                      {getCategoryIcon(template.category)}
                      {CATEGORY_LABELS[template.category] || template.category}
                    </Badge>
                    {template.variables && template.variables.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {template.variables.length} variable
                        {template.variables.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Content preview with highlighted variables */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {highlightVariables(template.content, 120)}
                    {template.content.length > 120 && (
                      <span className="text-muted-foreground/60">...</span>
                    )}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Template Detail Dialog */}
      <Dialog
        open={!!selectedTemplate}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
      >
        {selectedTemplate && (
          <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg">
                  {selectedTemplate.name}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {selectedTemplate.platform &&
                  PLATFORMS[selectedTemplate.platform as PlatformKey] && (
                    <Badge
                      variant="secondary"
                      className="text-[10px]"
                      style={{
                        backgroundColor:
                          PLATFORMS[selectedTemplate.platform as PlatformKey]
                            .color + '20',
                        color:
                          PLATFORMS[selectedTemplate.platform as PlatformKey]
                            .color,
                      }}
                    >
                      {PLATFORMS[selectedTemplate.platform as PlatformKey].name}
                    </Badge>
                  )}
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${CATEGORY_COLORS[selectedTemplate.category] || ''}`}
                >
                  {getCategoryIcon(selectedTemplate.category)}
                  {CATEGORY_LABELS[selectedTemplate.category] ||
                    selectedTemplate.category}
                </Badge>
              </div>
              <DialogDescription className="mt-1">
                {selectedTemplate.variables &&
                selectedTemplate.variables.length > 0 ? (
                  <>
                    Contains{' '}
                    {selectedTemplate.variables.length} customizable variable
                    {selectedTemplate.variables.length !== 1 ? 's' : ''}:{' '}
                    <span className="font-medium text-foreground">
                      {selectedTemplate.variables
                        .map((v) => `{${v}}`)
                        .join(', ')}
                    </span>
                  </>
                ) : (
                  'Ready-to-use template with no variables'
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Full content preview with highlighted variables */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="rounded-lg border bg-muted/30 p-4 mb-2">
                <pre className="text-sm whitespace-pre-wrap leading-relaxed font-[inherit]">
                  {highlightVariables(selectedTemplate.content)}
                </pre>
              </div>

              {/* Variable quick reference */}
              {selectedTemplate.variables &&
                selectedTemplate.variables.length > 0 && (
                  <div className="rounded-lg border p-3 mb-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Variables to customize:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplate.variables.map((v) => (
                        <code
                          key={v}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                        >
                          {`{${v}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
            </ScrollArea>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {isCopied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                size="sm"
                onClick={handleUseTemplate}
                className="gap-1.5"
              >
                <FileText className="size-3.5" />
                Use Template
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
