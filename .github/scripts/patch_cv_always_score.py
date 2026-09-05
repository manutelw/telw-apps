from pathlib import Path
import re

path = Path('workers/profile-review.js')
text = path.read_text(encoding='utf-8')
original = text

text = text.replace(
"""  const matchValue=d.match_incomplete?'Not calculated':esc(d.evidence_match)+'/10';
  const matchNote=d.match_incomplete?'JD audit incomplete; CV evaluation is still shown.':'Locked: rewriting cannot change this score.';
  const eligibilityValue=d.match_incomplete?'Unavailable':'Eligibility';""",
"""  const numericMatch=Number(d.evidence_match);
  const safeMatch=Number.isFinite(numericMatch)?Math.max(0,Math.min(10,numericMatch)):0;
  const matchValue=esc(safeMatch)+'/10';
  const matchNote=d.match_fallback?'Calculated conservatively: any unresolved auditable JD requirement counts as no evidence.':'Locked: rewriting cannot change this score.';
  const eligibilityValue='Eligibility';""",
1)
text = text.replace(
"""  const questions=(d.match_incomplete||d.cv_only)?'':'<h2>Five likely interview questions</h2>'+list(d.interview_questions||[]);""",
"""  const questions=d.cv_only?'':'<h2>Five likely interview questions</h2>'+list(d.interview_questions||[]);""",
1)

text = text.replace('return unique.slice(0,40);}', 'return unique.slice(0,80);}', 1)

ledger_pattern = re.compile(r"function validateRequirementLedger\(clauses,ledger\)\{.*?\nfunction normaliseEvidence", re.S)
ledger_replacement = r'''function fallbackRequirementForClause(clause){const text=String(clause?.text||'').trim();const lower=text.toLowerCase();if(!text)return null;const contextual=/^(about\b|company\b|job description\b|job profile\b|career track\b|application details\b|to apply\b)|\b(stipend|ctc|fixed compensation|performance-based component|selection process|profile shortlisting|content creation task|personal interview|about collegify|conversion to a permanent|internship duration)\b/i;if(contextual.test(text))return null;let priority='important';if(/\b(must|required|mandatory|minimum|essential|eligib|qualification|experience|location|work mode|working days|timings?|shift|female candidates?|only)\b/i.test(lower))priority='mandatory';else if(/\b(preferred|prefer|nice[- ]to[- ]have|desirable|advantageous)\b/i.test(lower))priority='preferred';return{clause_id:clause.clause_id,requirement:text,jd_quote:text,priority,fallback:true};}
function validateRequirementLedger(clauses,ledger){const items=Array.isArray(ledger?.requirements)?ledger.requirements:[];const byId=new Map(items.map(x=>[String(x.clause_id||''),x]));const accepted=[];for(const clause of clauses){const item=byId.get(clause.clause_id);if(!item){const fallback=fallbackRequirementForClause(clause);if(fallback)accepted.push(fallback);continue;}const relevance=String(item.relevance||'').toLowerCase();if(relevance==='requirement'){let priority=String(item.priority||'').toLowerCase();if(!['mandatory','important','preferred'].includes(priority))priority='important';accepted.push({clause_id:clause.clause_id,requirement:String(item.requirement||clause.text).trim()||clause.text,jd_quote:clause.text,priority,fallback:false});}}
if(!accepted.length){for(const clause of clauses){const fallback=fallbackRequirementForClause(clause);if(fallback)accepted.push(fallback);}if(!accepted.length&&clauses.length){accepted.push({clause_id:clauses[0].clause_id,requirement:clauses[0].text,jd_quote:clauses[0].text,priority:'important',fallback:true});}}
return accepted.map((item,index)=>({...item,requirement_id:`REQ-${String(index+1).padStart(2,'0')}`}));}
async function extractRequirementLedger(env,clauses){const prompt=`Audit every JD clause below. For every clause ID, decide whether it states a candidate requirement/condition or is contextual/non-requirement text. If it is a requirement, classify it as mandatory, important or preferred. Mandatory means the JD explicitly requires it using language such as must, required, mandatory, minimum, essential, only, eligibility, degree/experience threshold, location/shift/travel condition, or a hard qualification. Important means a direct role capability/responsibility strongly expected but not an explicit eligibility condition. Preferred means explicitly desirable, nice-to-have or advantageous. Do not omit any clause. Do not merge clause IDs.\n\nJD CLAUSES:\n${clauses.map(c=>`${c.clause_id}: ${c.text}`).join('\n')}`;const schema={type:'object',properties:{clause_coverage:{type:'array',items:{type:'string'}},requirements:{type:'array',items:{type:'object',properties:{clause_id:{type:'string'},relevance:{type:'string'},priority:{type:'string'},requirement:{type:'string'}},required:['clause_id','relevance','priority','requirement']}}},required:['clause_coverage','requirements']};let lastError=null;for(let attempt=0;attempt<2;attempt++){const retryInstruction=attempt===0?'':`\n\nYour previous audit failed validation: ${lastError?.message||'incomplete coverage'}. Correct that exact issue. Return every clause ID exactly once and do not omit or downgrade any explicit mandatory condition.`;try{const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:prompt+retryInstruction}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:0}})});if(!response.ok){lastError=new Error(`JD coverage audit error (${response.status}).`);continue;}const data=await response.json();const raw=data?.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('')||'';const parsed=JSON.parse(raw.replace(/^```json\s*/i,'').replace(/```\s*$/,'').replace(/,\s*([}\]])/g,'$1').trim());return validateRequirementLedger(clauses,parsed);}catch(error){lastError=error;}}
return validateRequirementLedger(clauses,{requirements:[]});}
function normaliseEvidence'''
text, ledger_count = ledger_pattern.subn(ledger_replacement, text, count=1)
if ledger_count != 1:
    raise SystemExit('Could not patch JD coverage ledger logic.')

evidence_pattern = re.compile(r"function scoreEvidenceMappings\(mappings,cv,jd,frozenRequirements\)\{.*?\nfunction supportNumberKeys", re.S)
evidence_replacement = r'''function scoreEvidenceMappings(mappings,cv,jd,frozenRequirements){const supplied=new Map((Array.isArray(mappings)?mappings:[]).map(item=>[String(item?.requirement_id||''),item]));const accepted=[];let fallbackUsed=false;for(const req of Array.isArray(frozenRequirements)?frozenRequirements:[]){const mapping=supplied.get(String(req.requirement_id||''));let status=String(mapping?.status||'missing').toLowerCase();let cvQuote=String(mapping?.cv_evidence_quote||'').trim();if(!mapping||!['verified','transferable','missing'].includes(status)){status='missing';cvQuote='';fallbackUsed=true;}if((status==='verified'||status==='transferable')&&(!cvQuote||!validateQuoteInSource(cvQuote,cv))){status='missing';cvQuote='';fallbackUsed=true;}if(req.fallback)fallbackUsed=true;accepted.push({...req,status,cv_evidence_quote:status==='missing'?'':cvQuote});}
const groupScore=(priority,maximum)=>{const group=accepted.filter(item=>item.priority===priority);if(!group.length)return 0;const credits=group.reduce((sum,item)=>sum+(item.status==='verified'?1:item.status==='transferable'?0.5:0),0);return maximum*credits/group.length;};const presentMaximum=(accepted.some(item=>item.priority==='mandatory')?4:0)+(accepted.some(item=>item.priority==='important')?3:0)+(accepted.some(item=>item.priority==='preferred')?1:0);let score=groupScore('mandatory',4)+groupScore('important',3)+groupScore('preferred',1);if(presentMaximum>0&&presentMaximum<8)score=score*8/presentMaximum;const missingMandatory=accepted.some(item=>item.priority==='mandatory'&&item.status==='missing');if(missingMandatory)score=Math.min(score,3);score=Math.round(Math.max(0,Math.min(8,score))*10)/10;return{score,mappings:accepted,missingMandatory,fallbackUsed};}
function supportNumberKeys'''
text, evidence_count = evidence_pattern.subn(evidence_replacement, text, count=1)
if evidence_count != 1:
    raise SystemExit('Could not patch evidence-map scoring logic.')

text = text.replace(
'const evidenceScore=evidenceAudit.score;const interviewQuestions=',
"const evidenceScore=evidenceAudit.score;const matchFallback=Boolean(evidenceAudit.fallbackUsed||frozenRequirements.some(item=>item.fallback));const interviewQuestions=",
1)
text = text.replace(
'evidence_score:evidenceScore,evidence_match:evidenceMatch,original_effectiveness:',
'evidence_score:evidenceScore,evidence_match:evidenceMatch,match_fallback:matchFallback,original_effectiveness:',
1)

catch_pattern = re.compile(r"\}catch\(error\)\{const message=error\.message\|\|'The review could not be completed\.';const incompleteLedger=.*?return Response\.json\(\{error:incompleteLedger\?'Evaluation incomplete: one or more JD requirements could not be classified or verified\. No match score has been calculated\. Please evaluate again\.':message\},\{status:incompleteLedger\?422:500\}\);\}\}\};", re.S)
catch_replacement = r'''}catch(error){const message=error.message||'The review could not be completed.';if(isResumeEvaluation&&partialCvQuality){const strengths=partialCvQuality.scores.filter(item=>item.score>=4).map(item=>`${item.category}: ${item.reason}`);const priorities=partialCvQuality.scores.filter(item=>item.score<4).map(item=>`${item.category}: ${item.reason}`);return Response.json({match_fallback:true,evidence_match:0,evidence_score:0,original_effectiveness:partialCvQuality.score10,revised_effectiveness:partialCvQuality.score10,overall_score:partialCvQuality.score100,scores:partialCvQuality.scores,verdict:partialCvQuality.verdict,critical_defects:partialCvQuality.critical_defects,strengths,priorities,fit_reasons:['Candidate–JD Evidence Match was calculated conservatively at 0/10 because the automated JD audit could not be completed reliably. No unresolved requirement was credited as evidence.',`Audit detail: ${message}`],missing_essentials:[],interview_questions:[],requirement_evidence:[],frozen_requirements:[]});}return Response.json({error:message},{status:500});}}};'''
text, catch_count = catch_pattern.subn(catch_replacement, text, count=1)
if catch_count != 1:
    raise SystemExit('Could not patch last-resort scoring guarantee.')

if text == original:
    raise SystemExit('No CV always-score changes were applied.')

path.write_text(text, encoding='utf-8')
print('Patched CV Builder: CV-JD match now always returns a numeric score; unresolved audit items score conservatively as no evidence.')
