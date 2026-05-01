import { MessageCircle } from 'lucide-react';
import { ELECTION_PHASES } from '../data';

export default function TopNav({ state, dispatch }) {
  const { onboarding, screen, completedPhases, completedScenarios } = state;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-40 flex items-center justify-between px-4 md:px-6">
        {/* Left — Wordmark */}
        <button
          onClick={() => onboarding.complete && dispatch({ type: 'SET_SCREEN', screen: 'timeline' })}
          className={`font-serif text-xl font-bold text-navy ${onboarding.complete ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} transition-opacity`}
          aria-label="CivicPath home"
        >
          CivicPath
        </button>

        {/* Center — Progress Dots */}
        {onboarding.complete && (
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: screen === 'badges' ? 'timeline' : 'badges' })}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="View progress and badges"
          >
            {ELECTION_PHASES.map((phase) => {
              const isCompleted = completedPhases.includes(phase.id);
              const hasScenario = completedScenarios.includes(phase.id);
              return (
                <div
                  key={phase.id}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    hasScenario
                      ? 'bg-amber scale-110'
                      : isCompleted
                        ? 'bg-navy'
                        : 'bg-gray-300'
                  }`}
                  title={phase.name}
                />
              );
            })}
          </button>
        )}

        {/* Right — Ask Anything */}
        {onboarding.complete && (
          <button
            onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
            className="hidden md:flex items-center gap-2 px-4 py-2 border-2 border-navy text-navy rounded-lg font-medium text-sm hover:bg-navy hover:text-white transition-all duration-200"
            id="ask-anything-btn"
          >
            <MessageCircle size={16} />
            Ask Anything
          </button>
        )}

        {/* Empty spacer for centering when no right button */}
        {!onboarding.complete && <div className="w-20" />}
      </nav>

      {/* Mobile FAB — Ask Anything */}
      {onboarding.complete && (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-navy text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-navy-light transition-colors active:scale-95"
          aria-label="Ask CivicPath"
          id="ask-anything-fab"
        >
          <MessageCircle size={22} />
        </button>
      )}
    </>
  );
}
