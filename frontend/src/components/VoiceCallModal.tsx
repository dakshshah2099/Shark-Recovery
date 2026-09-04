import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  CheckCircle2,
  X,
  Volume2,
  Play,
  Square,
  MessageSquare,
  Loader2,
  Calendar,
  Sparkles,
  User,
  Bot,
  Mic,
  MicOff,
  PhoneCall,
  PhoneForwarded,
  Zap,
  Activity,
  Mail,
  ExternalLink,
  Smartphone,
  MessageCircle,
  Send,
} from 'lucide-react';

interface DialogueTurn {
  speaker: string;
  text: string;
  emotion: string;
  timestamp_sec: number;
  audio_base64?: string;
  voice_used?: string;
}

interface VoiceSession {
  call_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_amount: number;
  discount_offered: number;
  dialogue: DialogueTurn[];
  customer_intent: string;
  promise_to_pay_date: string | null;
  call_outcome: string;
  call_duration_seconds: number;
  sms_payment_link_triggered: boolean;
  transaction_id?: string;
  failure_reason?: string;
}

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData?: VoiceSession | null;
}

/**
 * Phonetic preprocessor for natural Romanized Hinglish TTS playback fallback.
 */
function preprocessHinglishSpeech(text: string): string {
  return text
    .replace(/₹\s*([\d,]+)/g, (_, amt) => `${amt.replace(/,/g, '')} rupees `)
    .replace(/INR\s*([\d,]+)/gi, (_, amt) => `${amt.replace(/,/g, '')} rupees `)
    .replace(/\bOTP\b/g, 'O T P ')
    .replace(/\bUPI\b/g, 'U P I ')
    .replace(/\bSMS\b/g, 'S M S ')
    .replace(/\bIVR\b/g, 'I V R ')
    .replace(/\b3DS\b/gi, '3D Secure ')
    .replace(/\bPTP\b/g, 'Promise to Pay ')
    .replace(/\b1-click\b/gi, 'one click ')
    .replace(/(\d+)%/g, '$1 percent ')
    .replace(/\bji\b/gi, 'jee')
    .replace(/\bnamaste\b/gi, 'namastey')
    .replace(/\bdhanyawad\b/gi, 'dhanyawaad')
    .replace(/\bshukriya\b/gi, 'shookriya')
    .trim();
}

/**
 * Client-side phonetic Devanagari transliterator for live subtitle toggle.
 */
const HINGLISH_SUBTITLE_MAP: Record<string, string> = {
  namaste: 'नमस्ते',
  namastey: 'नमस्ते',
  ji: 'जी',
  jee: 'जी',
  main: 'मैं',
  shark: 'शार्क',
  payment: 'पेमेंट',
  care: 'केयर',
  team: 'टीम',
  se: 'से',
  bol: 'बोल',
  rahi: 'रही',
  raha: 'रहा',
  hoon: 'हूँ',
  hun: 'हूँ',
  dekha: 'देखा',
  aapka: 'आपका',
  aapki: 'आपकी',
  aapke: 'आपके',
  ka: 'का',
  ki: 'की',
  ke: 'के',
  ko: 'को',
  order: 'ऑर्डर',
  checkout: 'चेकआउट',
  pe: 'पे',
  par: 'पर',
  interrupt: 'इंटररप्ट',
  ho: 'हो',
  gaya: 'गया',
  gayi: 'गयी',
  tha: 'था',
  thi: 'थी',
  kya: 'क्या',
  koi: 'कोई',
  help: 'हेल्प',
  madad: 'मदद',
  kar: 'कर',
  sakti: 'सकती',
  sakta: 'सकता',
  sakte: 'सकते',
  haan: 'हाँ',
  bank: 'बैंक',
  otp: 'ओ टी पी',
  nahi: 'नहीं',
  nahin: 'नहीं',
  aa: 'आ',
  toh: 'तो',
  maine: 'मैंने',
  app: 'ऐप',
  band: 'बंद',
  di: 'दी',
  bilkul: 'बिल्कुल',
  samajh: 'समझ',
  server: 'सर्वर',
  latency: 'लेटेंसी',
  wajah: 'वजह',
  issue: 'इशू',
  hua: 'हुआ',
  humne: 'हमने',
  cart: 'कार्ट',
  hold: 'होल्ड',
  kiya: 'किया',
  hai: 'है',
  hain: 'हैं',
  aur: 'और',
  ek: 'एक',
  special: 'स्पेशल',
  gesture: 'जेस्चर',
  discount: 'डिस्काउंट',
  apply: 'अप्लाई',
  diya: 'दिया',
  priority: 'प्रायोरिटी',
  reserve: 'रिज़र्व',
  rakha: 'रखा',
  taaki: 'ताकि',
  cancel: 'कैंसल',
  na: 'ना',
  abhi: 'अभी',
  whatsapp: 'व्हाट्सएप',
  sms: 'एस एम एस',
  direct: 'डायरेक्ट',
  '1-click': 'वन क्लिक',
  retry: 'रीट्राई',
  link: 'लिंक',
  bhej: 'भेज',
  doon: 'दूँ',
  jisse: 'जिससे',
  aap: 'आप',
  upi: 'यू पी आई',
  ya: 'या',
  card: 'कार्ड',
  bina: 'बिना',
  kisi: 'किसी',
  delay: 'डिले',
  complete: 'कम्प्लीट',
  sakein: 'सकें',
  please: 'प्लीज़',
  dijiye: 'दीजिए',
  agle: 'अगले',
  aadhe: 'आधे',
  ghante: 'घंटे',
  mein: 'में',
  dunga: 'दूँगा',
  dungi: 'दूँगी',
  bahut: 'बहुत',
  badhiya: 'बढ़िया',
  turant: 'तुरंत',
  phone: 'फ़ोन',
  dhanyawad: 'धन्यवाद',
  have: 'हैव',
  a: 'अ',
  wonderful: 'वंडरफुल',
  day: 'डे',
};

function transliterateTextToDevanagari(text: string): string {
  return text.replace(/\b[a-zA-Z0-9'-]+\b/g, (token) => {
    const lower = token.toLowerCase();
    if (HINGLISH_SUBTITLE_MAP[lower]) {
      return HINGLISH_SUBTITLE_MAP[lower];
    }
    return token;
  });
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ isOpen, onClose, sessionData }) => {
  const [activeTab, setActiveTab] = useState<'transcript' | 'live_mic' | 'pstn_dialer'>('transcript');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(-1);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [audioCache, setAudioCache] = useState<Record<number, string>>({});
  const [showDevanagari, setShowDevanagari] = useState<boolean>(false);

  // Live Interactive Mic state
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<{ speaker: string; text: string; time: string }[]>([]);
  const [liveToolsExecuted, setLiveToolsExecuted] = useState<{ name: string; args: any; result: any }[]>([]);
  const [liveAgentSpeaking, setLiveAgentSpeaking] = useState<boolean>(false);
  const [liveModelName, setLiveModelName] = useState<string>('models/gemini-2.0-flash-exp');
  const [liveStatusInfo, setLiveStatusInfo] = useState<string>('Ready to connect');
  const [liveError, setLiveError] = useState<string | null>(null);

  // PSTN Outbound Dialer state
  const [dialPhoneNumber, setDialPhoneNumber] = useState<string>(sessionData?.customer_phone || '+91 98765 43210');
  const [dialProvider, setDialProvider] = useState<'twilio' | 'exotel' | 'auto'>('auto');
  const [isDialing, setIsDialing] = useState<boolean>(false);
  const [pstnCallStatus, setPstnCallStatus] = useState<any | null>(null);

  const selectedAgentVoice = 'shark_agent_alpha';
  const selectedCustomerVoice = 'customer_male';
  const engineMode = 'kokoro';

  const isPlayingRef = useRef<boolean>(false);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const liveWsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextLiveAudioPlayTimeRef = useRef<number>(0);

  // Stop audio handler
  const stopDialogueAudio = useCallback(() => {
    isPlayingRef.current = false;
    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      currentAudioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsLoadingAudio(false);
    setActiveTurnIndex(-1);
  }, []);

  // Terminate live session
  const stopLiveInteractiveCall = useCallback(() => {
    if (liveWsRef.current) {
      try {
        liveWsRef.current.send(jsonToString({ event: 'end_call' }));
        liveWsRef.current.close();
      } catch {}
      liveWsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      try { scriptProcessorRef.current.disconnect(); } catch {}
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    nextLiveAudioPlayTimeRef.current = 0;
    setIsLiveConnected(false);
    setLiveAgentSpeaking(false);
    setLiveStatusInfo('Disconnected');
  }, []);

  const jsonToString = (obj: any) => {
    try { return JSON.stringify(obj); } catch { return '{}'; }
  };

  // Keyboard accessibility: Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        stopDialogueAudio();
        stopLiveInteractiveCall();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, stopDialogueAudio, stopLiveInteractiveCall]);

  // Sync live model name from server env configuration on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/env-config')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.gemini_live_model) {
            setLiveModelName(data.gemini_live_model);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Clean audio and cancel ongoing playback on close
  useEffect(() => {
    if (!isOpen) {
      stopDialogueAudio();
      stopLiveInteractiveCall();
      setAudioCache({});
      setActiveTurnIndex(-1);
      setPstnCallStatus(null);
      setLiveError(null);
    }
  }, [isOpen, stopDialogueAudio, stopLiveInteractiveCall]);

  /**
   * Start Live Interactive Browser Microphone Call with Gemini Live WebSocket
   */
  const startLiveInteractiveCall = async () => {
    stopDialogueAudio();
    const sessId = sessionData?.call_id || (sessionData?.transaction_id ? `live_${sessionData.transaction_id}` : `live_${Date.now()}`);
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect directly to backend or through dev proxy
    const host = window.location.port === '5173' || window.location.port === '3000' ? 'localhost:8000' : window.location.host;
    
    const params = new URLSearchParams();
    params.set('model', liveModelName);
    if (sessionData?.transaction_id) params.set('txn_id', sessionData.transaction_id);
    if (sessionData?.customer_name) params.set('customer_name', sessionData.customer_name);
    if (sessionData?.customer_phone) params.set('customer_phone', sessionData.customer_phone);
    if (sessionData?.customer_email) params.set('customer_email', sessionData.customer_email);
    if (sessionData?.order_amount !== undefined && sessionData?.order_amount !== null) {
      params.set('order_amount', String(sessionData.order_amount));
    }
    if (sessionData?.discount_offered !== undefined && sessionData?.discount_offered !== null) {
      params.set('discount_percent', String(sessionData.discount_offered));
    }
    if (sessionData?.failure_reason) params.set('failure_reason', sessionData.failure_reason);

    const wsUrl = `${wsProtocol}//${host}/api/voice/live-chat/${sessId}?${params.toString()}`;

    setLiveTranscript([]);
    setLiveToolsExecuted([]);
    setLiveError(null);
    nextLiveAudioPlayTimeRef.current = 0;
    setIsLiveConnected(true);
    setLiveStatusInfo(`Connecting to AI Shark Gateway using ${liveModelName}...`);

    try {
      // 1. Capture microphone audio stream with hardware echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
        video: false,
      });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      // 2. Open Live WebSocket
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = () => {
        loggerLog('Gemini Live WebSocket connected');
        setLiveStatusInfo('Connected: Initializing AI Agent turn...');
      };

      ws.onerror = (err) => {
        loggerLog(`WebSocket error: ${err}`);
        setLiveError('WebSocket connection issue. Please ensure backend is running at http://localhost:8000');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'connected') {
            setLiveModelName(data.model || 'models/gemini-2.0-flash-exp');
            setLiveStatusInfo(`Active: ${data.status}`);
            if (data.error_note) {
              setLiveError(data.error_note);
            }
          } else if (data.event === 'transcript') {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLiveTranscript((prev) => {
              if (prev.length > 0 && prev[prev.length - 1].speaker === data.speaker) {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, text: last.text + data.text }];
              }
              return [...prev, { speaker: data.speaker, text: data.text, time: now }];
            });
          } else if (data.event === 'audio') {
            playRawPcm24k(data.pcm_base64, audioCtx);
          } else if (data.event === 'tool_executed') {
            setLiveToolsExecuted((prev) => [
              ...prev,
              { name: data.tool_name, args: data.arguments, result: data.result },
            ]);
          } else if (data.event === 'error') {
            setLiveError(data.message || 'Error received from voice stream');
          }
        } catch (e) {
          loggerLog(`Error parsing WS frame: ${e}`);
        }
      };

      ws.onclose = () => {
        setIsLiveConnected(false);
        setLiveAgentSpeaking(false);
        setLiveStatusInfo('Session Closed');
      };

      // 3. Pipe mic PCM to WebSocket
      processor.onaudioprocess = (e) => {
        if (isMicMuted || ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Float32 -> Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        // Base64 encode
        const b64 = uint8ArrayToBase64(new Uint8Array(pcm16.buffer));
        ws.send(JSON.stringify({ event: 'audio_chunk', pcm_base64: b64 }));
      };

      // Mute microphone loopback to prevent acoustic speaker feedback
      const muteNode = audioCtx.createGain();
      muteNode.gain.value = 0;

      source.connect(processor);
      processor.connect(muteNode);
      muteNode.connect(audioCtx.destination);
    } catch (e: any) {
      console.error('Failed to initialize live mic session:', e);
      setIsLiveConnected(false);
      const errMsg = e?.message || 'Microphone access denied or WebSocket bridge unavailable.';
      setLiveError(`Microphone Error: ${errMsg}`);
    }
  };

  const loggerLog = (msg: string) => {
    if (import.meta.env.DEV) {
      console.log(`[Shark Voice Live] ${msg}`);
    }
  };

  const uint8ArrayToBase64 = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const playRawPcm24k = (base64Pcm: string, audioCtx: AudioContext) => {
    try {
      const binaryString = window.atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(audioCtx.destination);

      // Seamless streaming audio queue scheduling
      const currentTime = audioCtx.currentTime;
      if (nextLiveAudioPlayTimeRef.current < currentTime) {
        nextLiveAudioPlayTimeRef.current = currentTime;
      }
      sourceNode.start(nextLiveAudioPlayTimeRef.current);
      nextLiveAudioPlayTimeRef.current += audioBuffer.duration;

      setLiveAgentSpeaking(true);
      sourceNode.onended = () => {
        if (audioCtx.currentTime >= nextLiveAudioPlayTimeRef.current - 0.05) {
          setLiveAgentSpeaking(false);
        }
      };
    } catch (e) {
      console.warn('Error playing PCM chunk:', e);
      setLiveAgentSpeaking(false);
    }
  };

  /**
   * Trigger PSTN Outbound Call via Twilio / Exotel
   */
  const handleTriggerPstnCall = async () => {
    setIsDialing(true);
    setPstnCallStatus(null);
    try {
      const txnId = sessionData?.call_id?.replace('call_', '') || 'txn_sample';
      const res = await fetch('/api/voice/outbound-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: txnId,
          customer_phone: dialPhoneNumber,
          discount_percent: sessionData?.discount_offered || 0.0,
          provider: dialProvider,
        }),
      });
      const data = await res.json();
      setPstnCallStatus(data);
    } catch (e) {
      setPstnCallStatus({ success: false, message: `Call failed: ${String(e)}` });
    } finally {
      setIsDialing(false);
    }
  };

  /**
   * Synthesize audio for a turn via Kokoro-82M backend
   */
  const fetchKokoroTurnAudio = async (turnIndex: number, turn: DialogueTurn): Promise<string | null> => {
    if (audioCache[turnIndex]) {
      return audioCache[turnIndex];
    }

    const voice = turn.speaker === 'AI_Agent' ? selectedAgentVoice : selectedCustomerVoice;

    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: turn.text,
          voice: voice,
          speaker: turn.speaker,
          speed: 1.02,
        }),
      });

      if (!res.ok) {
        throw new Error(`Kokoro synthesis status ${res.status}`);
      }

      const data = await res.json();
      if (data.audio_base64) {
        setAudioCache((prev) => ({ ...prev, [turnIndex]: data.audio_base64 }));
        return data.audio_base64;
      }
      return null;
    } catch (e) {
      console.warn('Kokoro backend synthesis failed, falling back to Web Speech:', e);
      return null;
    }
  };

  /**
   * Browser Web Speech fallback for turn
   */
  const playWebSpeechTurn = (turn: DialogueTurn): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(preprocessHinglishSpeech(turn.text));
      utterance.lang = 'hi-IN';
      utterance.rate = turn.speaker === 'AI_Agent' ? 0.96 : 0.92;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  };

  /**
   * Play single individual turn
   */
  const playSingleTurn = async (turnIndex: number) => {
    if (!sessionData) return;
    stopDialogueAudio();
    setIsPlayingAudio(true);
    isPlayingRef.current = true;
    setActiveTurnIndex(turnIndex);

    const turn = sessionData.dialogue[turnIndex];
    if (!turn) return;

    if (engineMode === 'kokoro') {
      setIsLoadingAudio(true);
      const audioB64 = await fetchKokoroTurnAudio(turnIndex, turn);
      setIsLoadingAudio(false);

      if (audioB64 && isPlayingRef.current) {
        const audio = new Audio(audioB64);
        currentAudioElementRef.current = audio;
        audio.onended = () => {
          setIsPlayingAudio(false);
          setActiveTurnIndex(-1);
          isPlayingRef.current = false;
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          setActiveTurnIndex(-1);
          isPlayingRef.current = false;
        };
        await audio.play();
        return;
      }
    }

    await playWebSpeechTurn(turn);
    setIsPlayingAudio(false);
    setActiveTurnIndex(-1);
    isPlayingRef.current = false;
  };

  /**
   * Sequentially play the entire conversational dialogue
   */
  const playEntireDialogue = async () => {
    if (!sessionData) return;
    stopDialogueAudio();
    setIsPlayingAudio(true);
    isPlayingRef.current = true;

    const turns = sessionData.dialogue;

    for (let i = 0; i < turns.length; i++) {
      if (!isPlayingRef.current) break;

      setActiveTurnIndex(i);
      const turn = turns[i];

      if (engineMode === 'kokoro') {
        setIsLoadingAudio(true);
        const audioB64 = await fetchKokoroTurnAudio(i, turn);
        setIsLoadingAudio(false);

        if (audioB64 && isPlayingRef.current) {
          await new Promise<void>((resolve) => {
            const audio = new Audio(audioB64);
            currentAudioElementRef.current = audio;
            audio.onended = () => resolve();
            audio.onerror = () => resolve();
            audio.play().catch(() => resolve());
          });
        } else if (isPlayingRef.current) {
          await playWebSpeechTurn(turn);
        }
      } else {
        await playWebSpeechTurn(turn);
      }

      if (isPlayingRef.current && i < turns.length - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    setIsPlayingAudio(false);
    setActiveTurnIndex(-1);
    isPlayingRef.current = false;
  };

  if (!isOpen || !sessionData) return null;

  const activeTurn = activeTurnIndex >= 0 ? sessionData.dialogue[activeTurnIndex] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopDialogueAudio();
          stopLiveInteractiveCall();
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto font-body transition-colors">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-200 dark:border-[#27272a] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="voice-modal-title"
                  className="font-heading font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white"
                >
                  Autonomous Hinglish Voice Recovery AI
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a]">
                  {sessionData.call_id}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
                Target: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{sessionData.customer_name}</span> ({sessionData.customer_phone}) • Order: <span className="font-mono font-bold text-zinc-900 dark:text-white">₹{sessionData.order_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopDialogueAudio();
              stopLiveInteractiveCall();
              onClose();
            }}
            aria-label="Close voice modal"
            className="w-8 h-8 rounded-md hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer focus-rzp shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div className="flex items-center justify-between gap-2 p-1 bg-zinc-100 dark:bg-[#18181b] rounded-md border border-zinc-200 dark:border-[#27272a]">
          <button
            type="button"
            onClick={() => {
              stopLiveInteractiveCall();
              setActiveTab('transcript');
            }}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-subheading font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-rzp ${
              activeTab === 'transcript'
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Recorded Transcript</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopDialogueAudio();
              setActiveTab('live_mic');
            }}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-subheading font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-rzp ${
              activeTab === 'live_mic'
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-rose-500" />
            <span>Live Mic Stream (Gemini Live)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopDialogueAudio();
              stopLiveInteractiveCall();
              setActiveTab('pstn_dialer');
            }}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-subheading font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-rzp ${
              activeTab === 'pstn_dialer'
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <PhoneForwarded className="w-3.5 h-3.5 text-blue-500" />
            <span>PSTN Outbound Dialer</span>
          </button>
        </div>

        {/* Tab 1: Recorded Transcript & Kokoro-82M Playback */}
        {activeTab === 'transcript' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            {/* Operational Context Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-md bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block tracking-tight">
                  Customer Intent
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <strong className="font-subheading font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {sessionData.customer_intent.replace(/_/g, ' ')}
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-md bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block tracking-tight">
                  Promise-To-Pay Target
                </span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-purple-500 shrink-0" />
                  <strong className="font-mono font-bold text-zinc-900 dark:text-white text-xs truncate">
                    {sessionData.promise_to_pay_date || 'Immediate Retarget'}
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-md bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block tracking-tight">
                  Incentive Tactic
                </span>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <strong className={`font-subheading font-bold text-xs ${sessionData.discount_offered > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {sessionData.discount_offered > 0 ? `${sessionData.discount_offered}% Special Discount` : 'Cart Reserved (0% Off)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Neural Synthesis Audio Player Strip */}
            <div className="p-3.5 rounded-md bg-zinc-950 dark:bg-[#0c0c0e] text-white border border-zinc-800 dark:border-[#27272a] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-heading font-semibold text-white">
                        {isPlayingAudio
                          ? `Playing Turn #${activeTurnIndex + 1} (${activeTurn?.speaker === 'AI_Agent' ? 'Priya Voice AI' : sessionData.customer_name})`
                          : 'Kokoro-82M Neural Audio Player'}
                      </span>
                      {isPlayingAudio && (
                        <div className="flex items-end gap-0.5 h-3" aria-hidden="true">
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-3" />
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse [animation-delay:150ms] h-2" />
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse [animation-delay:300ms] h-3.5" />
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse [animation-delay:450ms] h-2.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      Kokoro-82M ONNX • Authentic Conversational Hinglish with English Fintech Clarity
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPlayingAudio ? (
                    <button
                      type="button"
                      onClick={stopDialogueAudio}
                      aria-label="Stop audio call"
                      className="h-8 px-3 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-subheading font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs focus-rzp"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Call</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={playEntireDialogue}
                      disabled={isLoadingAudio}
                      aria-label="Play full audio dialogue"
                      className="h-8 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-subheading font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs focus-rzp disabled:opacity-50 transition-colors"
                    >
                      {isLoadingAudio ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Synthesizing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Full Dialogue</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {activeTurnIndex >= 0 && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>Progress: Turn {activeTurnIndex + 1} of {sessionData.dialogue.length}</span>
                    <span>+{sessionData.dialogue[activeTurnIndex]?.timestamp_sec}s / {sessionData.call_duration_seconds}s</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                      style={{ width: `${((activeTurnIndex + 1) / sessionData.dialogue.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Turn-by-Turn Conversational Transcript */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-heading font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  <span>Turn-by-Turn Conversational Transcript</span>
                </h4>
                <div className="flex items-center gap-3">
                  <label className="text-[11px] font-subheading font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showDevanagari}
                      onChange={(e) => setShowDevanagari(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Hindi Devanagari Subtitles</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">Click ▶ to test turn</span>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {sessionData.dialogue.map((turn, i) => {
                  const isAgent = turn.speaker === 'AI_Agent';
                  const isActive = activeTurnIndex === i;
                  const displayText = showDevanagari ? transliterateTextToDevanagari(turn.text) : turn.text;

                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-md text-xs leading-relaxed transition-all duration-150 border ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500'
                          : isAgent
                          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 ml-3 sm:ml-4'
                          : 'bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] mr-3 sm:mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
                        <span className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
                          {isAgent ? (
                            <>
                              <Bot className="w-3 h-3 text-rose-500" />
                              <span>Priya (Shark Voice AI)</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 text-zinc-500" />
                              <span>{sessionData.customer_name}</span>
                            </>
                          )}
                          <span className="px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-[#27272a] text-[9px] font-mono text-zinc-600 dark:text-zinc-400 font-normal">
                            {isAgent ? 'Empathetic Female' : 'Customer Male'}
                          </span>
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-[#27272a] text-zinc-600 dark:text-zinc-400 capitalize">
                            {turn.emotion}
                          </span>
                          <span className="text-zinc-400 font-mono">+{turn.timestamp_sec}s</span>

                          <button
                            type="button"
                            onClick={() => playSingleTurn(i)}
                            disabled={isPlayingAudio && isActive}
                            aria-label={`Play turn ${i + 1}`}
                            className="w-6 h-6 rounded bg-zinc-200/80 hover:bg-zinc-300 dark:bg-[#27272a] dark:hover:bg-[#3f3f46] text-zinc-800 dark:text-zinc-100 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 focus-rzp"
                            title={`Play turn #${i + 1}`}
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                          </button>
                        </div>
                      </div>

                      <p className={`font-body text-xs leading-relaxed ${isAgent ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {displayText}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Mic Streaming (Gemini 2.0 Live WebSocket) */}
        {activeTab === 'live_mic' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            {/* Live Error Banner */}
            {liveError && (
              <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <span className="font-bold shrink-0">⚠️ Notice:</span>
                <div className="flex-1">
                  <p>{liveError}</p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                    If GEMINI_API_KEY is not configured or offline, Shark will automatically fallback to local Kokoro neural voice synthesis.
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 rounded-md bg-zinc-950 dark:bg-[#0c0c0e] text-white border border-zinc-800 dark:border-[#27272a] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    isLiveConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    <Activity className={`w-4 h-4 ${isLiveConnected ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-heading font-semibold flex items-center gap-2 text-white flex-wrap">
                      <span>Multimodal Live Voice Streaming Bridge</span>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold ${
                        isLiveConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {isLiveConnected ? 'Connected (Bi-Directional)' : 'Idle / Standby'}
                      </span>
                    </h4>
                    
                    {/* Live Model Selection Pills */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] text-zinc-400 font-mono">Model:</span>
                      {[
                        { id: 'models/gemini-3.0-flash', label: 'Gemini 3.0 Live' },
                        { id: 'models/gemini-2.5-flash', label: 'Gemini 2.5 Live' },
                        { id: 'models/gemini-2.0-flash-exp', label: 'Gemini 2.0 Live' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          disabled={isLiveConnected}
                          onClick={() => setLiveModelName(m.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer disabled:cursor-not-allowed ${
                            liveModelName === m.id
                              ? 'bg-rose-600 text-white font-bold shadow-xs'
                              : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] text-zinc-400 font-mono mt-1">
                      {isLiveConnected ? liveStatusInfo : 'Sub-300ms native voice processing • Priya speaks first • Interruption detection enabled'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isLiveConnected ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsMicMuted(!isMicMuted)}
                        className={`h-8 px-3 rounded-md text-xs font-subheading font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-rzp ${
                          isMicMuted ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{isMicMuted ? 'Unmute' : 'Mute'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={stopLiveInteractiveCall}
                        className="h-8 px-3 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-subheading font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs focus-rzp"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Disconnect</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startLiveInteractiveCall}
                      className="h-8 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-subheading font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs focus-rzp transition-colors"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Start Live Voice AI Call</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time speech status indicator */}
              {isLiveConnected && (
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${liveAgentSpeaking ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                    <span className="text-zinc-300">
                      {liveAgentSpeaking ? 'Priya is speaking...' : isMicMuted ? 'Microphone muted' : 'Listening to your microphone (Speak in Hinglish/English)...'}
                    </span>
                  </div>
                  <span className="text-zinc-500 text-[10px]">16kHz L16 PCM Stream</span>
                </div>
              )}
            </div>

            {/* Live Tool Triggers Box */}
            {liveToolsExecuted.length > 0 && (
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <span className="font-heading font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Real-time Live Dispatch & Recovery Tools Executed by Priya:</span>
                </span>
                <div className="space-y-1.5">
                  {liveToolsExecuted.map((t, idx) => {
                    const isWA = t.name.includes('whatsapp') || t.args?.channel === 'whatsapp';
                    const isSMS = t.name.includes('sms') || t.args?.channel === 'sms';
                    const isMail = t.name.includes('email') || t.args?.channel === 'email';
                    const isP2P = t.name.includes('promise_to_pay');
                    const paymentLink = t.result?.payment_link;

                    return (
                      <div key={idx} className="p-2.5 rounded bg-white dark:bg-[#18181b] border border-amber-500/30 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 font-bold">
                            {isWA && <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp Dispatch</span>}
                            {isSMS && <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400"><Smartphone className="w-3.5 h-3.5" /> SMS Dispatch</span>}
                            {isMail && <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400"><Mail className="w-3.5 h-3.5" /> Email Dispatch</span>}
                            {isP2P && <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400"><Calendar className="w-3.5 h-3.5" /> Promise-to-Pay</span>}
                            {!isWA && !isSMS && !isMail && !isP2P && <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300"><Send className="w-3.5 h-3.5" /> {t.name}</span>}
                          </div>
                          {t.result?.status === 'dispatched' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                              ✓ Dispatched Live
                            </span>
                          )}
                          {t.result?.status === 'recorded' && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold">
                              ✓ Commitment Logged
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300 text-[11px]">
                          {t.result?.message || JSON.stringify(t.result)}
                        </p>
                        {paymentLink && (
                          <div className="pt-1 flex items-center gap-2">
                            <a
                              href={paymentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{paymentLink}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Streaming Transcript Stream */}
            <div className="space-y-2">
              <h4 className="text-xs font-heading font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                <span>Live Streaming Dialogue Transcript:</span>
              </h4>

              <div className="p-3 rounded-md bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] min-h-[160px] max-h-56 overflow-y-auto space-y-2 text-xs">
                {liveTranscript.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 font-mono text-xs">
                    {isLiveConnected ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        <span>Priya (Voice AI) is initiating the conversation...</span>
                      </div>
                    ) : (
                      'Click "Start Live Voice AI Call" above to converse live with Priya.'
                    )}
                  </div>
                ) : (
                  liveTranscript.map((t, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className={`font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                        t.speaker === 'AI_Agent' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {t.speaker === 'AI_Agent' ? '🤖 Priya:' : '👤 You:'}
                      </span>
                      <div className="flex-1">
                        <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-body">{t.text}</p>
                        <span className="text-[9px] text-zinc-400 font-mono">{t.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: PSTN Outbound Dialer (Twilio / Exotel) */}
        {activeTab === 'pstn_dialer' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="p-4 rounded-md bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] space-y-4">
              <div>
                <h4 className="text-xs font-heading font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-blue-500" />
                  <span>Cloud Telephony PSTN Outbound Dispatcher</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading mt-0.5">
                  Dials consumer phone numbers over PSTN/VoLTE and connects call audio to the backend WebSocket media stream.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
                    Recipient Phone Number (E.164)
                  </label>
                  <input
                    type="text"
                    value={dialPhoneNumber}
                    onChange={(e) => setDialPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-9 px-3 rounded-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] text-xs font-mono text-zinc-900 dark:text-white focus-rzp"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
                    Telephony Gateway Provider
                  </label>
                  <select
                    value={dialProvider}
                    onChange={(e) => setDialProvider(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] text-xs font-subheading text-zinc-900 dark:text-white focus-rzp cursor-pointer"
                  >
                    <option value="auto">Auto (Twilio India / Exotel / Fallback)</option>
                    <option value="twilio">Twilio Voice API (TwiML Stream)</option>
                    <option value="exotel">Exotel Indian Cloud Telephony</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-[#27272a]">
                <span className="text-[11px] text-zinc-500 font-mono">
                  Approved Incentive: {sessionData.discount_offered > 0 ? `${sessionData.discount_offered}% Off` : 'Cart Reservation'}
                </span>

                <button
                  type="button"
                  onClick={handleTriggerPstnCall}
                  disabled={isDialing}
                  className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-subheading font-semibold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs focus-rzp disabled:opacity-50 transition-colors"
                >
                  {isDialing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dialing PSTN Gateway...</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Place Outbound Call Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PSTN Dispatch Result Banner */}
            {pstnCallStatus && (
              <div className={`p-3.5 rounded-md border text-xs space-y-1.5 animate-in fade-in duration-150 ${
                pstnCallStatus.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="font-heading font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Call Dispatched: {pstnCallStatus.status}</span>
                </div>
                <div className="font-mono text-[11px] space-y-0.5">
                  <div>Call SID: <span className="font-bold">{pstnCallStatus.call_sid}</span></div>
                  <div>Provider: <span className="font-bold">{pstnCallStatus.provider_used}</span></div>
                  <div>Session: <span className="font-bold">{pstnCallStatus.session_id}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Outcome Footer */}
        <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-subheading">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{sessionData.call_outcome}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              stopDialogueAudio();
              stopLiveInteractiveCall();
              onClose();
            }}
            className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-heading font-semibold text-xs cursor-pointer focus-rzp shrink-0 transition-colors self-end sm:self-auto"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  );
};
