import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle, XCircle, RefreshCw, Sparkles } from 'lucide-react';
import { callGemini } from '../api';
import {
  ELECTION_PHASES, SCENARIOS, QUICK_FACTS,
  getPhaseSystemInstruction, getPhaseUserPrompt,
  getScenarioSystemInstruction, getScenarioUserPrompt,
} from '../data';

// ── Loading Skeleton ──────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-3 py-4">
      <div className="shimmer-bar h-4 w-full rounded" />
      <div className="shimmer-bar h-4 w-5/6 rounded" />
      <div className="shimmer-bar h-4 w-4/6 rounded" />
    </div>
  );
}

// ── Scenario Card ─────────────────────────────────────────────────────────
function ScenarioCard({ state, dispatch }) {
  const { currentScenario, selectedOption, scenarioResponse, onboarding } = state;
  const scenario = SCENARIOS[currentScenario];
  const phase = ELECTION_PHASES.find((p) => p.id === currentScenario);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOptionSelect = async (index) => {
    dispatch({ type: 'SELECT_SCENARIO_OPTION', optionIndex: index });
    setLoading(true);
    setError(null);

    try {
      const selected = scenario.options[index];
      const correct = scenario.options[scenario.correctIndex];
      const response = await callGemini(
        getScenarioUserPrompt(
          onboarding.role, onboarding.country, onboarding.region,
          scenario, selected, correct
        ),
        getScenarioSystemInstruction()
      );
      dispatch({ type: 'SET_SCENARIO_RESPONSE', response });
    } catch (err) {
      setError(err.message || 'Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    dispatch({ type: 'COMPLETE_SCENARIO', phaseId: currentScenario });
    dispatch({ type: 'COMPLETE_PHASE', phaseId: currentScenario });
  };

  if (!scenario || !phase) return null;

  const isCorrect = selectedOption === scenario.correctIndex;

  return (
    <div className="animate-fade-scale">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => dispatch({ type: 'EXIT_SCENARIO' })}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-navy transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Timeline
        </button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-sm text-text-secondary">{phase.name}</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-sm font-semibold text-navy">Scenario</span>
      </div>

      {/* Scenario Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        {/* Phase Icon Circle */}
        <div className="w-14 h-14 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles size={24} className="text-amber" />
        </div>

        <p className="text-center text-amber font-bold text-xs uppercase tracking-widest mb-3">
          What Would You Do?
        </p>

        <p className="text-center text-text-primary text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          {scenario.text}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {scenario.options.map((option, i) => {
            const isSelected = selectedOption === i;
            const isDisabled = selectedOption !== null;
            const showCorrect = selectedOption !== null && i === scenario.correctIndex;

            return (
              <button
                key={option.label}
                onClick={() => !isDisabled && handleOptionSelect(i)}
                disabled={isDisabled}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? isCorrect
                      ? 'border-success bg-green-50'
                      : 'border-red-400 bg-red-50'
                    : showCorrect && selectedOption !== null
                      ? 'border-success bg-green-50'
                      : isDisabled
                        ? 'border-border bg-gray-50 opacity-50'
                        : 'border-border hover:border-navy bg-white'
                }`}
                id={`scenario-option-${option.label}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected
                      ? isCorrect ? 'bg-success text-white' : 'bg-red-400 text-white'
                      : showCorrect
                        ? 'bg-success text-white'
                        : 'bg-gray-100 text-text-secondary'
                  }`}>
                    {isSelected && isCorrect ? <CheckCircle size={16} /> :
                     isSelected && !isCorrect ? <XCircle size={16} /> :
                     showCorrect ? <CheckCircle size={16} /> :
                     option.label}
                  </span>
                  <span className="text-sm text-text-primary leading-relaxed">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* AI Response */}
        {loading && (
          <div className="mt-6">
            <LoadingSkeleton />
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-600 text-sm mb-2">{error}</p>
            <button
              onClick={() => handleOptionSelect(selectedOption)}
              className="flex items-center gap-1 mx-auto text-sm text-navy font-semibold hover:underline"
            >
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        )}

        {scenarioResponse && (
          <div className="mt-6 animate-slide-up">
            <div className={`p-5 rounded-xl border ${
              isCorrect
                ? 'bg-green-50 border-success/30'
                : 'bg-amber-light border-amber/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle size={18} className="text-success" />
                ) : (
                  <XCircle size={18} className="text-amber" />
                )}
                <span className="font-semibold text-sm">
                  {isCorrect ? 'Great choice!' : 'Not quite — here\'s why'}
                </span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed">{scenarioResponse}</p>
            </div>

            <button
              onClick={handleContinue}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-navy text-white font-semibold py-3 px-6 rounded-xl hover:bg-navy-light transition-all"
              id="scenario-continue-btn"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Phase Detail Content ──────────────────────────────────────────────────
function PhaseDetail({ state, dispatch }) {
  const { selectedPhase, phaseContent, phaseLoadingId, onboarding } = state;
  const phase = ELECTION_PHASES.find((p) => p.id === selectedPhase);
  const [error, setError] = useState(null);

  const fetchContent = useCallback(async () => {
    if (!phase || phaseContent[phase.id] || phaseLoadingId === phase.id) return;

    dispatch({ type: 'SET_PHASE_LOADING', phaseId: phase.id });
    setError(null);

    try {
      const content = await callGemini(
        getPhaseUserPrompt(
          phase.name, onboarding.role, onboarding.country,
          onboarding.region, onboarding.experience
        ),
        getPhaseSystemInstruction()
      );
      dispatch({ type: 'SET_PHASE_CONTENT', phaseId: phase.id, content });
      dispatch({ type: 'COMPLETE_PHASE', phaseId: phase.id });
    } catch (err) {
      setError(err.message || 'Failed to load content.');
      dispatch({ type: 'PHASE_LOAD_ERROR' });
    }
  }, [phase, phaseContent, phaseLoadingId, onboarding, dispatch]);

  useEffect(() => {
    fetchContent();
  }, [selectedPhase]);

  if (!phase) return null;

  const roleLabel = onboarding.role === 'voter' ? '🗳 Voter' : onboarding.role === 'candidate' ? '📢 Candidate' : '📖 Citizen';
  const facts = QUICK_FACTS[phase.id]?.[onboarding.role] || [];
  const hasScenario = !!SCENARIOS[phase.id];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy mb-1">{phase.name}</h2>
      <p className="text-text-secondary text-sm mb-3">What this means for you</p>
      <span className="inline-block px-3 py-1 bg-navy-faint text-navy text-xs font-semibold rounded-full mb-6">
        {roleLabel} perspective
      </span>

      {/* Content */}
      {phaseLoadingId === phase.id && <LoadingSkeleton />}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button
            onClick={fetchContent}
            className="flex items-center gap-1 text-sm text-navy font-semibold hover:underline"
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      )}

      {phaseContent[phase.id] && (
        <div className="mb-6">
          <p className="text-text-primary leading-relaxed text-[15px]">{phaseContent[phase.id]}</p>
        </div>
      )}

      {/* Quick Facts */}
      {facts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {facts.map((fact, i) => (
            <span
              key={i}
              className="inline-block px-3 py-1.5 bg-amber-light text-text-primary text-xs rounded-full border border-amber/20"
            >
              {fact}
            </span>
          ))}
        </div>
      )}

      {/* Scenario CTA */}
      {hasScenario && (
        <button
          onClick={() => dispatch({ type: 'START_SCENARIO', phaseId: phase.id })}
          className="flex items-center gap-2 bg-amber text-navy font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          id="test-knowledge-btn"
        >
          <Sparkles size={18} />
          Test Your Knowledge
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

// ── Detail Panel (Right Side) ─────────────────────────────────────────────
export default function DetailPanel({ state, dispatch }) {
  const { selectedPhase, currentScenario } = state;

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="p-6 md:p-10 max-w-2xl">
        {/* Empty State */}
        {!selectedPhase && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 bg-navy-faint rounded-full flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1B2F5E" strokeWidth="1.5" aria-hidden="true">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-serif text-xl text-navy font-bold mb-2">Select a phase to explore</h3>
            <p className="text-text-secondary text-sm max-w-xs">
              Click on any phase in the timeline to learn what it means for you and test your knowledge.
            </p>
          </div>
        )}

        {/* Scenario Mode */}
        {selectedPhase && currentScenario && (
          <ScenarioCard state={state} dispatch={dispatch} />
        )}

        {/* Phase Detail Mode */}
        {selectedPhase && !currentScenario && (
          <PhaseDetail state={state} dispatch={dispatch} />
        )}
      </div>
    </div>
  );
}
