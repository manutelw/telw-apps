// Fixed IELTS Writing task wording shared by every question set.
export const T1_TIME = 'You should spend about 20 minutes on this task.';
export const T2_TIME = 'You should spend about 40 minutes on this task.';
export const ACADEMIC_T1_END = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.';
export const T2_END = 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.';
export const T1_WORDS = 'Write at least 150 words.';
export const T2_WORDS = 'Write at least 250 words.';
export const NO_ADDRESS = 'You do NOT need to write any addresses.';
export const OPEN_NAMED = 'Begin your letter as follows: Dear ................,';
export const OPEN_FORMAL = 'Begin your letter as follows: Dear Sir or Madam,';

export const academicSet = (n, prompt, visual, essay, question) => ({
  id: 'academic-' + String(n).padStart(2, '0'), type: 'academic',
  task1: {time: T1_TIME, prompt, instruction: ACADEMIC_T1_END, words: T1_WORDS, visual},
  task2: {time: T2_TIME, prompt: essay, instruction: question, end: T2_END, words: T2_WORDS}
});
export const generalSet = (n, situation, reader, bullets, formal, essay, question) => ({
  id: 'general-' + String(n).padStart(2, '0'), type: 'general',
  task1: {time: T1_TIME, prompt: situation, instruction: `Write a letter to ${reader}. In your letter:`, bullets, words: T1_WORDS, extra: NO_ADDRESS, opening: formal ? OPEN_FORMAL : OPEN_NAMED},
  task2: {time: T2_TIME, prompt: essay, instruction: question, end: T2_END, words: T2_WORDS}
});
