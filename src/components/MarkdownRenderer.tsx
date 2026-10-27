import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

export function MarkdownRenderer({ content }: { content: string }) {
  const sections = useMemo(() => {
    if (!content) return [];
    return content.split('\n');
  }, [content]);

  return (
    <div className="space-y-2 text-slate-200 text-sm leading-relaxed">
      {sections.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // H1 Title
        if (trimmed.startsWith('# ')) {
          return (
            <h2
              key={idx}
              className="text-xl font-black text-white pt-2 pb-1 border-b border-slate-800 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>{trimmed.replace(/^#\s+/, '')}</span>
            </h2>
          );
        }

        // H3 Subheaders (A. B. C. D. E.)
        if (trimmed.startsWith('### ')) {
          return (
            <div key={idx} className="pt-3 pb-1">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{trimmed.replace(/^###\s+/, '')}</span>
              </h3>
            </div>
          );
        }

        // Horizontal line
        if (trimmed === '---') {
          return <hr key={idx} className="border-slate-800/80 my-3" />;
        }

        // Unordered list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listText = trimmed.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
              <div
                className="text-slate-300 text-xs sm:text-sm"
                dangerouslySetInnerHTML={{
                  __html: listText
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="text-amber-300">$1</em>'),
                }}
              />
            </div>
          );
        }

        // Regular paragraph with bold support
        return (
          <p
            key={idx}
            className="text-slate-300 text-xs sm:text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-amber-300">$1</em>'),
            }}
          />
        );
      })}
    </div>
  );
}
