// ── Election Phases ────────────────────────────────────────────────────────
export const ELECTION_PHASES = [
  {
    id: 'registration',
    number: '01',
    name: 'Voter Registration',
    descriptor: 'Establish your right to vote',
    deadline: 'Varies by state',
    icon: 'ClipboardCheck',
  },
  {
    id: 'candidate-filing',
    number: '02',
    name: 'Candidate Filing',
    descriptor: 'Officially declare your candidacy',
    deadline: '6–12 months before election',
    icon: 'FileText',
  },
  {
    id: 'primary',
    number: '03',
    name: 'Primary Election',
    descriptor: 'Parties select their nominees',
    deadline: 'Varies by state',
    icon: 'CheckSquare',
  },
  {
    id: 'campaign-period',
    number: '04',
    name: 'Campaign Period',
    descriptor: 'Candidates make their case',
    deadline: 'Weeks to months',
    icon: 'Megaphone',
  },
  {
    id: 'election-day',
    number: '05',
    name: 'Election Day',
    descriptor: 'Citizens cast their votes',
    deadline: 'First Tue after first Mon in Nov',
    icon: 'CalendarCheck',
  },
  {
    id: 'counting',
    number: '06',
    name: 'Vote Counting & Certification',
    descriptor: 'Ballots are tallied and results certified',
    deadline: 'Days to weeks after election',
    icon: 'BarChart2',
  },
  {
    id: 'transition',
    number: '07',
    name: 'Transition & Inauguration',
    descriptor: 'Power transfers to elected officials',
    deadline: 'Jan 20 (US Presidential)',
    icon: 'Flag',
  },
];

// ── Quick Facts per Phase per Role ─────────────────────────────────────────
export const QUICK_FACTS = {
  registration: {
    voter: [
      'Registration deadlines range from 30 days to same-day by state',
      '21 states + DC offer automatic voter registration',
      'You can register online in 40+ states',
    ],
    candidate: [
      'Candidates must be registered voters themselves',
      'Some offices require residency in the district',
      'Registration drives can help build early support',
    ],
    citizen: [
      'About 1 in 4 eligible Americans are not registered',
      'The National Voter Registration Act of 1993 simplified the process',
      'Registration data is public record in most states',
    ],
  },
  'candidate-filing': {
    voter: [
      'Filing deadlines determine who appears on your ballot',
      'Write-in candidates may file closer to election day',
      'You can check filed candidates at your state election website',
    ],
    candidate: [
      'Filing fees range from $0 to thousands depending on office',
      'Petition signatures can substitute for filing fees in many states',
      'You must meet age, residency, and citizenship requirements',
    ],
    citizen: [
      'Filing requirements vary dramatically by office level',
      'Federal candidates file with the FEC',
      'Some states allow online candidate filing',
    ],
  },
  primary: {
    voter: [
      '14 states hold open primaries — no party registration needed',
      'Primary dates vary from March to September',
      'Turnout in primaries is typically 15–30% of eligible voters',
    ],
    candidate: [
      'Winning a primary is often the biggest hurdle',
      'Runoff elections occur in some states if no candidate gets 50%+',
      'Delegate allocation rules differ by party',
    ],
    citizen: [
      'The first U.S. primary was held in 1901',
      'Caucuses are an alternative to primaries in some states',
      'Closed primaries restrict voting to registered party members',
    ],
  },
  'campaign-period': {
    voter: [
      'Campaign finance reports are public — check OpenSecrets.org',
      'Debates are typically held in Sept–Oct before general elections',
      'Early voting may begin during the campaign period',
    ],
    candidate: [
      'Individual contribution limits are $3,300 per election (2024)',
      'All expenditures over $200 must be reported to the FEC',
      'Digital ad spending now rivals traditional media',
    ],
    citizen: [
      'The average U.S. presidential campaign costs over $1 billion',
      'Campaigns must disclose donors who give more than $200',
      'The first televised debate was Kennedy vs. Nixon in 1960',
    ],
  },
  'election-day': {
    voter: [
      'Polls open 6am–8pm in most states',
      'Photo ID required in 35 states',
      'Provisional ballots available if not on rolls',
    ],
    candidate: [
      'Campaigning near polling places is restricted by law',
      'Exit polls begin reporting after polls close',
      'Observers from both parties monitor the process',
    ],
    citizen: [
      'Election Day is always the first Tuesday after the first Monday in November',
      '11 states have made Election Day a state holiday',
      'About 155 million people voted in the 2020 presidential election',
    ],
  },
  counting: {
    voter: [
      'Mail-in ballots may take days to count — this is normal',
      'Results are unofficial until certified by election officials',
      'You can track your ballot status online in most states',
    ],
    candidate: [
      'Recounts are triggered automatically within narrow margins',
      'Candidates can request recounts within specific deadlines',
      'Certification typically happens 2–4 weeks after election day',
    ],
    citizen: [
      'Hand counting is still used in some small jurisdictions',
      'Audits verify electronic results against paper trails',
      'The Electoral College formally votes in mid-December',
    ],
  },
  transition: {
    voter: [
      'The transition period is about 11 weeks for the presidency',
      'New officials take oaths of office at inauguration',
      'Your representatives\' contact info changes — update your records',
    ],
    candidate: [
      'Transition teams begin planning before the election',
      'Cabinet and staff appointments happen during transition',
      'Budget priorities must be set before the first legislative session',
    ],
    citizen: [
      'The Presidential Transition Act provides funding and resources',
      'Inauguration Day has been January 20 since 1937',
      'State and local transitions vary widely in length',
    ],
  },
};

// ── Scenarios ──────────────────────────────────────────────────────────────
export const SCENARIOS = {
  registration: {
    text: "It's 30 days before Election Day and you just moved to a new address. You're worried your voter registration is outdated. What should you do?",
    options: [
      { label: 'A', text: 'Do nothing — your old registration is still valid anywhere in the state.' },
      { label: 'B', text: 'Update your voter registration with your new address immediately.' },
      { label: 'C', text: "Show up on Election Day with a utility bill — that's enough proof of address." },
      { label: 'D', text: 'Register at the polling place on Election Day.' },
    ],
    correctIndex: 1,
  },
  primary: {
    text: "You support a candidate in an upcoming primary but you're registered as an independent. Your friend says you can't vote in the primary. Is your friend right?",
    options: [
      { label: 'A', text: 'Yes, only registered party members can ever vote in primaries.' },
      { label: 'B', text: 'No — independents can always vote in any primary they choose.' },
      { label: 'C', text: 'It depends on your state — some have open primaries, others are closed to registered party members only.' },
      { label: 'D', text: 'Only if you re-register as a party member at least 1 year in advance.' },
    ],
    correctIndex: 2,
  },
  'campaign-period': {
    text: "You're a first-time candidate and a local business owner offers to donate $10,000 cash directly to you personally to help your campaign. What should you do?",
    options: [
      { label: 'A', text: 'Accept it — cash donations are fine as long as you report them later.' },
      { label: 'B', text: 'Decline — cash contributions above legal limits and direct personal payments violate campaign finance law.' },
      { label: 'C', text: 'Accept only $2,500 and return the rest.' },
      { label: 'D', text: 'Accept it but keep it separate from your personal bank account.' },
    ],
    correctIndex: 1,
  },
  'election-day': {
    text: "You arrive at your polling place and the poll worker says your name isn't on the voter rolls, even though you registered 2 months ago. The polls close in 3 hours. What do you do?",
    options: [
      { label: 'A', text: "Leave and accept that you can't vote today." },
      { label: 'B', text: 'Call your local election office immediately to verify your registration status.' },
      { label: 'C', text: 'Ask for a provisional ballot and cast your vote — it will be counted if your registration is confirmed.' },
      { label: 'D', text: 'Go to a different polling location and try again.' },
    ],
    correctIndex: 2,
  },
};

// ── Badges ─────────────────────────────────────────────────────────────────
export const BADGES = [
  {
    id: 'registered',
    name: 'Registration Pro',
    description: 'Explored the Voter Registration phase',
    icon: 'ClipboardCheck',
    color: '#10B981',
    unlockCondition: (state) => state.completedPhases.includes('registration'),
  },
  {
    id: 'primary-school',
    name: 'Primary School',
    description: 'Explored the Primary Election phase',
    icon: 'GraduationCap',
    color: '#3B82F6',
    unlockCondition: (state) => state.completedPhases.includes('primary'),
  },
  {
    id: 'ballot-decoder',
    name: 'Ballot Decoder',
    description: 'Completed the Election Day scenario',
    icon: 'Search',
    color: '#E8A020',
    unlockCondition: (state) => state.completedScenarios.includes('election-day'),
  },
  {
    id: 'campaign-trail',
    name: 'On the Trail',
    description: 'Explored the Campaign Period phase',
    icon: 'Megaphone',
    color: '#8B5CF6',
    unlockCondition: (state) => state.completedPhases.includes('campaign-period'),
  },
  {
    id: 'scenario-ace',
    name: 'Scenario Ace',
    description: 'Completed 3 or more scenarios',
    icon: 'Star',
    color: '#F59E0B',
    unlockCondition: (state) => state.completedScenarios.length >= 3,
  },
  {
    id: 'full-cycle',
    name: 'Full Cycle',
    description: 'Explored all 7 election phases',
    icon: 'Award',
    color: '#1B2F5E',
    unlockCondition: (state) => state.completedPhases.length >= 7,
  },
];

// ── System Prompts ─────────────────────────────────────────────────────────
export function getPhaseSystemInstruction() {
  return `You are CivicPath, an election education assistant. You explain election topics in plain, jargon-free language. No political opinions. Strictly educational and nonpartisan. Do not use bullet points — write in flowing, readable prose. Keep responses to 4–6 sentences.`;
}

export function getPhaseUserPrompt(phaseName, role, country, region, experience) {
  const location = region ? `${region}, ${country}` : country;
  const expLevel = experience === 'first-time' ? 'first-time' : 'some previous';
  return `Explain the "${phaseName}" phase of the election process to a ${role} in ${location} who has ${expLevel} experience with elections.\n\nBe specific, practical, and personalized to their role. Focus on what this phase means FOR THEM — what they need to do, watch for, or understand.`;
}

export function getScenarioSystemInstruction() {
  return `You are CivicPath, an election education assistant. Be encouraging, never condescending. Write in a conversational tone. No bullet points. No political opinions. Strictly educational. End every response with one clear, actionable takeaway.`;
}

export function getScenarioUserPrompt(role, country, region, scenario, selectedOption, correctOption) {
  const location = region ? `${region}, ${country}` : country;
  const isCorrect = selectedOption.label === correctOption.label;
  return `The user is a ${role} in ${location}. They were presented with this election scenario:\n\n"${scenario.text}"\n\nThey chose option ${selectedOption.label}: "${selectedOption.text}"\nThe correct answer is option ${correctOption.label}: "${correctOption.text}"\n\n${isCorrect
    ? 'Affirm their choice warmly and explain in 2–3 sentences WHY this was the right move, adding one additional insight they might not have known.'
    : "Gently explain in 2–3 sentences why their choice wasn't the best option, then clearly explain what the right move is and why."}`;
}

export function getChatSystemInstruction(role, country, region, experience) {
  const location = region ? `${region}, ${country}` : country;
  const expLevel = experience === 'first-time' ? 'first-time' : 'experienced';
  return `You are CivicPath, a friendly and knowledgeable election education assistant. The user is a ${role} in ${location} with ${expLevel} experience. Your job is to explain election processes, timelines, and civic concepts in plain, jargon-free language. Always be actionable — end responses with a clear next step or key takeaway. Keep responses concise (3–5 sentences max unless asked for more). Never discuss candidates, political parties, or share political opinions. Stay strictly educational and nonpartisan.`;
}
