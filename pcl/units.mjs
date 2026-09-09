import { additionalSpecs } from '../supabase/functions/pcl-pilot-1/module-specs.ts';

export const units = {
  2: ['Reviewing Recent Experience & Current Activity', 'Present Perfect with so far, yet, already, for, since and only; status and duration'],
  3: ['Ongoing Work, Activity & Time', 'Present Perfect Continuous; ongoing activity, duration, workload and current relevance'],
  4: ['Project Progress, Completion & Duration', 'Present Perfect vs continuous / Simple Past; activity, output, progress and completion'],
  5: ['Rules, Expectations & Professional Discretion', 'Must, should, may, can, allowed to; obligation, advice, permission and discretion'],
  6: ['Evaluating Differences & Relative Performance', 'Comparatives, quantifiers and degree; comparing options, judging performance and explaining choice'],
  7: ['Office Conversations & Professional Reporting', 'Reported speech and reporting structures; relay, clarification, meeting and workflow updates'],
  8: ['Processes, Systems & Outcomes', 'Passive voice; explaining processes, reporting outcomes and maintaining professional neutrality'],
  9: ['Making & Evaluating Future Projections', 'Future forms, probability and First Conditional; forecasting, consequences, risk and readiness'],
  10: ['Strategic Scenarios & Decision Options', 'Second Conditional; options, trade-offs, recommendations and decision logic'],
  11: ['Executive Conditions, Contrasts & Justification', 'However, despite, even if, provided that, require that; diplomatic contrast and formal justification'],
  12: ['Strategic Reflection & Decision Consequences', 'Should/could/might have + Third Conditional; hindsight, alternatives and consequence analysis'],
  13: ['Managing Intent, Rules & Accountability', 'Intend to, must have, can’t have, needn’t have; accountability, deduction and corrective action'],
  14: ['Executive Emphasis & Boundary Communication', 'Never before, under no circumstances, not only…but also; emphasis, authority and boundaries']
};

export const specs = additionalSpecs;
export const moduleIds = Object.keys(specs).sort((a,b)=>Number(a.split('.')[0])-Number(b.split('.')[0]) || Number(a.split('.')[1])-Number(b.split('.')[1]));

export function moduleContent(id) {
  const s=specs[id], parts=s.source.split(/Learner:\s*/i), manager=(parts[0].replace(/^Manager:\s*/i,'').trim()), employee=(parts.slice(1).join('Learner: ').trim());
  return {
    ...s, id, manager, employee,
    vocabItems:s.vocab.split(',').map(x=>x.trim()),
    questions:[
      'What is the speaker’s direct answer, and which fact supports it?',
      'Why does the situation matter, and what is the work or business effect?',
      'What does the speaker recommend or do next, and why is that judgement appropriate?'
    ],
    audio:[1,2,3,4].map(n=>`./audio/unit-${s.unit}/${id.replace('.','-')}-learn-${n}.mp3`),
    modelAudio:[`./audio/unit-${s.unit}/${id.replace('.','-')}-model-manager.mp3`,`./audio/unit-${s.unit}/${id.replace('.','-')}-model-employee.mp3`]
  };
}
