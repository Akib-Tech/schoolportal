import { Link } from 'react-router-dom'
import './chatWidgetButton.css'

export default function ChatWidgetButton() {
  return (
    <Link to="/chat" className="chat-widget-btn" aria-label="Chat with customer care">
      <svg width="26" height="26"><use href="/icons.svg#chat-icon" /></svg>
      <span className="chat-widget-btn-label">Need help?</span>
    </Link>
  )
}
