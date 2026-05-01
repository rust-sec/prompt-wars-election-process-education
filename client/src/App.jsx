import { useReducer, useEffect } from 'react';
import TopNav from './components/TopNav';
import WelcomeScreen from './components/WelcomeScreen';
import TimelineScreen from './components/TimelineScreen';
import DetailPanel from './components/DetailPanel';
import BadgesScreen from './components/BadgesScreen';
import ChatDrawer from './components/ChatDrawer';
import { BADGES } from './data';

const initialState = {
  screen: 'welcome',
  onboarding: {
    country: '',
    region: '',
    role: '',
    experience: '',
    step: 0,
    complete: false,
  },
  selectedPhase: null,
  phaseContent: {},
  phaseLoadingId: null,
  completedPhases: [],
  currentScenario: null,
  scenarioResponse: '',
  selectedOption: null,
  completedScenarios: [],
  chatOpen: false,
  chatMessages: [],
  chatInput: '',
  chatLoading: false,
  badges: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ONBOARDING_FIELD':
      return {
        ...state,
        onboarding: { ...state.onboarding, [action.field]: action.value },
      };
    case 'NEXT_ONBOARDING_STEP':
      return {
        ...state,
        onboarding: { ...state.onboarding, step: state.onboarding.step + 1 },
      };
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        onboarding: { ...state.onboarding, complete: true },
        screen: 'timeline',
      };
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'SELECT_PHASE':
      return {
        ...state,
        selectedPhase: action.phaseId,
        currentScenario: null,
        scenarioResponse: '',
        selectedOption: null,
      };
    case 'SET_PHASE_LOADING':
      return { ...state, phaseLoadingId: action.phaseId };
    case 'SET_PHASE_CONTENT':
      return {
        ...state,
        phaseContent: { ...state.phaseContent, [action.phaseId]: action.content },
        phaseLoadingId: null,
      };
    case 'PHASE_LOAD_ERROR':
      return { ...state, phaseLoadingId: null };
    case 'COMPLETE_PHASE':
      return {
        ...state,
        completedPhases: state.completedPhases.includes(action.phaseId)
          ? state.completedPhases
          : [...state.completedPhases, action.phaseId],
      };
    case 'START_SCENARIO':
      return {
        ...state,
        currentScenario: action.phaseId,
        scenarioResponse: '',
        selectedOption: null,
      };
    case 'SELECT_SCENARIO_OPTION':
      return { ...state, selectedOption: action.optionIndex };
    case 'SET_SCENARIO_RESPONSE':
      return { ...state, scenarioResponse: action.response };
    case 'COMPLETE_SCENARIO':
      return {
        ...state,
        completedScenarios: state.completedScenarios.includes(action.phaseId)
          ? state.completedScenarios
          : [...state.completedScenarios, action.phaseId],
        currentScenario: null,
        scenarioResponse: '',
        selectedOption: null,
      };
    case 'EXIT_SCENARIO':
      return {
        ...state,
        currentScenario: null,
        scenarioResponse: '',
        selectedOption: null,
      };
    case 'TOGGLE_CHAT':
      return { ...state, chatOpen: !state.chatOpen };
    case 'CLOSE_CHAT':
      return { ...state, chatOpen: false };
    case 'SET_CHAT_INPUT':
      return { ...state, chatInput: action.value };
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.message],
      };
    case 'SET_CHAT_LOADING':
      return { ...state, chatLoading: action.loading };
    case 'UNLOCK_BADGE':
      return {
        ...state,
        badges: state.badges.includes(action.badgeId)
          ? state.badges
          : [...state.badges, action.badgeId],
      };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Check for badge unlocks whenever phases/scenarios change
  useEffect(() => {
    BADGES.forEach((badge) => {
      if (!state.badges.includes(badge.id) && badge.unlockCondition(state)) {
        dispatch({ type: 'UNLOCK_BADGE', badgeId: badge.id });
      }
    });
  }, [state.completedPhases, state.completedScenarios]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <TopNav state={state} dispatch={dispatch} />

      <main>
        {state.screen === 'welcome' && (
          <div className="animate-fade-in">
            <WelcomeScreen state={state} dispatch={dispatch} />
          </div>
        )}

        {state.screen === 'timeline' && (
          <div className="animate-fade-in pt-14">
            <div className="flex flex-col md:flex-row h-[calc(100vh-56px)]">
              <TimelineScreen state={state} dispatch={dispatch} />
              <DetailPanel state={state} dispatch={dispatch} />
            </div>
          </div>
        )}

        {state.screen === 'badges' && (
          <div className="animate-fade-in pt-14">
            <BadgesScreen state={state} dispatch={dispatch} />
          </div>
        )}
      </main>

      {state.onboarding.complete && (
        <ChatDrawer state={state} dispatch={dispatch} />
      )}
    </div>
  );
}
