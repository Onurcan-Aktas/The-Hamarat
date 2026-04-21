import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useVoice — small wrapper around the Web Speech API.
 *
 * Features:
 *   - SpeechRecognition: live transcription, final-result callback for auto-send
 *   - SpeechSynthesis:   reads text aloud, tracks "speaking" state, fires
 *                        onSpeakEnd ONLY when playback finishes naturally
 *                        (not when it was cancelled). This is what enables the
 *                        continuous listen → speak → listen conversation loop.
 *   - Graceful fallback when the browser does not support either API
 */
export default function useVoice({
  lang = 'en-US',
  onFinalResult,
  onInterimResult,
  onSpeakEnd,
  onError,
} = {}) {
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null

  const speechSynthesis =
    typeof window !== 'undefined' ? window.speechSynthesis : null

  const recognitionSupported = Boolean(SpeechRecognition)
  const synthesisSupported = Boolean(speechSynthesis)

  const recognitionRef = useRef(null)
  const utteranceRef = useRef(null)

  // Keep latest callbacks in refs so we don't re-init the recognizer each render
  const onFinalRef = useRef(onFinalResult)
  const onInterimRef = useRef(onInterimResult)
  const onSpeakEndRef = useRef(onSpeakEnd)
  const onErrorRef = useRef(onError)

  useEffect(() => { onFinalRef.current = onFinalResult }, [onFinalResult])
  useEffect(() => { onInterimRef.current = onInterimResult }, [onInterimResult])
  useEffect(() => { onSpeakEndRef.current = onSpeakEnd }, [onSpeakEnd])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')

  // ── Recognition setup (once) ───────────────────────────────────────────────
  useEffect(() => {
    if (!recognitionSupported) return

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) finalText += res[0].transcript
        else interim += res[0].transcript
      }
      if (interim) {
        setTranscript(interim)
        onInterimRef.current?.(interim)
      }
      if (finalText) {
        const trimmed = finalText.trim()
        setTranscript(trimmed)
        onFinalRef.current?.(trimmed)
      }
    }

    recognition.onerror = (event) => {
      setListening(false)
      onErrorRef.current?.(event.error || 'speech-error')
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      try { recognition.stop() } catch {}
      recognitionRef.current = null
    }
  }, [recognitionSupported, SpeechRecognition, lang])

  // ── Public controls ────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    // Stop any ongoing speech so the mic doesn't pick it up
    if (speechSynthesis?.speaking) {
      if (utteranceRef.current) utteranceRef.current._cancelled = true
      speechSynthesis.cancel()
    }
    setTranscript('')
    try {
      recognition.start()
      setListening(true)
    } catch {
      // "already-started" errors are safe to ignore — we're already listening
    }
  }, [speechSynthesis])

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    try { recognition.stop() } catch {}
    setListening(false)
  }, [])

  const speak = useCallback(
    (text) => {
      if (!synthesisSupported || !text) return

      // Cancel any currently-playing utterance so messages don't stack.
      // Mark it as cancelled so its onend does NOT trigger the auto-restart.
      if (utteranceRef.current) utteranceRef.current._cancelled = true
      speechSynthesis.cancel()

      // Strip simple markdown so it sounds natural
      const clean = String(text)
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`{1,3}(.+?)`{1,3}/g, '$1')
        .replace(/[•·]/g, ',')
        .replace(/\n+/g, '. ')

      const utter = new SpeechSynthesisUtterance(clean)
      utter._cancelled = false
      utter.lang = lang
      utter.rate = 1
      utter.pitch = 1
      utter.volume = 1

      utter.onstart = () => setSpeaking(true)
      utter.onend = () => {
        setSpeaking(false)
        // Only fire onSpeakEnd when playback actually completed.
        // Cancellations (new message, user stop, unmount) skip this so the
        // caller doesn't mistakenly restart listening.
        if (!utter._cancelled) onSpeakEndRef.current?.()
      }
      utter.onerror = () => {
        setSpeaking(false)
        if (!utter._cancelled) onSpeakEndRef.current?.()
      }

      utteranceRef.current = utter
      // Chrome quirk: a fresh cancel() can leave synth in a paused-ish state.
      // A microtask delay before speak() avoids swallowed utterances.
      setTimeout(() => {
        try { speechSynthesis.speak(utter) } catch {}
      }, 30)
    },
    [synthesisSupported, speechSynthesis, lang]
  )

  const stopSpeaking = useCallback(() => {
    if (!synthesisSupported) return
    if (utteranceRef.current) utteranceRef.current._cancelled = true
    speechSynthesis.cancel()
    setSpeaking(false)
  }, [synthesisSupported, speechSynthesis])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop() } catch {}
      if (utteranceRef.current) utteranceRef.current._cancelled = true
      if (speechSynthesis?.speaking) speechSynthesis.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    recognitionSupported,
    synthesisSupported,
    listening,
    speaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}



// import { useCallback, useEffect, useRef, useState } from 'react'

// /**
//  * useVoice — small wrapper around the Web Speech API.
//  *
//  * Features:
//  * - SpeechRecognition: live transcription, final-result callback for auto-send
//  * - SpeechSynthesis:   reads text aloud, tracks "speaking" state, fires
//  * onSpeakEnd ONLY when playback finishes naturally
//  * (not when it was cancelled). This is what enables the
//  * continuous listen → speak → listen conversation loop.
//  * - Silence Timeout:   Automatically stops listening if no speech is detected 
//  * for a specified duration (hands-free auto-stop).
//  * - Graceful fallback when the browser does not support either API
//  */
// export default function useVoice({
//   lang = 'tr-TR', // Hamarat Türkçe çalışacağı için varsayılanı tr-TR yapabiliriz
//   onFinalResult,
//   onInterimResult,
//   onSpeakEnd,
//   onError,
//   silenceTimeoutMs = 12000, // 12 saniye sessizlik süresi
// } = {}) {
//   const SpeechRecognition =
//     typeof window !== 'undefined'
//       ? window.SpeechRecognition || window.webkitSpeechRecognition
//       : null

//   const speechSynthesis =
//     typeof window !== 'undefined' ? window.speechSynthesis : null

//   const recognitionSupported = Boolean(SpeechRecognition)
//   const synthesisSupported = Boolean(speechSynthesis)

//   const recognitionRef = useRef(null)
//   const utteranceRef = useRef(null)
//   const silenceTimerRef = useRef(null) // Sessizlik sayacını tutacağımız referans

//   // Keep latest callbacks in refs so we don't re-init the recognizer each render
//   const onFinalRef = useRef(onFinalResult)
//   const onInterimRef = useRef(onInterimResult)
//   const onSpeakEndRef = useRef(onSpeakEnd)
//   const onErrorRef = useRef(onError)

//   useEffect(() => { onFinalRef.current = onFinalResult }, [onFinalResult])
//   useEffect(() => { onInterimRef.current = onInterimResult }, [onInterimResult])
//   useEffect(() => { onSpeakEndRef.current = onSpeakEnd }, [onSpeakEnd])
//   useEffect(() => { onErrorRef.current = onError }, [onError])

//   const [listening, setListening] = useState(false)
//   const [speaking, setSpeaking] = useState(false)
//   const [transcript, setTranscript] = useState('')

//   // ── Timer Controls ─────────────────────────────────────────────────────────
//   const clearSilenceTimer = useCallback(() => {
//     if (silenceTimerRef.current) {
//       clearTimeout(silenceTimerRef.current)
//       silenceTimerRef.current = null
//     }
//   }, [])

//   const resetSilenceTimer = useCallback(() => {
//     clearSilenceTimer()
//     silenceTimerRef.current = setTimeout(() => {
//       console.log("Mutfakta sessizlik... Mikrofon uyku moduna geçiyor.")
//       try { recognitionRef.current?.stop() } catch {}
//       setListening(false)
//     }, silenceTimeoutMs)
//   }, [clearSilenceTimer, silenceTimeoutMs])


//   // ── Recognition setup (once) ───────────────────────────────────────────────
//   useEffect(() => {
//     if (!recognitionSupported) return

//     const recognition = new SpeechRecognition()
//     recognition.lang = lang
//     recognition.interimResults = true
//     recognition.continuous = false
//     recognition.maxAlternatives = 1

//     recognition.onstart = () => {
//       setListening(true)
//       resetSilenceTimer() // Mikrofon açıldığı an sayacı başlat
//     }

//     recognition.onresult = (event) => {
//       resetSilenceTimer() // Ses duyulduğu an sayacı başa sar!

//       let interim = ''
//       let finalText = ''
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         const res = event.results[i]
//         if (res.isFinal) finalText += res[0].transcript
//         else interim += res[0].transcript
//       }
//       if (interim) {
//         setTranscript(interim)
//         onInterimRef.current?.(interim)
//       }
//       if (finalText) {
//         const trimmed = finalText.trim()
//         setTranscript(trimmed)
//         onFinalRef.current?.(trimmed)
//       }
//     }

//     recognition.onerror = (event) => {
//       clearSilenceTimer()
//       setListening(false)
//       onErrorRef.current?.(event.error || 'speech-error')
//     }

//     recognition.onend = () => {
//       clearSilenceTimer() // Döngü bittiğinde sayacı temizle
//       setListening(false)
//     }

//     recognitionRef.current = recognition

//     return () => {
//       try { recognition.stop() } catch {}
//       clearSilenceTimer()
//       recognitionRef.current = null
//     }
//   }, [recognitionSupported, SpeechRecognition, lang, resetSilenceTimer, clearSilenceTimer])

//   // ── Public controls ────────────────────────────────────────────────────────
//   const startListening = useCallback(() => {
//     const recognition = recognitionRef.current
//     if (!recognition) return
//     // Stop any ongoing speech so the mic doesn't pick it up
//     if (speechSynthesis?.speaking) {
//       if (utteranceRef.current) utteranceRef.current._cancelled = true
//       speechSynthesis.cancel()
//     }
//     setTranscript('')
//     try {
//       recognition.start()
//       // setListening(true) // onstart içinde yapıldığı için burayı kapattık
//     } catch {
//       // "already-started" errors are safe to ignore — we're already listening
//     }
//   }, [speechSynthesis])

//   const stopListening = useCallback(() => {
//     const recognition = recognitionRef.current
//     if (!recognition) return
//     clearSilenceTimer() // Manuel durdurmada sayacı iptal et
//     try { recognition.stop() } catch {}
//     setListening(false)
//   }, [clearSilenceTimer])

//   const speak = useCallback(
//     (text) => {
//       if (!synthesisSupported || !text) return

//       // Cancel any currently-playing utterance so messages don't stack.
//       // Mark it as cancelled so its onend does NOT trigger the auto-restart.
//       if (utteranceRef.current) utteranceRef.current._cancelled = true
//       speechSynthesis.cancel()

//       // Strip simple markdown so it sounds natural
//       const clean = String(text)
//         .replace(/\*\*(.+?)\*\*/g, '$1')
//         .replace(/\*(.+?)\*/g, '$1')
//         .replace(/`{1,3}(.+?)`{1,3}/g, '$1')
//         .replace(/[•·]/g, ',')
//         .replace(/\n+/g, '. ')

//       const utter = new SpeechSynthesisUtterance(clean)
//       utter._cancelled = false
//       utter.lang = lang
//       utter.rate = 1
//       utter.pitch = 1
//       utter.volume = 1

//       utter.onstart = () => setSpeaking(true)
//       utter.onend = () => {
//         setSpeaking(false)
//         // Only fire onSpeakEnd when playback actually completed.
//         // Cancellations (new message, user stop, unmount) skip this so the
//         // caller doesn't mistakenly restart listening.
//         if (!utter._cancelled) onSpeakEndRef.current?.()
//       }
//       utter.onerror = () => {
//         setSpeaking(false)
//         if (!utter._cancelled) onSpeakEndRef.current?.()
//       }

//       utteranceRef.current = utter
//       // Chrome quirk: a fresh cancel() can leave synth in a paused-ish state.
//       // A microtask delay before speak() avoids swallowed utterances.
//       setTimeout(() => {
//         try { speechSynthesis.speak(utter) } catch {}
//       }, 30)
//     },
//     [synthesisSupported, speechSynthesis, lang]
//   )

//   const stopSpeaking = useCallback(() => {
//     if (!synthesisSupported) return
//     if (utteranceRef.current) utteranceRef.current._cancelled = true
//     speechSynthesis.cancel()
//     setSpeaking(false)
//   }, [synthesisSupported, speechSynthesis])

//   // Clean up on unmount
//   useEffect(() => {
//     return () => {
//       try { recognitionRef.current?.stop() } catch {}
//       clearSilenceTimer() // Component unmount olduğunda sayacı sızdırmamak için
//       if (utteranceRef.current) utteranceRef.current._cancelled = true
//       if (speechSynthesis?.speaking) speechSynthesis.cancel()
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [clearSilenceTimer])

//   return {
//     recognitionSupported,
//     synthesisSupported,
//     listening,
//     speaking,
//     transcript,
//     startListening,
//     stopListening,
//     speak,
//     stopSpeaking,
//   }
// }
