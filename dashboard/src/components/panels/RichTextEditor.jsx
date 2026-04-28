import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useEffect, useState } from 'react'
import { MediaLibraryModal } from './BlocchiEditor'

const btn = (active) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)',
  background: active ? 'var(--accent)' : 'transparent',
  color: active ? '#fff' : 'var(--text2)',
  borderColor: active ? 'var(--accent)' : 'var(--border)',
  cursor: 'pointer', fontSize: '0.78rem',
  fontFamily: 'var(--font-body)', lineHeight: 1,
  transition: 'background 0.1s, color 0.1s',
})

const sep = { width: 1, background: 'var(--border)', margin: '0 2px', alignSelf: 'stretch' }

export default function RichTextEditor({ value, onChange }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [mediaOpen, setMediaOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ HTMLAttributes: { class: 'rich-text-img' } }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) editor.commands.setContent(value || '', false)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null

  const e = editor

  function openLinkDialog() {
    const existing = e.getAttributes('link').href || ''
    setLinkUrl(existing)
    setLinkDialogOpen(true)
  }

  function applyLink() {
    if (!linkUrl.trim()) {
      e.chain().focus().unsetLink().run()
    } else {
      const href = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`
      e.chain().focus().setLink({ href }).run()
    }
    setLinkDialogOpen(false)
    setLinkUrl('')
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>

        {/* Headings */}
        <button type="button" title="Titolo H2" style={btn(e.isActive('heading', { level: 2 }))}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().toggleHeading({ level: 2 }).run() }}>H2</button>
        <button type="button" title="Titolo H3" style={btn(e.isActive('heading', { level: 3 }))}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().toggleHeading({ level: 3 }).run() }}>H3</button>

        <div style={sep} />

        {/* Stile testo */}
        <button type="button" title="Grassetto (⌘B)" style={btn(e.isActive('bold'))}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().toggleBold().run() }}><strong>B</strong></button>
        <button type="button" title="Corsivo (⌘I)" style={btn(e.isActive('italic'))}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().toggleItalic().run() }}><em>I</em></button>
        <button type="button" title="Sottolineato (⌘U)" style={{ ...btn(e.isActive('underline')), textDecoration: 'underline' }}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().toggleUnderline().run() }}>U</button>
        <button type="button" title="Barrato" style={{ ...btn(e.isActive('strike')), textDecoration: 'line-through' }}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().toggleStrike().run() }}>S</button>

        <div style={sep} />

        {/* Liste */}
        <button type="button" title="Lista puntata" style={btn(e.isActive('bulletList'))}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().toggleBulletList().run() }}>• —</button>
        <button type="button" title="Lista numerata" style={btn(e.isActive('orderedList'))}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().toggleOrderedList().run() }}>1. —</button>

        <div style={sep} />

        {/* Blockquote + HR */}
        <button type="button" title="Citazione" style={btn(e.isActive('blockquote'))}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().toggleBlockquote().run() }}>❝</button>
        <button type="button" title="Separatore orizzontale" style={btn(false)}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().setHorizontalRule().run() }}>—</button>

        <div style={sep} />

        {/* Link */}
        <button type="button" title="Inserisci link" style={btn(e.isActive('link'))}
          onMouseDown={ev => { ev.preventDefault(); openLinkDialog() }}>Link</button>

        {/* Immagine */}
        <button type="button" title="Inserisci immagine dalla libreria" style={btn(false)}
          onMouseDown={ev => { ev.preventDefault(); setMediaOpen(true) }}>Img</button>

        <div style={sep} />

        {/* Undo / Redo */}
        <button type="button" title="Annulla (⌘Z)" style={btn(false)}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().undo().run() }}>↩</button>
        <button type="button" title="Ripristina (⌘⇧Z)" style={btn(false)}
          onMouseDown={ev => { ev.preventDefault(); e.chain().focus().redo().run() }}>↪</button>
      </div>

      {/* Dialog link */}
      {linkDialogOpen && (
        <div style={{ display: 'flex', gap: 6, padding: '6px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', alignItems: 'center' }}>
          <input
            autoFocus
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setLinkDialogOpen(false) }}
            placeholder="https://..."
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: '0.82rem', color: 'var(--text)', background: 'var(--bg-input)', outline: 'none' }}
          />
          <button type="button" onClick={applyLink} style={{ ...btn(true), padding: '4px 10px' }}>OK</button>
          <button type="button" onClick={() => setLinkDialogOpen(false)} style={{ ...btn(false), padding: '4px 8px' }}>✕</button>
          {e.isActive('link') && (
            <button type="button" onClick={() => { e.chain().focus().unsetLink().run(); setLinkDialogOpen(false) }}
              style={{ ...btn(false), padding: '4px 8px', color: 'var(--danger, #e55)' }}>Rimuovi</button>
          )}
        </div>
      )}

      {/* Area testo */}
      <EditorContent
        editor={editor}
        style={{ padding: '10px 12px', minHeight: 120, fontSize: '0.88rem',
          color: 'var(--text)', background: 'var(--bg-input)', outline: 'none', lineHeight: 1.6 }}
      />

      <style>{`
        .tiptap { outline: none; }
        .tiptap h2 { font-size: 1.05rem; font-weight: 700; margin: 0.6em 0 0.25em; }
        .tiptap h3 { font-size: 0.95rem; font-weight: 700; margin: 0.5em 0 0.2em; }
        .tiptap h2:first-child, .tiptap h3:first-child { margin-top: 0; }
        .tiptap p  { margin: 0 0 0.4em; }
        .tiptap p:last-child { margin-bottom: 0; }
        .tiptap ul { padding-left: 1.2em; margin: 0.3em 0; list-style: disc; }
        .tiptap ol { padding-left: 1.2em; margin: 0.3em 0; list-style: decimal; }
        .tiptap li { margin-bottom: 0.15em; }
        .tiptap strong { font-weight: 700; }
        .tiptap em { font-style: italic; }
        .tiptap u { text-decoration: underline; }
        .tiptap s { text-decoration: line-through; }
        .tiptap a { color: var(--accent); text-decoration: underline; cursor: pointer; }
        .tiptap blockquote { border-left: 3px solid var(--border); margin: 0.4em 0; padding: 4px 12px; color: var(--text3); font-style: italic; }
        .tiptap hr { border: none; border-top: 1px solid var(--border); margin: 0.6em 0; }
        .tiptap img.rich-text-img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5em 0; display: block; }
        .tiptap img.rich-text-img.ProseMirror-selectednode { outline: 2px solid var(--accent); }
      `}</style>

      {mediaOpen && (
        <MediaLibraryModal
          onSelect={m => { e.chain().focus().setImage({ src: m.url, alt: m.alt || '' }).run(); setMediaOpen(false) }}
          onClose={() => setMediaOpen(false)}
        />
      )}
    </div>
  )
}
