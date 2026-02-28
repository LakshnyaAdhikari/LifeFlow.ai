"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

interface VoiceInputProps {
    onSubmit: (text: string) => void;
    placeholder?: string;
    initialValue?: string;
    className?: string;
    buttonLabel?: string;
}

export function VoiceInput({
    onSubmit,
    placeholder = "Speak or type here...",
    initialValue = "",
    className = "",
    buttonLabel = "Submit"
}: VoiceInputProps) {
    const [text, setText] = useState(initialValue);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState('');
    // Use any to bypass TS error on window object
    const recognitionRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setError('');
            };

            recognition.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                }

                if (currentTranscript) {
                    // Append recognized speech to the existing text
                    setText(prev => {
                        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
                        return prev + separator + currentTranscript.trim() + ' ';
                    });
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech') {
                    setError(`Microphone error: ${event.error}`);
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                // Recognition stops automatically on silence depending on browser,
                // so we update the state to reflect it's no longer listening.
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            // If error wasn't already set
            setError('Your browser does not support speech recognition. Try Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                textareaRef.current?.focus();
            } catch (e) {
                console.error("Error starting recognition", e);
                // Might throw if already started
            }
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const handleSubmit = () => {
        if (text.trim()) {
            onSubmit(text.trim());
            // Optionally stop listening upon submit
            if (isListening) {
                recognitionRef.current?.stop();
            }
        }
    };

    return (
        <div className={`flex flex-col gap-2 w-full mx-auto ${className}`}>
            {error && (
                <div className="text-red-500 text-sm font-medium px-2 py-1 bg-red-50 dark:bg-red-500/10 rounded-md">
                    {error}
                </div>
            )}
            <div className="relative border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/50 shadow-sm transition-all overflow-hidden flex flex-col">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    placeholder={placeholder}
                    className="w-full min-h-[120px] p-4 bg-transparent resize-y outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 sm:text-lg"
                />

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors border ${isListening
                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                            }`}
                    >
                        {isListening ? (
                            <>
                                <MicOff size={18} className="animate-pulse text-red-500" />
                                <span>Stop Listening</span>
                            </>
                        ) : (
                            <>
                                <Mic size={18} className="text-blue-500 dark:text-blue-400" />
                                <span>Speak</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!text.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full font-medium shadow-sm hover:bg-blue-700 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={18} />
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
