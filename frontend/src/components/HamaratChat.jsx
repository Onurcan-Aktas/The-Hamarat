import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { chatAPI } from '../api/axios'
import useAuthStore from '../store/authStore'
import useVoice from '../hooks/useVoice'

const VOICE_PREF_KEY = 'hamarat-voice-enabled'

export default function HamaratChat({ recipeId, recipeTitle, onClose }) {
  const { isAuthenticated } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(VOICE_PREF_KEY) === 'true'
  })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const autoSendRef = useRef(false) // flag: next final result should auto-send

  // Conversation mode = hands-free loop: listen → send → speak → listen again
  const [conversationMode, setConversationMode] = useState(false)
  const conversationModeRef = useRef(false)
  useEffect(() => { conversationModeRef.current = conversationMode }, [conversationMode])

  // ── Voice hook ─────────────────────────────────────────────────────────────
  // We use refs (via hook callbacks) so we can kick off sending as soon as the
  // user stops talking, without needing to rebuild the recognizer each render.
  const voice = useVoice({
    lang: 'en-US',
    onInterimResult: (text) => {
      // Show the live transcript inside the text field
      setInput(text)
    },
    onFinalResult: (text) => {
      setInput(text)
      // Auto-send when dictating (first mic press) or in conversation mode
      if (autoSendRef.current || conversationModeRef.current) {
        autoSendRef.current = false
        // send in next tick so the input value is committed first
        setTimeout(() => sendMessage(text), 50)
      }
    },
    onSpeakEnd: () => {
      // Natural end of AI playback — re-open the mic if we're still looping.
      // Tiny delay lets Chrome fully release the audio pipeline before we
      // start recognition again (otherwise it sometimes captures the tail).
      if (conversationModeRef.current) {
        setTimeout(() => {
          if (conversationModeRef.current) voice.startListening()
        }, 350)
      }
    },
    onError: (err) => {
      // 'no-speech' is common when the user pauses too long; in conversation
      // mode we just wait for them to try again instead of breaking the loop.
      if (err === 'no-speech' && conversationModeRef.current) {
        setTimeout(() => {
          if (conversationModeRef.current && !voice.listening && !voice.speaking) {
            voice.startListening()
          }
        }, 400)
        return
      }
      if (err && err !== 'no-speech' && err !== 'aborted') {
        setError('Microphone error: ' + err)
        setConversationMode(false)
      }
    },
  })

  // Persist voice preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VOICE_PREF_KEY, String(voiceEnabled))
    }
    // Turning voice off should immediately silence any speech in progress
    if (!voiceEnabled) voice.stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled])

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Load existing session on open
  useEffect(() => {
    if (!isAuthenticated) { setLoadingHistory(false); return }
    const loadSession = async () => {
      try {
        const { data } = await chatAPI.getSession(recipeId)
        if (data.messagesHistory?.length > 0) {
          setMessages(
            data.messagesHistory.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
            }))
          )
        } else {
          setMessages([{
            role: 'model',
            content: `Hello! I'm **Hamarat**, your personal sous-chef for *${recipeTitle}*.\n\nI know this recipe inside out — I can guide you step-by-step, answer your questions, adjust portions for more or fewer people, or suggest substitutions. How can I help you cook today?`,
            timestamp: new Date().toISOString(),
          }])
        }
      } catch {
        setMessages([{
          role: 'model',
          content: `Hello! I'm **Hamarat**, ready to help you cook *${recipeTitle}*. Ask me anything about this recipe!`,
          timestamp: new Date().toISOString(),
        }])
      } finally {
        setLoadingHistory(false)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
    loadSession()
  }, [recipeId, isAuthenticated])

  // Stop voice activity when the chat is unmounted (detail page does this via
  // conditional mount, but we also clean up explicitly).
  useEffect(() => {
    return () => {
      voice.stopListening()
      voice.stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    const userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const { data } = await chatAPI.sendMessage(recipeId, { message: text })
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: data.reply, timestamp: new Date().toISOString() },
      ])
      // Read the reply aloud when either (a) the speaker toggle is on, or
      // (b) we're in hands-free conversation mode (always speaks).
      if ((voiceEnabled || conversationModeRef.current) && data.reply) {
        voice.speak(data.reply)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get a response. Please try again.')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = async () => {
    if (!confirm('Clear this conversation? This cannot be undone.')) return
    try {
      setConversationMode(false)
      voice.stopListening()
      voice.stopSpeaking()
      await chatAPI.clearSession(recipeId)
      setMessages([{
        role: 'model',
        content: `Fresh start! I'm here to help you cook *${recipeTitle}*. What would you like to know?`,
        timestamp: new Date().toISOString(),
      }])
    } catch {
      alert('Could not clear chat session.')
    }
  }

  // Tapping the mic enters/exits hands-free conversation mode.
  // When ON: listen → auto-send → speak reply → auto-listen again, until OFF.
  const toggleMic = () => {
    if (conversationMode) {
      // Exit the loop
      setConversationMode(false)
      autoSendRef.current = false
      voice.stopListening()
      voice.stopSpeaking()
      return
    }
    // Enter the loop — the first mic click is our user-gesture, which
    // "unlocks" SpeechSynthesis for every subsequent automatic speak().
    setConversationMode(true)
    voice.stopSpeaking()
    autoSendRef.current = true
    voice.startListening()
  }

  const toggleSpeaker = () => {
    if (voice.speaking) {
      voice.stopSpeaking()
      return
    }
    setVoiceEnabled((v) => !v)
  }

  // Simple markdown-ish renderer for bold and italic
  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i}>{part.slice(1, -1)}</em>
      if (part === '\n')
        return <br key={i} />
      return part
    })
  }

  const lastModelIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'model') return i
    }
    return -1
  })()

  return (
    <div className="flex flex-col h-full bg-cream">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-bark text-cream border-b border-bark-light flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-clay flex items-center justify-center shadow-inner relative flex-shrink-0">
            <ChefHatIcon />
            {/* Speaking pulse dot */}
            {voice.speaking && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-sage border-2 border-bark animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold leading-none">Hamarat</h3>
            <p className="text-xs text-cream/60 mt-0.5 font-body truncate">
              {voice.speaking
                ? 'Speaking…'
                : voice.listening
                  ? 'Listening…'
                  : conversationMode
                    ? loading ? 'Thinking…' : 'Conversation active'
                    : `AI Sous-Chef · ${recipeTitle}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Voice / speaker toggle */}
          {voice.synthesisSupported && isAuthenticated && (
            <button
              onClick={toggleSpeaker}
              className={`p-2 rounded-lg transition-colors ${
                voice.speaking
                  ? 'text-sage bg-white/10'
                  : voiceEnabled
                    ? 'text-cream bg-white/10 hover:bg-white/15'
                    : 'text-cream/50 hover:text-cream hover:bg-white/10'
              }`}
              title={
                voice.speaking
                  ? 'Stop speaking'
                  : voiceEnabled
                    ? 'Voice responses on — click to mute'
                    : 'Voice responses off — click to enable'
              }
              aria-label="Toggle voice responses"
              aria-pressed={voiceEnabled}
            >
              {voice.speaking ? (
                <StopIcon />
              ) : voiceEnabled ? (
                <SpeakerOnIcon />
              ) : (
                <SpeakerOffIcon />
              )}
            </button>
          )}

          {isAuthenticated && messages.length > 1 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-white/10 transition-colors"
              title="Clear chat"
            >
              <ResetIcon />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-white/10 transition-colors"
            aria-label="Close chat"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {loadingHistory ? (
          <div className="flex justify-center pt-8">
            <div className="loading-dots"><span/><span/><span/></div>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-clay/15 flex items-center justify-center">
              <ChefHatIcon className="w-8 h-8 text-clay" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-bark">Meet Hamarat</p>
              <p className="text-sm text-bark-muted mt-1 leading-relaxed">
                Sign in to chat with your personal AI sous-chef. It knows this recipe and will guide you every step of the way.
              </p>
            </div>
            <Link to="/login" className="btn-primary text-sm">Sign in to cook</Link>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isSpeakingThis = voice.speaking && i === lastModelIdx
              return (
                <div
                  key={i}
                  className={`flex gap-2.5 animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  style={{ animationDelay: '0ms', animationFillMode: 'both' }}
                >
                  {/* Avatar */}
                  {msg.role === 'model' && (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 transition-colors ${
                      isSpeakingThis ? 'bg-sage' : 'bg-bark'
                    }`}>
                      <ChefHatIcon />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-clay text-cream rounded-tr-sm'
                        : `bg-white text-bark border rounded-tl-sm ${
                            isSpeakingThis ? 'border-sage ring-1 ring-sage/30' : 'border-smoke'
                          }`
                    }`}
                  >
                    {renderContent(msg.content)}

                    {isSpeakingThis && (
                      <div className="mt-2 flex items-center gap-2 text-sage text-[11px] font-medium border-t border-sage/20 pt-2">
                        <VoiceWave />
                        <span>Speaking…</span>
                        <button
                          onClick={voice.stopSpeaking}
                          className="ml-auto text-bark-muted hover:text-clay transition-colors"
                        >
                          Stop
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-bark flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ChefHatIcon />
                </div>
                <div className="bg-white border border-smoke px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="loading-dots"><span/><span/><span/></div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-clay/10 text-clay text-xs px-3 py-2 rounded-lg border border-clay/20">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Conversation / listening indicator */}
      {isAuthenticated && (conversationMode || voice.listening) && (
        <div
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 border-t text-xs font-medium transition-colors ${
            voice.speaking
              ? 'bg-sage/10 border-sage/20 text-sage'
              : 'bg-clay/10 border-clay/20 text-clay'
          }`}
        >
          {voice.listening ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-clay opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-clay" />
              </span>
              Listening… speak now. Pause when you&apos;re done.
            </>
          ) : voice.speaking ? (
            <>
              <VoiceWave />
              Hamarat is speaking… mic will re-open when it&apos;s done.
            </>
          ) : loading ? (
            <>
              <span className="loading-dots !w-6"><span/><span/><span/></span>
              Thinking about your question…
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-clay/70" />
              Conversation active · tap the mic to stop
            </>
          )}
          {conversationMode && (
            <button
              onClick={toggleMic}
              className="ml-auto underline decoration-dotted underline-offset-2 hover:opacity-80"
            >
              End conversation
            </button>
          )}
        </div>
      )}

      {/* Input */}
      {isAuthenticated && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-smoke bg-white">
          <div className="flex gap-2 items-end">
            {/* Microphone — toggles hands-free conversation mode */}
            {voice.recognitionSupported && (
              <button
                onClick={toggleMic}
                disabled={loadingHistory}
                className={`relative flex-shrink-0 rounded-xl p-2.5 border transition-all ${
                  conversationMode
                    ? 'bg-clay text-cream border-clay shadow-sm'
                    : 'bg-white text-bark-muted border-smoke-dark hover:text-clay hover:border-clay/40'
                } ${voice.listening ? 'scale-105' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  conversationMode
                    ? 'End conversation'
                    : 'Start a hands-free conversation'
                }
                aria-label="Toggle hands-free conversation"
                aria-pressed={conversationMode}
              >
                {conversationMode ? <MicActiveIcon /> : <MicIcon />}
                {conversationMode && (
                  <span className="absolute inset-0 rounded-xl border-2 border-clay/50 animate-ping pointer-events-none" />
                )}
              </button>
            )}

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                voice.listening
                  ? 'Listening… your words will appear here'
                  : 'Ask about a step, ingredient, or portion…'
              }
              rows={1}
              disabled={loading || loadingHistory}
              className="flex-1 input-field text-sm resize-none min-h-[40px] max-h-28 py-2.5 leading-relaxed"
              style={{ height: 'auto' }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary px-3 py-2.5 flex-shrink-0 rounded-xl"
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
          <p className="text-[10px] text-bark-muted mt-1.5 text-center">
            {voice.recognitionSupported
              ? conversationMode
                ? 'Hands-free mode · Hamarat listens, answers, and re-opens the mic automatically'
                : 'Enter to send · Shift+Enter for new line · Tap the mic for a hands-free chat'
              : 'Enter to send · Shift+Enter for new line'}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────
const ChefHatIcon = ({ className = 'w-4 h-4 text-cream' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 019.18 0A4 4 0 0118 13.87V21H6v-7.13z"/>
    <line x1="6" y1="17" x2="18" y2="17"/>
  </svg>
)
const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const ResetIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
  </svg>
)
const MicIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)
const MicActiveIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
  </svg>
)
const SpeakerOnIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 010 7.07"/>
    <path d="M19.07 4.93a10 10 0 010 14.14"/>
  </svg>
)
const SpeakerOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
)
const StopIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)
const VoiceWave = () => (
  <span className="inline-flex items-end gap-0.5 h-3">
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className="w-0.5 bg-sage rounded-full"
        style={{
          height: '100%',
          animation: `voiceWave 0.9s ease-in-out ${i * 0.12}s infinite`,
        }}
      />
    ))}
  </span>
)


// import { useState, useEffect, useRef } from 'react'
// import { Link } from 'react-router-dom'
// import { chatAPI } from '../api/axios'
// import useAuthStore from '../store/authStore'
// import useVoice from '../hooks/useVoice'

// const VOICE_PREF_KEY = 'hamarat-voice-enabled'

// export default function HamaratChat({ recipeId, recipeTitle, onClose }) {
//   const { isAuthenticated } = useAuthStore()
//   const [messages, setMessages] = useState([])
//   const [input, setInput] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [loadingHistory, setLoadingHistory] = useState(true)
//   const [error, setError] = useState('')
//   const [voiceEnabled, setVoiceEnabled] = useState(() => {
//     if (typeof window === 'undefined') return false
//     return window.localStorage.getItem(VOICE_PREF_KEY) === 'true'
//   })
//   const messagesEndRef = useRef(null)
//   const inputRef = useRef(null)
//   const autoSendRef = useRef(false) // flag: next final result should auto-send

//   // Conversation mode = hands-free loop: listen → send → speak → listen again
//   const [conversationMode, setConversationMode] = useState(false)
//   const conversationModeRef = useRef(false)
//   useEffect(() => { conversationModeRef.current = conversationMode }, [conversationMode])

//   // ── Voice hook ─────────────────────────────────────────────────────────────
//   const voice = useVoice({
//     lang: 'tr-TR', // Türkçe dil desteği için (isteğe bağlı eski en-US'i geri alabilirsin)
//     silenceTimeoutMs: 12000, // 12 saniye sessizlik kuralı
//     onInterimResult: (text) => {
//       // Show the live transcript inside the text field
//       setInput(text)
//     },
//     onFinalResult: (text) => {
//       setInput(text)
//       // Auto-send when dictating (first mic press) or in conversation mode
//       if (autoSendRef.current || conversationModeRef.current) {
//         autoSendRef.current = false
//         // send in next tick so the input value is committed first
//         setTimeout(() => sendMessage(text), 50)
//       }
//     },
//     onSpeakEnd: () => {
//       if (conversationModeRef.current) {
//         setTimeout(() => {
//           if (conversationModeRef.current) voice.startListening()
//         }, 350)
//       }
//     },
//     onError: (err) => {
//       if (err === 'no-speech' && conversationModeRef.current) {
//         setTimeout(() => {
//           if (conversationModeRef.current && !voice.listening && !voice.speaking) {
//             voice.startListening()
//           }
//         }, 400)
//         return
//       }
//       if (err && err !== 'no-speech' && err !== 'aborted') {
//         setError('Microphone error: ' + err)
//         setConversationMode(false)
//       }
//     },
//   })

//   // YENİ EKLENEN KISIM: Sessizlik zaman aşımı olduğunda UI'ı senkronize et
//   useEffect(() => {
//     // Eğer conversation mode aktifse AMA mikrofon ne dinliyor ne de yapay zeka konuşuyorsa
//     // (Bu durum, useVoice içindeki silenceTimeout dolup mikrofonu kapattığında gerçekleşir)
//     if (conversationMode && !voice.listening && !voice.speaking && !loading) {
//         // UI'daki mikrofon butonunu da normal haline döndür
//         console.log("UI Senkronizasyonu: Mikrofon sessizlikten dolayı kapandı, UI güncelleniyor.");
//         setConversationMode(false);
//     }
//   }, [voice.listening, voice.speaking, loading, conversationMode]);


//   // Persist voice preference
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       window.localStorage.setItem(VOICE_PREF_KEY, String(voiceEnabled))
//     }
//     if (!voiceEnabled) voice.stopSpeaking()
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [voiceEnabled])

//   // Scroll to bottom whenever messages update
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [messages, loading])

//   // Load existing session on open
//   useEffect(() => {
//     if (!isAuthenticated) { setLoadingHistory(false); return }
//     const loadSession = async () => {
//       try {
//         const { data } = await chatAPI.getSession(recipeId)
//         if (data.messagesHistory?.length > 0) {
//           setMessages(
//             data.messagesHistory.map((m) => ({
//               role: m.role,
//               content: m.content,
//               timestamp: m.timestamp,
//             }))
//           )
//         } else {
//           setMessages([{
//             role: 'model',
//             content: `Hello! I'm **Hamarat**, your personal sous-chef for *${recipeTitle}*.\n\nI know this recipe inside out — I can guide you step-by-step, answer your questions, adjust portions for more or fewer people, or suggest substitutions. How can I help you cook today?`,
//             timestamp: new Date().toISOString(),
//           }])
//         }
//       } catch {
//         setMessages([{
//           role: 'model',
//           content: `Hello! I'm **Hamarat**, ready to help you cook *${recipeTitle}*. Ask me anything about this recipe!`,
//           timestamp: new Date().toISOString(),
//         }])
//       } finally {
//         setLoadingHistory(false)
//         setTimeout(() => inputRef.current?.focus(), 100)
//       }
//     }
//     loadSession()
//   }, [recipeId, isAuthenticated])

//   useEffect(() => {
//     return () => {
//       voice.stopListening()
//       voice.stopSpeaking()
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   const sendMessage = async (overrideText) => {
//     const text = (overrideText ?? input).trim()
//     if (!text || loading) return

//     const userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() }
//     setMessages((prev) => [...prev, userMessage])
//     setInput('')
//     setLoading(true)
//     setError('')

//     try {
//       const { data } = await chatAPI.sendMessage(recipeId, { message: text })
//       setMessages((prev) => [
//         ...prev,
//         { role: 'model', content: data.reply, timestamp: new Date().toISOString() },
//       ])
//       if ((voiceEnabled || conversationModeRef.current) && data.reply) {
//         voice.speak(data.reply)
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to get a response. Please try again.')
//     } finally {
//       setLoading(false)
//       setTimeout(() => inputRef.current?.focus(), 50)
//     }
//   }

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault()
//       sendMessage()
//     }
//   }

//   const clearChat = async () => {
//     if (!confirm('Clear this conversation? This cannot be undone.')) return
//     try {
//       setConversationMode(false)
//       voice.stopListening()
//       voice.stopSpeaking()
//       await chatAPI.clearSession(recipeId)
//       setMessages([{
//         role: 'model',
//         content: `Fresh start! I'm here to help you cook *${recipeTitle}*. What would you like to know?`,
//         timestamp: new Date().toISOString(),
//       }])
//     } catch {
//       alert('Could not clear chat session.')
//     }
//   }

//   const toggleMic = () => {
//     if (conversationMode) {
//       setConversationMode(false)
//       autoSendRef.current = false
//       voice.stopListening()
//       voice.stopSpeaking()
//       return
//     }
//     setConversationMode(true)
//     voice.stopSpeaking()
//     autoSendRef.current = true
//     voice.startListening()
//   }

//   const toggleSpeaker = () => {
//     if (voice.speaking) {
//       voice.stopSpeaking()
//       return
//     }
//     setVoiceEnabled((v) => !v)
//   }

//   const renderContent = (text) => {
//     const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g)
//     return parts.map((part, i) => {
//       if (part.startsWith('**') && part.endsWith('**'))
//         return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
//       if (part.startsWith('*') && part.endsWith('*'))
//         return <em key={i}>{part.slice(1, -1)}</em>
//       if (part === '\n')
//         return <br key={i} />
//       return part
//     })
//   }

//   const lastModelIdx = (() => {
//     for (let i = messages.length - 1; i >= 0; i--) {
//       if (messages[i].role === 'model') return i
//     }
//     return -1
//   })()

//   return (
//     <div className="flex flex-col h-full bg-cream">
//       {/* Header */}
//       <div className="flex items-center justify-between px-4 py-3 bg-bark text-cream border-b border-bark-light flex-shrink-0">
//         <div className="flex items-center gap-3 min-w-0">
//           <div className="w-9 h-9 rounded-xl bg-clay flex items-center justify-center shadow-inner relative flex-shrink-0">
//             <ChefHatIcon />
//             {/* Speaking pulse dot */}
//             {voice.speaking && (
//               <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-sage border-2 border-bark animate-pulse" />
//             )}
//           </div>
//           <div className="min-w-0">
//             <h3 className="font-display text-base font-semibold leading-none">Hamarat</h3>
//             <p className="text-xs text-cream/60 mt-0.5 font-body truncate">
//               {voice.speaking
//                 ? 'Speaking…'
//                 : voice.listening
//                   ? 'Listening…'
//                   : conversationMode
//                     ? loading ? 'Thinking…' : 'Conversation active'
//                     : `AI Sous-Chef · ${recipeTitle}`}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-1 flex-shrink-0">
//           {voice.synthesisSupported && isAuthenticated && (
//             <button
//               onClick={toggleSpeaker}
//               className={`p-2 rounded-lg transition-colors ${
//                 voice.speaking
//                   ? 'text-sage bg-white/10'
//                   : voiceEnabled
//                     ? 'text-cream bg-white/10 hover:bg-white/15'
//                     : 'text-cream/50 hover:text-cream hover:bg-white/10'
//               }`}
//               title={
//                 voice.speaking
//                   ? 'Stop speaking'
//                   : voiceEnabled
//                     ? 'Voice responses on — click to mute'
//                     : 'Voice responses off — click to enable'
//               }
//               aria-label="Toggle voice responses"
//               aria-pressed={voiceEnabled}
//             >
//               {voice.speaking ? (
//                 <StopIcon />
//               ) : voiceEnabled ? (
//                 <SpeakerOnIcon />
//               ) : (
//                 <SpeakerOffIcon />
//               )}
//             </button>
//           )}

//           {isAuthenticated && messages.length > 1 && (
//             <button
//               onClick={clearChat}
//               className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-white/10 transition-colors"
//               title="Clear chat"
//             >
//               <ResetIcon />
//             </button>
//           )}
//           <button
//             onClick={onClose}
//             className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-white/10 transition-colors"
//             aria-label="Close chat"
//           >
//             <CloseIcon />
//           </button>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
//         {loadingHistory ? (
//           <div className="flex justify-center pt-8">
//             <div className="loading-dots"><span/><span/><span/></div>
//           </div>
//         ) : !isAuthenticated ? (
//           <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
//             <div className="w-16 h-16 rounded-2xl bg-clay/15 flex items-center justify-center">
//               <ChefHatIcon className="w-8 h-8 text-clay" />
//             </div>
//             <div>
//               <p className="font-display text-lg font-semibold text-bark">Meet Hamarat</p>
//               <p className="text-sm text-bark-muted mt-1 leading-relaxed">
//                 Sign in to chat with your personal AI sous-chef. It knows this recipe and will guide you every step of the way.
//               </p>
//             </div>
//             <Link to="/login" className="btn-primary text-sm">Sign in to cook</Link>
//           </div>
//         ) : (
//           <>
//             {messages.map((msg, i) => {
//               const isSpeakingThis = voice.speaking && i === lastModelIdx
//               return (
//                 <div
//                   key={i}
//                   className={`flex gap-2.5 animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
//                   style={{ animationDelay: '0ms', animationFillMode: 'both' }}
//                 >
//                   {/* Avatar */}
//                   {msg.role === 'model' && (
//                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 transition-colors ${
//                       isSpeakingThis ? 'bg-sage' : 'bg-bark'
//                     }`}>
//                       <ChefHatIcon />
//                     </div>
//                   )}

//                   {/* Bubble */}
//                   <div
//                     className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
//                       msg.role === 'user'
//                         ? 'bg-clay text-cream rounded-tr-sm'
//                         : `bg-white text-bark border rounded-tl-sm ${
//                             isSpeakingThis ? 'border-sage ring-1 ring-sage/30' : 'border-smoke'
//                           }`
//                     }`}
//                   >
//                     {renderContent(msg.content)}

//                     {isSpeakingThis && (
//                       <div className="mt-2 flex items-center gap-2 text-sage text-[11px] font-medium border-t border-sage/20 pt-2">
//                         <VoiceWave />
//                         <span>Speaking…</span>
//                         <button
//                           onClick={voice.stopSpeaking}
//                           className="ml-auto text-bark-muted hover:text-clay transition-colors"
//                         >
//                           Stop
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )
//             })}

//             {/* Typing indicator */}
//             {loading && (
//               <div className="flex gap-2.5 animate-fade-in">
//                 <div className="w-8 h-8 rounded-xl bg-bark flex items-center justify-center flex-shrink-0 shadow-sm">
//                   <ChefHatIcon />
//                 </div>
//                 <div className="bg-white border border-smoke px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
//                   <div className="loading-dots"><span/><span/><span/></div>
//                 </div>
//               </div>
//             )}

//             {error && (
//               <div className="bg-clay/10 text-clay text-xs px-3 py-2 rounded-lg border border-clay/20">
//                 {error}
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </>
//         )}
//       </div>

//       {/* Conversation / listening indicator */}
//       {isAuthenticated && (conversationMode || voice.listening) && (
//         <div
//           className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 border-t text-xs font-medium transition-colors ${
//             voice.speaking
//               ? 'bg-sage/10 border-sage/20 text-sage'
//               : 'bg-clay/10 border-clay/20 text-clay'
//           }`}
//         >
//           {voice.listening ? (
//             <>
//               <span className="relative flex h-2.5 w-2.5">
//                 <span className="absolute inline-flex h-full w-full rounded-full bg-clay opacity-60 animate-ping" />
//                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-clay" />
//               </span>
//               Listening… speak now. Pause when you&apos;re done.
//             </>
//           ) : voice.speaking ? (
//             <>
//               <VoiceWave />
//               Hamarat is speaking… mic will re-open when it&apos;s done.
//             </>
//           ) : loading ? (
//             <>
//               <span className="loading-dots !w-6"><span/><span/><span/></span>
//               Thinking about your question…
//             </>
//           ) : (
//             <>
//               <span className="w-2.5 h-2.5 rounded-full bg-clay/70" />
//               Conversation active · tap the mic to stop
//             </>
//           )}
//           {conversationMode && (
//             <button
//               onClick={toggleMic}
//               className="ml-auto underline decoration-dotted underline-offset-2 hover:opacity-80"
//             >
//               End conversation
//             </button>
//           )}
//         </div>
//       )}

//       {/* Input */}
//       {isAuthenticated && (
//         <div className="flex-shrink-0 px-4 py-3 border-t border-smoke bg-white">
//           <div className="flex gap-2 items-end">
//             {/* Microphone — toggles hands-free conversation mode */}
//             {voice.recognitionSupported && (
//               <button
//                 onClick={toggleMic}
//                 disabled={loadingHistory}
//                 className={`relative flex-shrink-0 rounded-xl p-2.5 border transition-all ${
//                   conversationMode
//                     ? 'bg-clay text-cream border-clay shadow-sm'
//                     : 'bg-white text-bark-muted border-smoke-dark hover:text-clay hover:border-clay/40'
//                 } ${voice.listening ? 'scale-105' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
//                 title={
//                   conversationMode
//                     ? 'End conversation'
//                     : 'Start a hands-free conversation'
//                 }
//                 aria-label="Toggle hands-free conversation"
//                 aria-pressed={conversationMode}
//               >
//                 {conversationMode ? <MicActiveIcon /> : <MicIcon />}
//                 {conversationMode && (
//                   <span className="absolute inset-0 rounded-xl border-2 border-clay/50 animate-ping pointer-events-none" />
//                 )}
//               </button>
//             )}

//             <textarea
//               ref={inputRef}
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder={
//                 voice.listening
//                   ? 'Listening… your words will appear here'
//                   : 'Ask about a step, ingredient, or portion…'
//               }
//               rows={1}
//               disabled={loading || loadingHistory}
//               className="flex-1 input-field text-sm resize-none min-h-[40px] max-h-28 py-2.5 leading-relaxed"
//               style={{ height: 'auto' }}
//               onInput={(e) => {
//                 e.target.style.height = 'auto'
//                 e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
//               }}
//             />
//             <button
//               onClick={() => sendMessage()}
//               disabled={loading || !input.trim()}
//               className="btn-primary px-3 py-2.5 flex-shrink-0 rounded-xl"
//               aria-label="Send"
//             >
//               <SendIcon />
//             </button>
//           </div>
//           <p className="text-[10px] text-bark-muted mt-1.5 text-center">
//             {voice.recognitionSupported
//               ? conversationMode
//                 ? 'Hands-free mode · Hamarat listens, answers, and re-opens the mic automatically'
//                 : 'Enter to send · Shift+Enter for new line · Tap the mic for a hands-free chat'
//               : 'Enter to send · Shift+Enter for new line'}
//           </p>
//         </div>
//       )}
//     </div>
//   )
// }

// // ── Icons ────────────────────────────────────────────────────────────────────
// const ChefHatIcon = ({ className = 'w-4 h-4 text-cream' }) => (
//   <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
//     <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 019.18 0A4 4 0 0118 13.87V21H6v-7.13z"/>
//     <line x1="6" y1="17" x2="18" y2="17"/>
//   </svg>
// )
// const CloseIcon = () => (
//   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
//     <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
//   </svg>
// )
// const SendIcon = () => (
//   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
//     <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
//   </svg>
// )
// const ResetIcon = () => (
//   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
//     <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
//   </svg>
// )
// const MicIcon = () => (
//   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
//     <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
//     <path d="M19 10v2a7 7 0 01-14 0v-2"/>
//     <line x1="12" y1="19" x2="12" y2="23"/>
//     <line x1="8" y1="23" x2="16" y2="23"/>
//   </svg>
// )
// const MicActiveIcon = () => (
//   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//     <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
//     <path d="M19 10v2a7 7 0 01-14 0v-2" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
//     <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
//     <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
//   </svg>
// )
// const SpeakerOnIcon = () => (
//   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
//     <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
//     <path d="M15.54 8.46a5 5 0 010 7.07"/>
//     <path d="M19.07 4.93a10 10 0 010 14.14"/>
//   </svg>
// )
// const SpeakerOffIcon = () => (
//   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
//     <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
//     <line x1="23" y1="9" x2="17" y2="15"/>
//     <line x1="17" y1="9" x2="23" y2="15"/>
//   </svg>
// )
// const StopIcon = () => (
//   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//     <rect x="6" y="6" width="12" height="12" rx="2" />
//   </svg>
// )
// const VoiceWave = () => (
//   <span className="inline-flex items-end gap-0.5 h-3">
//     {[0, 1, 2, 3].map((i) => (
//       <span
//         key={i}
//         className="w-0.5 bg-sage rounded-full"
//         style={{
//           height: '100%',
//           animation: `voiceWave 0.9s ease-in-out ${i * 0.12}s infinite`,
//         }}
//       />
//     ))}
//   </span>
// )