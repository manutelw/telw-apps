// The rubric text is private. It lives only in the Writing database, loaded at setup from a
// file kept outside this public repository, and is never sent to learners.
export const CRITERIA = {
  fulfilment: 'Task Achievement (Task 1) or Task Response (Task 2)',
  coherence: 'Coherence and Cohesion',
  lexical: 'Lexical Resource',
  grammar: 'Grammatical Range and Accuracy'
};
export async function loadRubric(env) {
  const row = await env.WRITING_DB.prepare(`SELECT value FROM writing_config WHERE key='rubric'`).first();
  if (!row) throw new Error('Rubric is not loaded');
  return JSON.parse(row.value);
}
export const rubricKey = (testType, taskNumber) => taskNumber === 2 ? 'essay' : testType === 'academic' ? 'academic1' : 'general1';
