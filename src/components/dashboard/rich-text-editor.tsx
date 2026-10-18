'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

const tools = [
  { label: 'B', title: 'Bold', command: 'bold', className: 'font-bold' },
  { label: 'I', title: 'Italic', command: 'italic', className: 'italic' },
  { label: 'U', title: 'Underline', command: 'underline', className: 'underline' },
  { label: 'H2', title: 'Heading', command: 'formatBlock', value: 'H2' },
  { label: 'H3', title: 'Subheading', command: 'formatBlock', value: 'H3' },
  { label: 'Bullets', title: 'Bulleted list', command: 'insertUnorderedList' },
  { label: 'Numbers', title: 'Numbered list', command: 'insertOrderedList' },
];

export function RichTextEditor({
  name,
  defaultValue = '',
  placeholder = 'Write the course description...',
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function sync() {
    if (inputRef.current && editorRef.current) {
      inputRef.current.value = editorRef.current.innerHTML;
    }
  }

  function run(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function addLink() {
    const url = window.prompt('Link URL');
    if (!url) return;
    run('createLink', url);
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 p-1.5">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(tool.command, tool.value)}
            className={cn(
              'min-h-8 rounded-md px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900',
              tool.className,
            )}
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          title="Link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={addLink}
          className="min-h-8 rounded-md px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Link
        </button>
        <button
          type="button"
          title="Clear formatting"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => run('removeFormat')}
          className="min-h-8 rounded-md px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        onInput={sync}
        onBlur={sync}
        className="rich-text min-h-40 px-3 py-2 text-sm outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
        dangerouslySetInnerHTML={{ __html: defaultValue }}
      />
      <input ref={inputRef} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}
