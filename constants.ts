
import { Topic } from './types';

// --- TOPIC DATA ---

export const TOPICS: Topic[] = [
  {
    id: 'benefits-drawbacks',
    title: 'Talking about benefits and drawbacks',
    scenarioTitle: 'Having a Class Blog',
    scenarioDescription: 'Your group wants to start a class blog. Persuade your class teacher to allow this. Discuss benefits, problems, and topics to include using the survey data.',
    targetExpressions: [
      { id: 1, text: "One of the benefits is that..." },
      { id: 2, text: "Another advantage is that..." },
      { id: 3, text: "One clear advantage is that..." },
      { id: 4, text: "A potential downside is that..." },
      { id: 5, text: "Some people might worry that..." },
      { id: 6, text: "The main problem is that..." }
    ],
    contextData: {
      survey: [
        { label: "Hong Kongers reading blogs", value: "77%" },
        { label: "Students willing to contribute", value: "70%" },
        { label: "Want exam strategies", value: "80%" }
      ],
      topics: ["News", "Shopping", "Health", "School Events"]
    }
  },
  {
    id: 'agreement-disagreement',
    title: 'Showing agreement and disagreement',
    scenarioTitle: 'School Picnic Location',
    scenarioDescription: 'Your class is deciding on the location for the annual school picnic. You need to discuss options (Beach vs. Country Park) and politely agree or disagree with your partner.',
    targetExpressions: [
      { id: 1, text: "I couldn't agree more..." },
      { id: 2, text: "That is a valid point, however..." },
      { id: 3, text: "I see what you're saying, but..." },
      { id: 4, text: "I'm afraid I have to disagree..." },
      { id: 5, text: "You have a point there." },
      { id: 6, text: "That's exactly what I think." }
    ]
  },
  {
    id: 'tree-turn',
    title: 'TREE in a turn',
    scenarioTitle: 'Cancelling Sports Day',
    scenarioDescription: 'The school is considering cancelling Sports Day due to the hot weather. Practice the TREE method (Topic, Reason, Example, Ending) to express your view.',
    targetExpressions: [
      { id: 1, text: "I believe that..." },
      { id: 2, text: "This is mainly because..." },
      { id: 3, text: "For instance..." },
      { id: 4, text: "Take ... as an example." },
      { id: 5, text: "Therefore..." },
      { id: 6, text: "For these reasons..." }
    ]
  },
  {
    id: 'explaining-choices',
    title: 'Explaining choices',
    scenarioTitle: 'Choosing a Class Gift',
    scenarioDescription: 'Your class teacher is leaving. You need to choose a farewell gift (Photo Album, Watch, or Gift Card). Explain why your choice is the best.',
    targetExpressions: [
      { id: 1, text: "I would suggest choosing..." },
      { id: 2, text: "The main reason for picking this is..." },
      { id: 3, text: "Compared to the other options..." },
      { id: 4, text: "It is a better choice because..." },
      { id: 5, text: "If we choose this, then..." }
    ]
  },
  {
    id: 'active-listening',
    title: 'Active listening',
    scenarioTitle: 'Organizing a Charity Fair',
    scenarioDescription: 'You are planning a charity fair. Your goal is to show you are listening actively to your partner\'s ideas before adding your own.',
    targetExpressions: [
      { id: 1, text: "So, what you are saying is..." },
      { id: 2, text: "If I understand correctly, you mean..." },
      { id: 3, text: "That is an interesting idea..." },
      { id: 4, text: "Would you mind elaborating on...?" },
      { id: 5, text: "Following up on your point..." }
    ]
  }
];

// --- DYNAMIC PROMPT GENERATOR ---

export const getSystemInstruction = (topic: Topic) => `
You are "Sam", a friendly student in a Hong Kong secondary school. You are practicing for the HKDSE English Speaking exam (Group Discussion) with a classmate (the user).

CURRENT TOPIC: "${topic.title}"
SCENARIO: ${topic.scenarioDescription}

YOUR OBJECTIVE:
Guide the user to have an **extended** and **detailed** discussion. You must ensure the user practices the specific TARGET EXPRESSIONS for this topic.

RULES:
1. **SAM STARTS**: When the session begins, you MUST take the lead. Greet the user, introduce the scenario, and ask for their opinion to get the discussion moving.
2. **STRICT ENGLISH**: Speak ONLY in English. Interrupt if they use other languages.
3. **SCAFFOLDING**: If the user is stuck or gives short answers, give specific hints and guiding questions.
4. **TREE STRUCTURE**: Check for a Topic, Reason, Example, and Ending in their turns.
5. **FEEDBACK MODE**: 
   - If the user sends a message containing "[REQUEST_FEEDBACK]", you must stop the roleplay immediately.
   - Provide a warm, constructive oral evaluation.
   - Focus on: 
     a) Usage of target expressions (list which ones they used or missed).
     b) Quality of reasons and examples.
     c) General fluency.
   - Conclude by saying "Practice finished! Well done." and then append the special code "[SESSION_FINISHED]" at the very end of your final spoken response.

TARGET EXPRESSIONS:
${topic.targetExpressions.map(t => `${t.id}. "${t.text}"`).join('\n')}

TONE: Friendly, student-like, slow and clear speaking speed.
`;
