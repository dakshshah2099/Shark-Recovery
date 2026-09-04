import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, CheckCircle2, X, Volume2, Play, Square, MessageSquare, Mic, Sparkles, Cpu, Loader2 } from 'lucide-react';

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
  order_amount: number;
  discount_offered: number;
  dialogue: DialogueTurn[];
  customer_intent: string;
  promise_to_pay_date: string | null;
  call_outcome: string;
  call_duration_seconds: number;
  sms_payment_link_triggered: boolean;
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
    .trim();
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ isOpen, onClose, sessionData }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(-1);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [audioCache, setAudioCache] = useState<Record<number, string>>({});
  const [selectedAgentVoice, setSelectedAgentVoice] = useState<string>('hf_alpha');
  const [selectedCustomerVoice, setSelectedCustomerVoice] = useState<string>('hm_omega');
  const [engineMode, setEngineMode] = useState<'kokoro' | 'webspeech'>('kokoro');

  // Browser Web Speech fallback state
  const [availableBrowserVoices, setAvailableBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Load browser voices for fallback
  const refreshBrowserVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    setAvailableBrowserVoices(voices);
  }, []);

  useEffect(() => {
    refreshBrowserVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshBrowserVoices;
    }
  }, [refreshBrowserVoices]);

  // Clean audio and cancel ongoing playback on close
  useEffect(() => {
    if (!isOpen) {
      stopDialogueAudio();
      setAudioCache({});
      setActiveTurnIndex(-1);
    }
  }, [isOpen]);

  if (!isOpen || !sessionData) return null;

  const stopDialogueAudio = () => {
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
          speed: 1.0,
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
      const indianMatch = availableBrowserVoices.find(
        (v) =>
          v.name.toLowerCase().includes('swara') ||
          v.name.toLowerCase().includes('madhur') ||
          v.name.toLowerCase().includes('hindi') ||
          v.lang.toLowerCase().includes('hi') ||
          v.lang.toLowerCase().includes('in')
      );

      if (indianMatch) {
        utterance.voice = indianMatch;
        utterance.lang = indianMatch.lang;
      } else {
        utterance.lang = 'hi-IN';
      }

      utterance.rate = turn.speaker === 'AI_Agent' ? 0.95 : 0.92;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  };

  /**
   * Play single individual turn
   */
  const playSingleTurn = async (turnIndex: number) => {
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

    // Web speech fallback
    await playWebSpeechTurn(turn);
    setIsPlayingAudio(false);
    setActiveTurnIndex(-1);
    isPlayingRef.current = false;
  };

  /**
   * Sequentially play the entire conversational dialogue
   */
  const playEntireDialogue = async () => {
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
          // Fallback to Web Speech if Kokoro failed
          await playWebSpeechTurn(turn);
        }
      } else {
        await playWebSpeechTurn(turn);
      }

      // 600ms natural conversational pause between turns
      if (isPlayingRef.current && i < turns.length - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    setIsPlayingAudio(false);
    setActiveTurnIndex(-1);
    isPlayingRef.current = false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Phone className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Hinglish Voice Recovery AI Session</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  {sessionData.call_id}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-subheading">
                Autonomous conversational voice outreach for: {sessionData.customer_name} (₹{sessionData.order_amount.toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close voice modal"
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-[#18181b] text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer focus-rzp"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intent & Promise to Pay Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-subheading block">Customer Intent</span>
            <strong className="font-heading font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {sessionData.customer_intent.replace('_', ' ')}
            </strong>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-subheading block">Promise-To-Pay Target</span>
            <strong className="font-mono font-bold text-zinc-900 dark:text-white text-xs">
              {sessionData.promise_to_pay_date || 'Immediate Retarget'}
            </strong>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-subheading block">Dynamic Discount</span>
            <strong className="font-heading font-bold text-blue-600 dark:text-blue-400 text-sm">
              {sessionData.discount_offered}% Off
            </strong>
          </div>
        </div>

        {/* Audio Synthesis Trigger & Kokoro-82M Voice Engine Banner */}
        <div className="p-3.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-blue-950 dark:text-blue-200 font-subheading">
              <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                {isPlayingAudio
                  ? `Speaking Turn #${activeTurnIndex + 1}: ${
                      sessionData.dialogue[activeTurnIndex]?.speaker === 'AI_Agent'
                        ? 'Shark AI Recovery Agent'
                        : sessionData.customer_name
                    }...`
                  : 'Kokoro-82M Neural Synthesis: authentic conversational Hinglish with dual-speaker alternation.'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPlayingAudio ? (
                <button
                  type="button"
                  onClick={stopDialogueAudio}
                  className="h-8.5 px-3 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs focus-rzp shrink-0"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Call</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={playEntireDialogue}
                  disabled={isLoadingAudio}
                  className="h-8.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs focus-rzp shrink-0 disabled:opacity-50"
                >
                  {isLoadingAudio ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Kokoro-82M Audio</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Kokoro Engine Telemetry & Voice Config Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-3">
              {/* Agent Voice Preset */}
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-zinc-500 dark:text-zinc-400">Agent Voice:</span>
                <select
                  value={selectedAgentVoice}
                  onChange={(e) => {
                    setSelectedAgentVoice(e.target.value);
                    setAudioCache({});
                  }}
                  className="h-6 px-1.5 text-[10px] rounded border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-[#121215] text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
                  title="Kokoro Agent Voice"
                >
                  <option value="hf_alpha">Kokoro Alpha (Hindi Female - Default)</option>
                  <option value="hf_beta">Kokoro Beta (Warm Hindi Female)</option>
                  <option value="af_heart">Kokoro Heart (US English Female)</option>
                </select>
              </div>

              {/* Customer Voice Preset */}
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-zinc-500 dark:text-zinc-400">Customer Voice:</span>
                <select
                  value={selectedCustomerVoice}
                  onChange={(e) => {
                    setSelectedCustomerVoice(e.target.value);
                    setAudioCache({});
                  }}
                  className="h-6 px-1.5 text-[10px] rounded border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-[#121215] text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
                  title="Kokoro Customer Voice"
                >
                  <option value="hm_omega">Kokoro Omega (Hindi Male - Default)</option>
                  <option value="hm_psi">Kokoro Psi (Calm Hindi Male)</option>
                  <option value="am_adam">Kokoro Adam (US English Male)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={engineMode}
                onChange={(e) => {
                  setEngineMode(e.target.value as any);
                  stopDialogueAudio();
                }}
                className="h-6 px-1.5 text-[10px] rounded border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-[#121215] text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
                title="Select Audio Engine"
              >
                <option value="kokoro">⚡ Kokoro-82M ONNX (Studio Neural)</option>
                <option value="webspeech">🌐 Browser Web Speech (Fallback)</option>
              </select>

              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  {engineMode === 'kokoro' ? 'Kokoro-82M ONNX Active' : 'Web Speech Fallback'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Turn-by-turn Conversation Stream */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-heading font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between font-subheading">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Turn-by-Turn Conversational Dialogue Transcript:</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Click ▶ on any turn to play individually</span>
          </h4>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {sessionData.dialogue.map((turn, i) => {
              const isAgent = turn.speaker === 'AI_Agent';
              const isActive = activeTurnIndex === i;

              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-xs leading-relaxed transition-all duration-150 ${
                    isActive
                      ? 'ring-2 ring-blue-500 bg-blue-100/90 dark:bg-blue-900/50 shadow-md scale-[1.01]'
                      : isAgent
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-950 dark:text-blue-200 ml-4'
                      : 'bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-zinc-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono opacity-75">
                    <span className="font-bold flex items-center gap-1.5">
                      {isAgent ? '🤖 Shark AI Voice Agent' : `👤 ${sessionData.customer_name}`}
                      <span className="px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-[#27272a] text-[9px] font-sans text-zinc-600 dark:text-zinc-300">
                        {isAgent ? selectedAgentVoice : selectedCustomerVoice}
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-[#27272a] capitalize">{turn.emotion}</span>
                      <span>+{turn.timestamp_sec}s</span>

                      {/* Individual Turn Replay Button */}
                      <button
                        type="button"
                        onClick={() => playSingleTurn(i)}
                        disabled={isPlayingAudio && isActive}
                        title={`Replay turn #${i + 1}`}
                        className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-transform hover:scale-110 disabled:opacity-50"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </button>
                    </div>
                  </div>
                  <p className="font-body text-xs leading-relaxed">{turn.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outcome Footer */}
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-body">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{sessionData.call_outcome}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-heading font-semibold text-xs cursor-pointer focus-rzp shrink-0"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  );
};
