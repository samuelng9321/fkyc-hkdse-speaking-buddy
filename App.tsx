
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Power, Loader2, ChevronLeft, Award, RefreshCcw } from 'lucide-react';
import ReferencePanel from './components/ReferencePanel';
import Avatar from './components/Avatar';
import Directory from './components/Directory';
import { TOPICS, getSystemInstruction } from './constants';
import { Topic, ConnectionState } from './types';
import { arrayBufferToBase64, decodeAudioData, float32ToPCM16, base64ToUint8Array } from './services/audioUtils';

const App: React.FC = () => {
    // --- State ---
    const [apiKey, setApiKey] = useState<string>('');
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [volume, setVolume] = useState<number>(0);
    const [isMicOn, setIsMicOn] = useState<boolean>(true);
    const [subtitle, setSubtitle] = useState<string>('');
    const [isAvatarSpeaking, setIsAvatarSpeaking] = useState<boolean>(false);
    const [userTurnCount, setUserTurnCount] = useState<number>(0);

    // --- Refs for Audio & Session ---
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isModelTurnRef = useRef<boolean>(false);
    const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isSessionActiveRef = useRef<boolean>(false);

    // Fetch API key from serverless endpoint (for production security)
    const fetchApiKey = async (): Promise<string | null> => {
        // In development, use environment variable directly if available
        if (process.env.API_KEY) {
            return process.env.API_KEY;
        }

        try {
            const response = await fetch('/api/auth');
            if (!response.ok) {
                console.error('Failed to fetch API key:', response.statusText);
                return null;
            }
            const data = await response.json();
            return data.key;
        } catch (error) {
            console.error('Error fetching API key:', error);
            return null;
        }
    };

    const updateVolume = useCallback(() => {
        if (analyzerRef.current) {
            const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
            analyzerRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            setVolume((sum / dataArray.length) / 100);
        }
        setIsAvatarSpeaking(audioQueueRef.current.length > 0);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
    }, []);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(updateVolume);
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); }
    }, [updateVolume]);

    const connect = async () => {
        if (!selectedTopic) return;

        setConnectionState('connecting');
        setSubtitle("");
        setUserTurnCount(0);
        isModelTurnRef.current = false;

        // Fetch API key from serverless endpoint
        const key = await fetchApiKey();
        if (!key) {
            setConnectionState('error');
            return;
        }
        setApiKey(key);

        try {
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;

            const analyzer = outputCtx.createAnalyser();
            analyzer.fftSize = 256;
            analyzerRef.current = analyzer;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: apiKey });
            const instruction = getSystemInstruction(selectedTopic);

            const config = {
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: instruction,
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
                    outputAudioTranscription: {}
                }
            };

            const sessionPromise = ai.live.connect({
                ...config,
                callbacks: {
                    onopen: () => {
                        setConnectionState('connected');
                        nextStartTimeRef.current = 0;
                        isSessionActiveRef.current = true;

                        // Start heartbeat to keep connection alive (every 25 seconds)
                        heartbeatIntervalRef.current = setInterval(() => {
                            if (sessionPromiseRef.current && isSessionActiveRef.current) {
                                sessionPromiseRef.current.then(session => {
                                    try {
                                        // Send minimal audio data as heartbeat
                                        const emptyAudio = new Int16Array(160); // 10ms of silence at 16kHz
                                        session.sendRealtimeInput({
                                            media: { mimeType: 'audio/pcm;rate=16000', data: arrayBufferToBase64(emptyAudio.buffer) }
                                        });
                                    } catch (err) {
                                        console.warn('Heartbeat failed:', err);
                                    }
                                });
                            }
                        }, 25000);

                        // SAM STARTS FIRST: Immediate hidden trigger
                        setTimeout(() => {
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then(session => {
                                    session.sendRealtimeInput({
                                        content: {
                                            role: "user",
                                            parts: [{ text: "Sam, please start the discussion now by greeting me and introducing the task." }]
                                        }
                                    });
                                });
                            }
                        }, 100);

                        if (!inputAudioContextRef.current || !streamRef.current) return;

                        // Setup audio capture with AudioWorklet (preferred) or ScriptProcessor fallback (mobile)
                        const setupAudioCapture = async () => {
                            const ctx = inputAudioContextRef.current!;
                            const stream = streamRef.current!;
                            const source = ctx.createMediaStreamSource(stream);
                            inputSourceRef.current = source;

                            // Helper to send audio data
                            const sendAudioData = (buffer: ArrayBuffer) => {
                                if (!isMicOn || audioQueueRef.current.length > 0) return;
                                if (sessionPromiseRef.current && isSessionActiveRef.current) {
                                    sessionPromiseRef.current.then(session => {
                                        try {
                                            session.sendRealtimeInput({
                                                media: { mimeType: 'audio/pcm;rate=16000', data: arrayBufferToBase64(buffer) }
                                            });
                                        } catch (err) {
                                            console.warn('Failed to send audio:', err);
                                        }
                                    });
                                }
                            };

                            // Try AudioWorklet first (modern browsers)
                            if (ctx.audioWorklet) {
                                try {
                                    await ctx.audioWorklet.addModule('/audio-processor.js');
                                    const workletNode = new AudioWorkletNode(ctx, 'audio-capture-processor');
                                    workletNodeRef.current = workletNode;

                                    workletNode.port.onmessage = (event) => {
                                        if (event.data.type === 'audio') {
                                            sendAudioData(event.data.data);
                                        }
                                    };

                                    source.connect(workletNode);
                                    workletNode.connect(ctx.destination);
                                    console.log('Using AudioWorklet for audio capture');
                                    return;
                                } catch (err) {
                                    console.warn('AudioWorklet failed, falling back to ScriptProcessor:', err);
                                }
                            }

                            // Fallback to ScriptProcessorNode (mobile/older browsers)
                            console.log('Using ScriptProcessor fallback for audio capture');
                            const processor = ctx.createScriptProcessor(4096, 1, 1);

                            processor.onaudioprocess = (e) => {
                                if (!isMicOn || audioQueueRef.current.length > 0) return;
                                const inputData = e.inputBuffer.getChannelData(0);
                                const int16 = new Int16Array(inputData.length);
                                for (let i = 0; i < inputData.length; i++) {
                                    const s = Math.max(-1, Math.min(1, inputData[i]));
                                    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                                }
                                sendAudioData(int16.buffer);
                            };

                            source.connect(processor);
                            processor.connect(ctx.destination);
                        };

                        setupAudioCapture().catch(err => {
                            console.error('Audio capture setup failed:', err);
                        });
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const text = msg.serverContent?.outputTranscription?.text;
                        if (text) {
                            setSubtitle(prev => {
                                const newText = prev + text;
                                // Detect if the session finished flag was sent
                                if (newText.includes('[SESSION_FINISHED]')) {
                                    setConnectionState('finished');
                                    return newText.replace('[SESSION_FINISHED]', '');
                                }
                                return newText;
                            });
                        }

                        if (text && !isModelTurnRef.current) {
                            setSubtitle(text);
                            isModelTurnRef.current = true;
                        }

                        if (msg.serverContent?.turnComplete) {
                            isModelTurnRef.current = false;
                            // Count a turn as completed
                            setUserTurnCount(prev => prev + 1);
                        }

                        if (msg.serverContent?.interrupted) {
                            setSubtitle("");
                            isModelTurnRef.current = false;
                            audioQueueRef.current.forEach(s => s.stop());
                            audioQueueRef.current = [];
                            nextStartTimeRef.current = 0;
                        }

                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current && analyzerRef.current) {
                            const buffer = await decodeAudioData(base64ToUint8Array(audioData), outputAudioContextRef.current, 24000);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = buffer;
                            source.connect(analyzerRef.current);
                            analyzerRef.current.connect(outputAudioContextRef.current.destination);
                            const startTime = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            source.start(startTime);
                            nextStartTimeRef.current = startTime + buffer.duration;
                            audioQueueRef.current.push(source);
                            source.onended = () => { audioQueueRef.current = audioQueueRef.current.filter(s => s !== source); };
                        }
                    },
                    onclose: (event: any) => {
                        console.log('WebSocket closed');
                        console.log('Close code:', event?.code);
                        console.log('Close reason:', event?.reason);
                        console.log('Was clean:', event?.wasClean);
                        console.log('Full event:', JSON.stringify(event));
                        setConnectionState('disconnected');
                        cleanup();
                    },
                    onerror: (error: any) => {
                        console.error('WebSocket error:', error);
                        console.error('Error details:', JSON.stringify(error));
                        setConnectionState('error');
                        cleanup();
                    }
                }
            });
            sessionPromiseRef.current = sessionPromise;
        } catch (e) {
            setConnectionState('error');
            cleanup();
        }
    };

    const requestFeedback = () => {
        if (sessionPromiseRef.current) {
            setConnectionState('grading');
            sessionPromiseRef.current.then(session => {
                session.sendRealtimeInput({
                    content: {
                        role: "user",
                        parts: [{ text: "[REQUEST_FEEDBACK] That's all for our discussion. Please give me oral feedback now. Tell me if I used target expressions, gave reasons and examples, and how I can improve." }]
                    }
                });
            });
        }
    };

    const disconnect = () => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
        }
        cleanup();
        setConnectionState('disconnected');
    };

    const cleanup = () => {
        // Clear heartbeat interval
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
        isSessionActiveRef.current = false;
        if (workletNodeRef.current) { workletNodeRef.current.disconnect(); workletNodeRef.current = null; }
        if (inputSourceRef.current) { inputSourceRef.current.disconnect(); inputSourceRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (inputAudioContextRef.current) { inputAudioContextRef.current.close(); inputAudioContextRef.current = null; }
        if (outputAudioContextRef.current) { outputAudioContextRef.current.close(); outputAudioContextRef.current = null; }
        audioQueueRef.current.forEach(s => s.stop());
        audioQueueRef.current = [];
        setVolume(0);
        setSubtitle("");
        isModelTurnRef.current = false;
    };

    const handleBackToHome = () => {
        disconnect();
        setSelectedTopic(null);
    };

    if (!selectedTopic) return <Directory topics={TOPICS} onSelectTopic={setSelectedTopic} />;

    return (
        <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 font-sans overflow-hidden">
            <div className="order-2 md:order-1 w-full md:w-1/3 md:max-w-md h-[55%] md:h-full border-t md:border-t-0 md:border-r border-slate-200 z-10 bg-white">
                <ReferencePanel topic={selectedTopic} />
            </div>

            <div className="order-1 md:order-2 flex-1 h-[45%] md:h-full flex flex-col relative bg-slate-100">
                <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20">
                    <div className="flex items-center gap-2">
                        <button onClick={handleBackToHome} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="font-bold text-slate-800 text-sm md:text-base truncate max-w-[150px] sm:max-w-none">{selectedTopic.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${connectionState === 'connected' ? 'bg-green-100 text-green-700' :
                            connectionState === 'grading' ? 'bg-indigo-100 text-indigo-700' :
                                connectionState === 'finished' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-500'
                            }`}>
                            {connectionState}
                        </span>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center relative p-4 overflow-hidden">
                    <div className="mb-4 md:mb-8 shrink-0">
                        <Avatar volume={volume} isListening={connectionState === 'connected' && !isAvatarSpeaking} />
                    </div>

                    <div className="absolute bottom-24 md:bottom-36 w-full max-w-xl px-4 flex flex-col items-center gap-4 z-10 pointer-events-none">
                        {subtitle && (
                            <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-center shadow-2xl animate-fade-in pointer-events-auto max-h-40 overflow-y-auto border border-white/10">
                                <p className="text-sm md:text-lg font-medium leading-relaxed">{subtitle}</p>
                            </div>
                        )}

                        {/* Feedback Request Button - Only visible after 3 user turns */}
                        {userTurnCount >= 3 && connectionState === 'connected' && (
                            <button
                                onClick={requestFeedback}
                                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-6 py-2 rounded-full font-black text-sm shadow-lg animate-bounce pointer-events-auto flex items-center gap-2"
                            >
                                <Award className="w-4 h-4" />
                                Finish & Get Feedback
                            </button>
                        )}

                        {/* Session Finished View */}
                        {connectionState === 'finished' && (
                            <div className="bg-white p-6 rounded-3xl shadow-2xl pointer-events-auto border-2 border-indigo-500 text-center animate-fade-in">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Practice Complete!</h3>
                                <p className="text-slate-600 text-sm mb-4">Sam has given his feedback. Ready for another round?</p>
                                <button
                                    onClick={() => { cleanup(); connect(); }}
                                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                    Restart Practice
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-4 md:bottom-8 flex items-center gap-3 bg-white p-3 rounded-2xl shadow-2xl z-30 border border-slate-100">
                        {connectionState === 'disconnected' || connectionState === 'error' || connectionState === 'connecting' ? (
                            <button onClick={connect} disabled={connectionState === 'connecting'} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg">
                                {connectionState === 'connecting' ? <Loader2 className="animate-spin w-5 h-5" /> : <Power className="w-5 h-5" />}
                                Start Discussion
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setIsMicOn(!isMicOn)} className={`p-4 rounded-xl transition-all ${isMicOn ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-600'}`}>
                                    {isMicOn ? <Mic /> : <MicOff />}
                                </button>
                                {connectionState === 'grading' ? (
                                    <div className="flex items-center gap-3 px-6 py-3 bg-slate-100 rounded-xl text-slate-600 font-bold">
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        Sam is thinking...
                                    </div>
                                ) : connectionState === 'finished' ? (
                                    <button onClick={handleBackToHome} className="bg-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold transition-all">
                                        Back to Topics
                                    </button>
                                ) : (
                                    <button onClick={disconnect} className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg">
                                        End Session
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
