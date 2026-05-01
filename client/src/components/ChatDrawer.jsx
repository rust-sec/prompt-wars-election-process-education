import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { callGemini, geminiMessage } from '../api';
import { getChatSystemInstruction } from '../data';

export default function ChatDrawer({ state, dispatch }) {
  const { chatOpen, chatMessages, chatInput, chatLoading, onboarding } = state;
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [chatOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && chatOpen) {
        dispatch({ type: 'CLOSE_CHAT' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatOpen, dispatch]);

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    // Add user message
    const userMsg = geminiMessage('user', text);
    dispatch({ type: 'ADD_CHAT_MESSAGE', message: userMsg });
    dispatch({ type: 'SET_CHAT_INPUT', value: '' });
    dispatch({ type: 'SET_CHAT_LOADING', loading: true });

    // Build history for multi-turn
    const history = [...chatMessages, userMsg];

    try {
      const systemInstruction = getChatSystemInstruction(
        onboarding.role, onboarding.country, onboarding.region, onboarding.experience
      );
      const response = await callGemini('', systemInstruction, history);
      const modelMsg = geminiMessage('model', response);
      dispatch({ type: 'ADD_CHAT_MESSAGE', message: modelMsg });
    } catch (err) {
      const errorMsg = geminiMessage('model', "Couldn't connect. Try again.");
      dispatch({ type: 'ADD_CHAT_MESSAGE', message: errorMsg });
    } finally {
      dispatch({ type: 'SET_CHAT_LOADING', loading: false });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const roleLabel = onboarding.role === 'voter' ? '🗳 Voter' : onboarding.role === 'candidate' ? '📢 Candidate' : '📖 Citizen';

  return (
    <>
      {/* Overlay */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 animate-fade-in"
          onClick={() => dispatch({ type: 'CLOSE_CHAT' })}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 bg-surface shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          chatOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full md:w-[420px]`}
        role="dialog"
        aria-label="Chat with CivicPath"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy">Ask CivicPath</h2>
            <span className="text-xs text-text-secondary">
              {roleLabel} · {onboarding.country}{onboarding.region ? `, ${onboarding.region}` : ''}
            </span>
          </div>
          <button
            onClick={() => dispatch({ type: 'CLOSE_CHAT' })}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close chat"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-14 h-14 bg-navy-faint rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="font-semibold text-text-primary mb-1">Ask anything about elections</h3>
              <p className="text-text-secondary text-sm max-w-xs">
                I can explain voter registration, primaries, campaign finance, and more.
              </p>
            </div>
          )}

          {chatMessages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const text = msg.parts[0]?.text || '';

            return (
              <div
                key={i}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex-shrink-0 w-7 h-7 bg-navy rounded-full flex items-center justify-center mr-2 mt-1">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-navy text-white rounded-br-md'
                      : 'bg-white text-text-primary border border-border shadow-sm rounded-bl-md'
                  }`}
                >
                  {text}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="flex-shrink-0 w-7 h-7 bg-navy rounded-full flex items-center justify-center mr-2 mt-1">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-surface">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-border focus-within:border-navy transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => dispatch({ type: 'SET_CHAT_INPUT', value: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about elections..."
              className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder-gray-400"
              disabled={chatLoading}
              id="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={!chatInput.trim() || chatLoading}
              className="flex-shrink-0 w-9 h-9 bg-navy text-white rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-navy-light transition-colors"
              aria-label="Send message"
              id="chat-send-btn"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
