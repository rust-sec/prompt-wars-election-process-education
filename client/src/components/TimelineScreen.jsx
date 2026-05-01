import {
  ClipboardCheck, FileText, CheckSquare, Megaphone,
  CalendarCheck, BarChart2, Flag, Check, Star,
} from 'lucide-react';
import { ELECTION_PHASES } from '../data';

const ICON_MAP = {
  ClipboardCheck, FileText, CheckSquare, Megaphone,
  CalendarCheck, BarChart2, Flag,
};

export default function TimelineScreen({ state, dispatch }) {
  const { selectedPhase, completedPhases, completedScenarios } = state;

  const handlePhaseClick = (phaseId) => {
    dispatch({ type: 'SELECT_PHASE', phaseId });
  };

  return (
    <>
      {/* Desktop — Left Sidebar */}
      <aside className="hidden md:flex flex-col w-80 min-w-[320px] border-r border-border bg-surface overflow-y-auto p-4">
        <h2 className="font-serif text-lg font-bold text-navy mb-4 px-2">Election Timeline</h2>
        <div className="space-y-2">
          {ELECTION_PHASES.map((phase) => {
            const Icon = ICON_MAP[phase.icon];
            const isSelected = selectedPhase === phase.id;
            const isCompleted = completedPhases.includes(phase.id);
            const hasScenario = completedScenarios.includes(phase.id);

            return (
              <button
                key={phase.id}
                onClick={() => handlePhaseClick(phase.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 phase-card-hover relative ${
                  isSelected
                    ? 'bg-navy-faint border-l-4 border-l-amber shadow-sm'
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
                id={`phase-${phase.id}`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    hasScenario
                      ? 'bg-amber text-white'
                      : isCompleted
                        ? 'bg-navy text-white'
                        : 'border-2 border-gray-300 text-gray-300'
                  }`}>
                    {hasScenario ? (
                      <Star size={14} fill="currentColor" />
                    ) : isCompleted ? (
                      <Check size={14} />
                    ) : (
                      <span className="text-[10px] font-bold">{phase.number}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className={`block text-sm font-semibold leading-tight ${
                      isSelected ? 'text-navy' : 'text-text-primary'
                    }`}>
                      {phase.name}
                    </span>
                    <span className="block text-xs text-text-secondary mt-0.5 truncate">
                      {phase.descriptor}
                    </span>
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-light text-amber text-[10px] font-semibold rounded-full">
                      {phase.deadline}
                    </span>
                  </div>

                  {/* Phase Icon */}
                  <div className={`flex-shrink-0 ${isSelected ? 'text-navy' : 'text-gray-400'}`}>
                    {Icon && <Icon size={18} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile — Horizontal Scroll Chips */}
      <div className="md:hidden w-full bg-surface border-b border-border px-3 py-3 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 min-w-max">
          {ELECTION_PHASES.map((phase) => {
            const isSelected = selectedPhase === phase.id;
            const isCompleted = completedPhases.includes(phase.id);
            const hasScenario = completedScenarios.includes(phase.id);

            return (
              <button
                key={phase.id}
                onClick={() => handlePhaseClick(phase.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-navy text-white shadow-md'
                    : isCompleted || hasScenario
                      ? 'bg-navy-faint text-navy border border-navy/20'
                      : 'bg-white text-text-secondary border border-border'
                }`}
              >
                {hasScenario && <Star size={12} className="text-amber" fill="currentColor" />}
                {isCompleted && !hasScenario && <Check size={12} />}
                {phase.name}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
