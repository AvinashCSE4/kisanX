import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { startListening, isSpeechRecognitionSupported } from '../utils/speechRecognition';

export const VoiceInput = ({ onResult, fieldName = '' }) => {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleMicClick = () => {
    if (!isSpeechRecognitionSupported()) {
      setErrorMsg(t('voiceNotSupported'));
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    setErrorMsg('');
    startListening({
      lang: language,
      onStart: () => {
        setIsListening(true);
      },
      onResult: (text) => {
        setIsListening(false);
        if (onResult && text) {
          onResult(text);
        }
      },
      onError: (err) => {
        console.warn('Voice recognition error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        className={`mic-btn ${isListening ? 'listening' : ''}`}
        onClick={handleMicClick}
        title={t('micClickToSpeak')}
        aria-label={`${t('micClickToSpeak')} for ${fieldName}`}
      >
        <Mic size={22} />
      </button>
      {isListening && (
        <span className="mic-hint active">
          {t('voiceListening')}
        </span>
      )}
      {errorMsg && (
        <span style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '4px' }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
};

export default VoiceInput;
