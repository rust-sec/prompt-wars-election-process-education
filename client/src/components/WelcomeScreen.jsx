import { useState } from 'react';
import { ArrowRight, CheckSquare, Megaphone, BookOpen, Sparkles, MapPin } from 'lucide-react';

export default function WelcomeScreen({ state, dispatch }) {
  const { onboarding } = state;
  const [showRegion, setShowRegion] = useState(false);

  const handleCountryChange = (e) => {
    dispatch({ type: 'SET_ONBOARDING_FIELD', field: 'country', value: e.target.value });
    if (e.target.value.length > 0) setShowRegion(true);
  };

  const handleLocationNext = () => {
    if (onboarding.country.trim()) {
      dispatch({ type: 'NEXT_ONBOARDING_STEP' });
    }
  };

  const handleRoleSelect = (role) => {
    dispatch({ type: 'SET_ONBOARDING_FIELD', field: 'role', value: role });
    setTimeout(() => dispatch({ type: 'NEXT_ONBOARDING_STEP' }), 300);
  };

  const handleExperienceSelect = (exp) => {
    dispatch({ type: 'SET_ONBOARDING_FIELD', field: 'experience', value: exp });
  };

  const handleBuildRoadmap = () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  };

  const roles = [
    {
      id: 'voter',
      icon: <CheckSquare size={28} />,
      title: 'Voter',
      desc: 'I want to participate in an election',
    },
    {
      id: 'candidate',
      icon: <Megaphone size={28} />,
      title: 'Candidate',
      desc: "I'm running for office",
    },
    {
      id: 'citizen',
      icon: <BookOpen size={28} />,
      title: 'Curious Citizen',
      desc: 'I want to understand how it all works',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 dot-grid-bg relative">
      {/* Hero */}
      <div className="text-center max-w-xl mb-10 animate-fade-in">
        <p className="text-navy font-semibold text-sm tracking-widest uppercase mb-4">CivicPath</p>

        {/* Ballot Box SVG */}
        <div className="flex justify-center mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <rect x="16" y="30" width="48" height="36" rx="4" stroke="#1B2F5E" strokeWidth="2.5" fill="none" />
            <rect x="30" y="30" width="20" height="4" rx="1" fill="#1B2F5E" />
            <rect x="24" y="22" width="32" height="12" rx="2" stroke="#1B2F5E" strokeWidth="2" fill="#F8F7F4" />
            <path d="M36 14L40 8L44 14" stroke="#E8A020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="37" y="14" width="6" height="10" rx="1" fill="#E8A020" opacity="0.3" />
            <line x1="28" y1="42" x2="52" y2="42" stroke="#E5E7EB" strokeWidth="1.5" />
            <line x1="28" y1="48" x2="52" y2="48" stroke="#E5E7EB" strokeWidth="1.5" />
            <line x1="28" y1="54" x2="44" y2="54" stroke="#E5E7EB" strokeWidth="1.5" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-navy leading-tight mb-4">
          Democracy is a process.<br />Let's walk through it together.
        </h1>
        <p className="text-text-secondary text-base md:text-lg">
          Answer 3 quick questions and we'll build your personalized election guide.
        </p>
      </div>

      {/* Onboarding Cards */}
      <div className="w-full max-w-lg">
        {/* Card 1 — Location */}
        {onboarding.step === 0 && (
          <div className="animate-slide-in bg-surface rounded-2xl shadow-lg border border-border p-6 md:p-8">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={18} className="text-amber" />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Step 1 of 3</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-navy mb-6">Where are you voting?</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="country-input" className="block text-sm font-medium text-text-secondary mb-1.5">
                  Country
                </label>
                <input
                  id="country-input"
                  type="text"
                  value={onboarding.country}
                  onChange={handleCountryChange}
                  placeholder="e.g., United States"
                  className="w-full px-4 py-3 border border-border rounded-lg text-text-primary bg-white focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-all"
                  autoFocus
                />
              </div>

              {showRegion && (
                <div className="animate-fade-in">
                  <label htmlFor="region-input" className="block text-sm font-medium text-text-secondary mb-1.5">
                    State / Region
                  </label>
                  <input
                    id="region-input"
                    type="text"
                    value={onboarding.region}
                    onChange={(e) =>
                      dispatch({ type: 'SET_ONBOARDING_FIELD', field: 'region', value: e.target.value })
                    }
                    placeholder="e.g., California"
                    className="w-full px-4 py-3 border border-border rounded-lg text-text-primary bg-white focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-all"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleLocationNext}
              disabled={!onboarding.country.trim()}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-navy text-white font-semibold py-3 px-6 rounded-lg hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              id="location-next-btn"
            >
              Next
              <ArrowRight size={18} className="text-amber" />
            </button>
          </div>
        )}

        {/* Card 2 — Role */}
        {onboarding.step === 1 && (
          <div className="animate-slide-in bg-surface rounded-2xl shadow-lg border border-border p-6 md:p-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-amber" />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Step 2 of 3</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-navy mb-6">What brings you here?</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id)}
                  className={`flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all duration-200 ${
                    onboarding.role === r.id
                      ? 'border-navy bg-navy text-white'
                      : 'border-border hover:border-navy bg-white text-text-primary'
                  }`}
                  id={`role-${r.id}-btn`}
                >
                  <div className={`mb-3 ${onboarding.role === r.id ? 'text-amber' : 'text-navy'}`}>
                    {r.icon}
                  </div>
                  <span className="font-semibold text-sm">{r.title}</span>
                  <span className={`text-xs mt-1 ${onboarding.role === r.id ? 'text-gray-300' : 'text-text-secondary'}`}>
                    {r.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card 3 — Experience */}
        {onboarding.step === 2 && (
          <div className="animate-slide-in bg-surface rounded-2xl shadow-lg border border-border p-6 md:p-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-amber" />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Step 3 of 3</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-navy mb-6">How familiar are you?</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'first-time', title: 'First Time', desc: 'This is new to me' },
                { id: 'experienced', title: 'Been There', desc: 'I want a refresher' },
              ].map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => handleExperienceSelect(exp.id)}
                  className={`flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all duration-200 ${
                    onboarding.experience === exp.id
                      ? 'border-navy bg-navy text-white'
                      : 'border-border hover:border-navy bg-white text-text-primary'
                  }`}
                  id={`experience-${exp.id}-btn`}
                >
                  <span className="font-semibold">{exp.title}</span>
                  <span className={`text-sm mt-1 ${onboarding.experience === exp.id ? 'text-gray-300' : 'text-text-secondary'}`}>
                    {exp.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Final CTA */}
        {onboarding.step === 2 && onboarding.experience && (
          <div className="mt-6 animate-fade-in">
            <button
              onClick={handleBuildRoadmap}
              className="w-full flex items-center justify-center gap-2 bg-amber text-navy font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 animate-pulse"
              id="build-roadmap-btn"
            >
              Build My Roadmap
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
