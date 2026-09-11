/**
 * Simple Web Speech API helper supporting en-IN, hi-IN, and gu-IN
 */
export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const startListening = ({ lang = 'en', onResult, onError, onEnd, onStart }) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) onError('NOT_SUPPORTED');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    // Map portal language code to BCP 47 language tag
    const langMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      gu: 'gu-IN'
    };

    recognition.lang = langMap[lang] || 'en-IN';

    recognition.onstart = () => {
      if (onStart) onStart();
    };

    recognition.onresult = (event) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition event error:', event.error);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognition.start();
    return recognition;
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    if (onError) onError(err);
    return null;
  }
};
