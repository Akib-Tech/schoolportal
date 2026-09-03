import './typingIndicator.css'

/** WhatsApp-style animated "… is typing" row shown at the foot of a thread. */
export default function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="typing-indicator" aria-live="polite">
      <span className="typing-indicator-dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span className="typing-indicator-label">{name} is typing…</span>
    </div>
  )
}
