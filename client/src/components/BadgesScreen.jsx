import {
  ClipboardCheck, GraduationCap, Search, Megaphone,
  Star, Award, Lock, ArrowLeft,
} from 'lucide-react';
import { BADGES, ELECTION_PHASES } from '../data';

const ICON_MAP = {
  ClipboardCheck, GraduationCap, Search, Megaphone, Star, Award,
};

function BadgeCard({ badge, isUnlocked, isNew }) {
  const Icon = ICON_MAP[badge.icon] || Star;

  return (
    <div
      className={`relative flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-300 ${
        isUnlocked
          ? 'bg-surface border-border shadow-md'
          : 'bg-gray-50 border-gray-200'
      } ${isNew ? 'animate-bounce-in' : ''}`}
    >
      {/* Badge Circle */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
          isUnlocked
            ? 'shadow-lg'
            : 'grayscale opacity-50'
        }`}
        style={isUnlocked ? {
          backgroundColor: badge.color + '15',
          boxShadow: `0 0 20px ${badge.color}30`,
        } : {}}
      >
        {isUnlocked ? (
          <Icon
            size={32}
            style={{ color: badge.color }}
          />
        ) : (
          <div className="relative">
            <Icon size={32} className="text-gray-400" />
            <Lock size={14} className="absolute -bottom-1 -right-1 text-gray-400 bg-gray-50 rounded-full p-0.5" />
          </div>
        )}
      </div>

      {/* Text */}
      <h3 className={`font-semibold text-sm mb-1 ${isUnlocked ? 'text-text-primary' : 'text-gray-400'}`}>
        {badge.name}
      </h3>
      <p className={`text-xs ${isUnlocked ? 'text-text-secondary' : 'text-gray-400'}`}>
        {badge.description}
      </p>

      {/* Unlocked Indicator */}
      {isUnlocked && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function BadgesScreen({ state, dispatch }) {
  const { badges, completedPhases } = state;
  const progress = Math.round((completedPhases.length / ELECTION_PHASES.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Back Link */}
      <button
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'timeline' })}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Timeline
      </button>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl font-bold text-navy mb-2">Your Achievements</h1>
        <p className="text-text-secondary">Earn badges as you explore the election process</p>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {BADGES.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            isUnlocked={badges.includes(badge.id)}
            isNew={false}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-text-primary">Your Journey</h3>
          <span className="text-sm font-bold text-navy">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-navy to-amber rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {completedPhases.length} of {ELECTION_PHASES.length} phases explored
        </p>
      </div>
    </div>
  );
}
