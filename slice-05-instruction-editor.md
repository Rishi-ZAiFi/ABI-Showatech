# Slice 05 — Instruction Editor

> Status: ✅ Done (initial) · ✅ Post-POC improvements applied 2026-06-09

---

## Objective

Replace the plain `<textarea>` step instruction field with a rich-text editor so technical authors can write structured, formatted work instructions (bold, italic, lists) that render correctly in the AR preview.

---

## Implementation

### Component

`src/components/workflow/InstructionEditor.tsx`

Built on **Tiptap v3** (`@tiptap/react` + `@tiptap/starter-kit`).

Stores content as an **HTML string** — matches the `Step.instruction: string` field in the domain model so no serialisation layer is needed.

### Enabled formatting

| Feature | Shortcut |
|---------|----------|
| Bold | Ctrl+B |
| Italic | Ctrl+I |
| Bullet list | Toolbar |
| Ordered list | Toolbar |
| Undo | Ctrl+Z |
| Redo | Ctrl+Shift+Z |

Disabled extensions (explicitly off in `StarterKit.configure`): `blockquote`, `codeBlock`, `horizontalRule`, `heading`.

Headings are disabled in the initial slice; see roadmap for a planned H3 addition.

### Toolbar

Custom `ToolbarButton` wrapper uses `onMouseDown + e.preventDefault()` (not `onClick`) to prevent the editor from losing focus when a toolbar button is clicked.

### Integration

Used in `StepEditor` (inside `WorkflowPanel.tsx`):

```tsx
<InstructionEditor
  key={stepId}          // remounts Tiptap instance when active step changes
  value={step.instruction}
  onChange={(html) => updateStep(stepId, { instruction: html })}
/>
```

`key={stepId}` is required — Tiptap's `content` prop is not reactive after mount, so the component must be remounted to load a different step's content.

---

## Post-POC Improvements (2026-06-09)

Three issues identified during POC review and resolved:

### 1. Placeholder — replaced custom overlay with Tiptap extension

**Problem:** The original implementation used an `absolute`-positioned `<div>` overlay to show placeholder text, conditional on `editor.isEmpty && !editor.isFocused`. This is fragile — it can flicker on focus transitions and diverges from Tiptap's own state machine.

**Fix:** Installed `@tiptap/extension-placeholder` and configured it in the extension list:

```ts
Placeholder.configure({ placeholder })
```

Added a CSS rule in `src/index.css` that renders the placeholder via `::before` using the theme's `--muted-foreground` CSS variable:

```css
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--muted-foreground);
  pointer-events: none;
  height: 0;
  font-style: italic;
}
```

The manual overlay div and its conditional render were removed entirely.

---

### 2. Word/character counter

**Problem:** No feedback on instruction length. AR display surfaces (headsets, tablets) have constrained text areas — authors had no signal that they were writing too much.

**Fix:** Added a footer strip below the editor content area showing a live word and character count:

```
12 words · 78 chars
```

Implementation:

- `countStats(text)` helper splits plain text on whitespace for word count and reads `.length` for chars.
- `useState<{ words, chars }>` initialised from the incoming `value` prop so the count is correct on first render.
- `setStats(countStats(editor.getText()))` called inside `onUpdate` so the counter updates on every keystroke.

```tsx
<div className="flex justify-end px-2 py-0.5 border-t border-border/40 bg-muted/10">
  <span className="text-[10px] text-muted-foreground tabular-nums">
    {stats.words} {stats.words === 1 ? 'word' : 'words'} · {stats.chars} chars
  </span>
</div>
```

---

### 3. Theme fix — prose-invert conditioned on dark mode

**Problem:** `prose-invert` was hardcoded on the editor's ProseMirror element. In light mode (the app has a working theme switcher) this made all editor text unreadable — white text on a white background.

**Fix:**

- `useTheme()` from `next-themes` provides `resolvedTheme`.
- `editorClass(isDark: boolean)` helper builds the className string, including `prose-invert` only when `isDark === true`.
- Because `editorProps.attributes.class` is set once at Tiptap init and is not reactive, a `useEffect` calls `editor.setOptions()` whenever `resolvedTheme` changes:

```ts
useEffect(() => {
  editor?.setOptions({ editorProps: { attributes: { class: editorClass(isDark) } } });
}, [isDark, editor]);
```

This ensures the editor class updates immediately when the user toggles the theme without remounting.

---

## Files changed

| File | Change |
|------|--------|
| `src/components/workflow/InstructionEditor.tsx` | All three improvements above |
| `src/index.css` | Added Tiptap placeholder `::before` rule |
| `package.json` / `package-lock.json` | Added `@tiptap/extension-placeholder` |
