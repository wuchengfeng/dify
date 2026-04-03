'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechInputError = 'not_supported' | 'not_allowed' | 'failed'

type BrowserSpeechRecognitionAlternative = {
  transcript: string
}

type BrowserSpeechRecognitionResult = {
  isFinal: boolean
  length: number
  [index: number]: BrowserSpeechRecognitionAlternative
}

type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number
  results: ArrayLike<BrowserSpeechRecognitionResult>
}

type BrowserSpeechRecognitionErrorEvent = Event & {
  error: string
}

type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

declare global {
  type BrowserSpeechWindow = Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
  }
}

type UseBrowserVoiceInputOptions = {
  onFinalText: (text: string) => void
  onError?: (error: SpeechInputError) => void
}

const useBrowserVoiceInput = ({ onFinalText, onError }: UseBrowserVoiceInputOptions) => {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const browserWindow = typeof window === 'undefined' ? null : window as BrowserSpeechWindow

  const isSupported = !!(browserWindow?.SpeechRecognition || browserWindow?.webkitSpeechRecognition)

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
    setInterimText('')
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('not_supported')
      return
    }

    const Recognition = browserWindow?.SpeechRecognition || browserWindow?.webkitSpeechRecognition

    if (!Recognition) {
      onError?.('not_supported')
      return
    }

    recognitionRef.current?.stop()

    const recognition = new Recognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let finalText = ''
      let nextInterimText = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript?.trim() || ''

        if (!transcript)
          continue

        if (result.isFinal)
          finalText += `${transcript} `
        else
          nextInterimText += `${transcript} `
      }

      if (finalText.trim())
        onFinalText(finalText.trim())

      setInterimText(nextInterimText.trim())
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed')
        onError?.('not_allowed')
      else
        onError?.('failed')

      setIsListening(false)
      setInterimText('')
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
      recognitionRef.current = null
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsListening(true)
      setInterimText('')
    }
    catch {
      onError?.('failed')
      recognitionRef.current = null
      setIsListening(false)
      setInterimText('')
    }
  }, [browserWindow, isSupported, onError, onFinalText])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  return {
    interimText,
    isListening,
    isSupported,
    startListening,
    stopListening,
  }
}

export default useBrowserVoiceInput
