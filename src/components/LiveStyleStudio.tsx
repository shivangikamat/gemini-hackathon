"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Mic,
  MicOff,
  Sparkles,
  Video,
  Wand2,
  Volume2,
  VolumeX,
} from "lucide-react";
import type {
  HairOverlayConfig,
  HairstyleSuggestion,
  StyleAgentResponse,
  StyleAgentTurn,
} from "@/lib/types";
import { createOverlayFromStyle } from "@/lib/styleStudio";
import HairstyleOverlay from "./HairstyleOverlay";

type SpeechRecognitionResultLike = {
  [index: number]: {
    transcript: string;
  };
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    [index: number]: SpeechRecognitionResultLike;
    length: number;
  };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: null | (() => void);
  onerror: null | ((event: { error?: string }) => void);
  onresult: null | ((event: SpeechRecognitionEventLike) => void);
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type Props = {
  suggestions: HairstyleSuggestion[];
  selfieUrl: string | null;
  selectedStyle: string | null;
  onSelectStyle: (styleName: string) => void;
};

const QUICK_PROMPTS = [
  "Soft and face-framing, but still polished on camera.",
  "Shorter and cleaner with low daily maintenance.",
  "Edgy texture, volume, and a little runway energy.",
];

const INITIAL_AGENT_REPLY =
  "Turn on the webcam or use your uploaded selfie, then tell the agent what vibe you want. I’ll turn that into a live preview-friendly mashup.";

function getSpeechRecognitionConstructor():
  | SpeechRecognitionConstructor
  | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const maybeWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return maybeWindow.SpeechRecognition || maybeWindow.webkitSpeechRecognition;
}

export default function LiveStyleStudio({
  suggestions,
  selfieUrl,
  selectedStyle,
  onSelectStyle,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const skipSyncStyleRef = useRef<string | null>(null);

  const previewStyle = selectedStyle || suggestions[0]?.name || "Textured Bob";
  const [overlay, setOverlay] = useState<HairOverlayConfig>(
    createOverlayFromStyle(previewStyle)
  );
  const [mashupName, setMashupName] = useState(previewStyle);
  const [agentReply, setAgentReply] = useState(INITIAL_AGENT_REPLY);
  const [preferences, setPreferences] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentSummary, setAgentSummary] = useState("Live overlay ready");
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sessionTurns, setSessionTurns] = useState<StyleAgentTurn[]>([
    {
      speaker: "agent",
      text: INITIAL_AGENT_REPLY,
    },
  ]);

  useEffect(() => {
    if (skipSyncStyleRef.current === previewStyle) {
      skipSyncStyleRef.current = null;
      return;
    }

    setOverlay(createOverlayFromStyle(previewStyle, preferences));
    setMashupName(previewStyle);
  }, [preferences, previewStyle]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSpeechSupported("speechSynthesis" in window);
    }

    return () => {
      recognitionRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Webcam access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      setCameraActive(true);
      setCameraError(null);
    } catch (error) {
      console.error("Failed to start webcam:", error);
      setCameraError(
        "We couldn’t access the webcam. You can still use the uploaded selfie preview."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setVoiceError(
        "Voice capture works best in Chrome-based browsers. You can still type your preferences below."
      );
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(
        { length: event.results.length },
        (_, index) => event.results[index][0]?.transcript || ""
      )
        .join(" ")
        .trim();

      setPreferences(transcript);
      setVoiceError(null);
    };

    recognition.onerror = (event) => {
      setVoiceError(
        event.error
          ? `Voice capture error: ${event.error}.`
          : "Voice capture hit an unexpected error."
      );
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setVoiceError(null);
  };

  const stopSpeaking = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const speakReply = (text: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !text.trim()
    ) {
      return;
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const preferredVoice = synth
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.97;
    utterance.pitch = 1.02;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    synth.cancel();
    synth.speak(utterance);
  };

  const handleAgentSubmit = async () => {
    const trimmedPreferences = preferences.trim();

    if (speechSupported) {
      stopSpeaking();
    }

    setAgentLoading(true);
    setVoiceError(null);

    try {
      const response = await fetch("/api/style-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences,
          currentStyle: selectedStyle,
          suggestions,
          conversationHistory: sessionTurns.slice(-6),
        }),
      });

      const data = (await response.json()) as
        | StyleAgentResponse
        | { error?: string };

      if (!response.ok || !("overlay" in data)) {
        const message =
          "error" in data ? data.error : "The style agent could not respond.";
        throw new Error(message || "The style agent could not respond.");
      }

      skipSyncStyleRef.current = data.selectedStyle;
      setOverlay(data.overlay);
      setMashupName(data.mashupName);
      setAgentReply(data.agentReply);
      setAgentSummary(data.preferencesSummary);
      setSessionTurns((currentTurns) => {
        const nextTurns: StyleAgentTurn[] = trimmedPreferences
          ? [
              ...currentTurns,
              { speaker: "user", text: trimmedPreferences },
              { speaker: "agent", text: data.agentReply },
            ]
          : [...currentTurns, { speaker: "agent", text: data.agentReply }];

        return nextTurns.slice(-6);
      });
      onSelectStyle(data.selectedStyle);

      if (voiceReplyEnabled && speechSupported) {
        speakReply(data.agentReply);
      }
    } catch (error) {
      setVoiceError(
        error instanceof Error
          ? error.message
          : "The style agent could not respond."
      );
    } finally {
      setAgentLoading(false);
    }
  };

  const previewBackground =
    !cameraActive && selfieUrl
      ? { backgroundImage: `url(${selfieUrl})` }
      : undefined;
  const previewModeLabel = cameraActive
    ? "Live camera feed"
    : selfieUrl
      ? "Uploaded portrait preview"
      : "Studio mannequin";

  return (
    <section className="relative mb-14 overflow-hidden rounded-[2.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.12),transparent_24%),linear-gradient(145deg,rgba(7,11,19,0.98),rgba(11,17,30,0.9))] p-5 shadow-[0_40px_140px_rgba(2,8,23,0.5)] md:p-7">
      <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-3xl" />

      <div className="relative grid gap-8 xl:grid-cols-[1.18fr_0.82fr] xl:items-stretch">
        <div className="rounded-[2.3rem] border border-white/10 bg-slate-950/55 p-4 backdrop-blur md:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Live Stylist Studio
              </div>
              <h3 className="text-2xl font-medium text-white md:text-3xl">
                See the mashup before you commit to the cut.
              </h3>
            </div>
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-sm font-medium text-white transition-colors hover:border-cyan-400/30 hover:text-cyan-200"
            >
              {cameraActive ? <Camera className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              {cameraActive ? "Stop webcam" : "Use webcam"}
            </button>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,#18364b_0%,#0a1220_44%,#04070d_100%)]">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : previewBackground ? (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-95"
                style={previewBackground}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-[74%] w-[64%] rounded-[45%] border border-white/10 bg-slate-900/60">
                  <div className="absolute left-1/2 top-[18%] h-[18%] w-[32%] -translate-x-1/2 rounded-full bg-slate-800/90" />
                  <div className="absolute left-1/2 top-[28%] h-[38%] w-[42%] -translate-x-1/2 rounded-[42%] bg-slate-800/60" />
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/30 to-transparent" />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200 backdrop-blur">
                {previewModeLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
                {previewStyle}
              </span>
            </div>

            <HairstyleOverlay config={overlay} />

            <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-sm rounded-[1.75rem] border border-white/10 bg-slate-950/78 px-4 py-3 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Agent Mashup
                </div>
                <div className="mt-1 text-xl font-medium text-white">{mashupName}</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-400">
                  {agentSummary}
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-slate-950/72 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-300 backdrop-blur">
                {overlay.texture} texture • {overlay.fringe} fringe
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Style Base
              </div>
              <div className="mt-1 text-sm text-white">{previewStyle}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Overlay Mode
              </div>
              <div className="mt-1 text-sm text-white capitalize">{overlay.volume} volume</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Color Direction
              </div>
              <div className="mt-1 text-sm text-white capitalize">
                {overlay.colorName.replace("-", " ")}
              </div>
            </div>
          </div>

          {cameraError && (
            <p className="mt-4 text-sm text-amber-200">{cameraError}</p>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
              <Volume2 className="h-3.5 w-3.5" />
              Talk To The Agent
            </div>
            <h3 className="max-w-md text-2xl font-medium text-white md:text-3xl">
              Shape the brief out loud like you&apos;re in the chair.
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
              Ask for softness, polish, edge, lower maintenance, or a little
              more drama. The agent will rebalance the live overlay, remember
              your last few turns, and speak the strongest stylist-ready mashup
              back to you.
            </p>
          </div>

          <div className="mt-6 rounded-[2.2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setPreferences(prompt)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400/30 hover:text-cyan-200"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <textarea
              value={preferences}
              onChange={(event) => setPreferences(event.target.value)}
              placeholder="Type or dictate your preferences here..."
              className="mt-5 min-h-[180px] w-full rounded-[1.8rem] border border-white/10 bg-slate-950/85 p-5 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/40"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (speaking) {
                    stopSpeaking();
                  }

                  setVoiceReplyEnabled((current) => !current);
                }}
                disabled={!speechSupported}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {voiceReplyEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
                {speechSupported
                  ? voiceReplyEnabled
                    ? "Voice reply on"
                    : "Voice reply muted"
                  : "Voice reply unavailable"}
              </button>
              <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-400">
                Session memory {sessionTurns.length} turns
              </div>
              {speaking && (
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                  Speaking live response
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={toggleListening}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors ${
                  listening
                    ? "bg-rose-500 text-white hover:bg-rose-400"
                    : "border border-white/10 text-white hover:border-cyan-400/30 hover:text-cyan-200"
                }`}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {listening ? "Stop listening" : "Start talking"}
              </button>
              <button
                onClick={handleAgentSubmit}
                disabled={agentLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Wand2 className="h-4 w-4" />
                {agentLoading ? "Crafting mashup..." : "Create live mashup"}
              </button>
            </div>

            {voiceError && (
              <div className="mt-4 rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {voiceError}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[2rem] border border-white/10 bg-slate-950/68 p-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Stylist Response
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => speakReply(agentReply)}
                  disabled={!speechSupported || !agentReply.trim()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Hear response
                </button>
                {speaking && (
                  <button
                    onClick={stopSpeaking}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-rose-400/30 hover:text-rose-200"
                  >
                    <VolumeX className="h-3.5 w-3.5" />
                    Stop voice
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              {agentReply}
            </p>
            <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-slate-400">
              The agent now keeps the recent conversation in play, so follow-up
              requests like softer, shorter, or more editorial build on the
              previous direction instead of resetting the session.
            </div>
          </div>

          <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Session Memory
              </div>
              <div className="text-xs text-slate-500">
                Last {Math.min(sessionTurns.length, 6)} turns
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {sessionTurns.slice(-4).map((turn, index) => (
                <div
                  key={`${turn.speaker}-${index}-${turn.text.slice(0, 24)}`}
                  className={`max-w-[92%] rounded-[1.5rem] border px-4 py-3 ${
                    turn.speaker === "user"
                      ? "ml-auto border-cyan-400/20 bg-cyan-400/10 text-cyan-50"
                      : "border-white/10 bg-slate-950/65 text-slate-100"
                  }`}
                >
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                      turn.speaker === "user"
                        ? "text-cyan-200"
                        : "text-slate-500"
                    }`}
                  >
                    {turn.speaker === "user" ? "You" : "Stylist"}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">{turn.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
