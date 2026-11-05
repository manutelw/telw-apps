// Original TELW tasks written to the published IELTS Writing format.
// None is copied from an IELTS paper. Sets are immutable once learners have used them:
// add a new id instead of editing one.
const T1_TIME = 'You should spend about 20 minutes on this task.';
const T2_TIME = 'You should spend about 40 minutes on this task.';
const ACADEMIC_T1_END = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.';
const T2_END = 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.';
const T1_WORDS = 'Write at least 150 words.';
const T2_WORDS = 'Write at least 250 words.';
const NO_ADDRESS = 'You do NOT need to write any addresses.';

export const SETS = [
  {
    id: 'academic-01', type: 'academic',
    task1: {
      time: T1_TIME,
      prompt: 'The graph below shows the percentage of commuters who travelled to work by public transport in three cities between 2000 and 2020.',
      instruction: ACADEMIC_T1_END, words: T1_WORDS,
      visual: {
        kind: 'line', title: 'Commuters using public transport, 2000–2020', yLabel: '% of commuters', yMax: 70, yStep: 10,
        x: ['2000', '2005', '2010', '2015', '2020'],
        series: [
          {name: 'Northport', values: [42, 46, 51, 58, 63]},
          {name: 'Ridgeway', values: [18, 20, 26, 27, 35]},
          {name: 'Eastfield', values: [30, 28, 25, 24, 22]}
        ]
      }
    },
    task2: {
      time: T2_TIME,
      prompt: 'Some people believe that cities should charge private cars a fee to enter their central areas. Others think that this treats people unfairly and that there are better ways to reduce traffic.',
      instruction: 'Discuss both these views and give your own opinion.', end: T2_END, words: T2_WORDS
    }
  },
  {
    id: 'academic-02', type: 'academic',
    task1: {
      time: T1_TIME,
      prompt: 'The table below shows how the average weekly time spent on four leisure activities changed among adults in one country between 2005 and 2025.',
      instruction: ACADEMIC_T1_END, words: T1_WORDS,
      visual: {
        kind: 'table', title: 'Average hours per week spent on leisure activities by adults',
        head: ['Activity', '2005', '2015', '2025'],
        rows: [
          ['Watching television', '14.5', '11.0', '6.5'],
          ['Using social media', '0.5', '6.0', '10.5'],
          ['Reading for pleasure', '5.0', '4.0', '3.5'],
          ['Sport and exercise', '2.5', '3.0', '4.5']
        ]
      }
    },
    task2: {
      time: T2_TIME,
      prompt: 'In many countries, young people are choosing to study online rather than attend a college or university in person.',
      instruction: 'Do the advantages of this development outweigh the disadvantages?', end: T2_END, words: T2_WORDS
    }
  },
  {
    id: 'general-01', type: 'general',
    task1: {
      time: T1_TIME,
      prompt: 'You recently moved into a rented flat. Since you moved in, the heating or cooling system has not been working properly.',
      instruction: 'Write a letter to your landlord. In your letter:',
      bullets: ['explain when you moved in and what the problem is', 'describe how the problem is affecting you', 'say what you would like the landlord to do'],
      words: T1_WORDS, extra: NO_ADDRESS, opening: 'Begin your letter as follows: Dear ................,'
    },
    task2: {
      time: T2_TIME,
      prompt: 'Many young people today change jobs several times before they reach the age of thirty.',
      instruction: 'Is this a positive or a negative development?', end: T2_END, words: T2_WORDS
    }
  },
  {
    id: 'general-02', type: 'general',
    task1: {
      time: T1_TIME,
      prompt: 'A friend from another country is planning to visit your city for a week and has asked for your advice.',
      instruction: 'Write a letter to your friend. In your letter:',
      bullets: ['say how you feel about the visit', 'recommend the best time of year to come and explain why', 'suggest some things your friend could do during the week'],
      words: T1_WORDS, extra: NO_ADDRESS, opening: 'Begin your letter as follows: Dear ................,'
    },
    task2: {
      time: T2_TIME,
      prompt: 'Some people think that children should learn practical skills, such as cooking and managing money, at school. Others believe that these skills are best taught at home.',
      instruction: 'Discuss both these views and give your own opinion.', end: T2_END, words: T2_WORDS
    }
  }
];

export const setById = id => SETS.find(x => x.id === id) || null;
export const setsOfType = type => SETS.filter(x => x.type === type);

export function taskText(task) {
  return [task.prompt, task.instruction, ...(task.bullets || []), task.end, task.opening].filter(Boolean).join(' ');
}
