/**
 * InstructionEditor — Slice 05
 *
 * Rich-text editor for step instructions, built on Tiptap + StarterKit.
 * Stores content as an HTML string (matches Step.instruction: string).
 *
 * Features: Bold · Italic · Bullet list · Ordered list · Undo · Redo
 *
 * Usage:
 *   <InstructionEditor value={step.instruction} onChange={html => updateStep(id, { instruction: html })} />
 *
 * Remount with key={stepId} from the parent to reset editor content when the
 * active step changes.
 */

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useTheme } from 'next-themes';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent the editor from losing focus on toolbar click
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`p-1 rounded transition-colors ${
        active
          ? 'bg-sky-500/20 text-sky-400'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
      } disabled:opacity-30 disabled:cursor-default`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// InstructionEditor
// ---------------------------------------------------------------------------

interface InstructionEditorProps {
  /** HTML string — initial content */
  value: string;
  /** Called with updated HTML whenever the editor content changes */
  onChange: (html: string) => void;
  placeholder?: string;
}

function editorClass(isDark: boolean) {
  return [
    'min-h-[96px] px-3 py-2 text-xs text-foreground',
    'focus:outline-none',
    'prose prose-xs max-w-none',
    isDark ? 'prose-invert' : '',
    '[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
    '[&_li]:my-0.5',
    '[&_strong]:font-semibold',
    '[&_em]:italic',
    '[&_p]:my-0 [&_p+p]:mt-1',
  ].join(' ');
}

function countStats(text: string) {
  const chars = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  return { chars, words };
}

export function InstructionEditor({
  value,
  onChange,
  placeholder = 'Describe what the technician should do…',
}: InstructionEditorProps) {
  const [stats, setStats] = useState(() => countStats(value ?? ''));
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions not needed in the sidebar
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        heading: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate({ editor }) {
      // Emit empty string instead of Tiptap's empty-doc HTML
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange(html);
      setStats(countStats(editor.getText()));
    },
    editorProps: {
      attributes: {
        class: editorClass(isDark),
      },
    },
  });

  // Keep editor class in sync when theme toggles
  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes: { class: editorClass(isDark) } } });
  }, [isDark, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border/50 bg-muted/20">
        <ToolbarButton
          title="Bold (Ctrl+B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          title="Italic (Ctrl+I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 bg-border/50 mx-1" />

        <ToolbarButton
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 bg-border/50 mx-1" />

        <ToolbarButton
          title="Undo (Ctrl+Z)"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarButton
          title="Redo (Ctrl+Shift+Z)"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor content area */}
      <EditorContent editor={editor} />

      {/* Word / char counter footer */}
      <div className="flex justify-end px-2 py-0.5 border-t border-border/40 bg-muted/10">
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {stats.words} {stats.words === 1 ? 'word' : 'words'} · {stats.chars} chars
        </span>
      </div>
    </div>
  );
}
