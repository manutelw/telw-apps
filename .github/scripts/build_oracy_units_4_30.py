"""Generate the approved ORACY Units 4-30 from the curriculum map.

Content stays in unit-N-content.js so the Worker can protect it with the exact
same entitlement gate as the page. Behaviour stays in the shared runtimes.
"""
from pathlib import Path
import hashlib, json

ROOT=Path(__file__).resolve().parents[2]
ROWS="""
4|B1A|A First Time for Everything|once,several times,before,ever,never,unforgettable|present perfect for life experience; ever, never, before and how many times|syllable stress in common past participles|Interview|Personal story|Conversation
5|B1A|The Pop-up Supper|book a table,available,set up,bring along,confirm,sounds good|going to versus present continuous; Let's and Shall we|schwa and weak words in plan-making|Conversation|Instructions|Voice message
6|B1A|The Balcony Makeover|so far,already,just,yet,since,make progress|present perfect for recent progress and unfinished time; for and since|the sounds /tʃ/ and /dʒ/|Progress report|Conversation|How-to
7|B1A|Can You Hear Me Now?|get through,hold on,cut off,call back,voicemail,somewhere else|phone clarification and indefinite compounds with else|final consonants and clear numbers and names|Phone conversation|Voicemail|Troubleshooting instructions
8|B1B|The Weekend That Changed My Routine|lately,recently,last time,take up,give up,make a habit of|present perfect versus simple past|-ed endings|Monologue|Interview|Report
9|B1B|Finding the Hidden Courtyard|landmark,shortcut,entrance,across from,get around,either way|movement, routes and imperatives|consonant clusters and linking|Conversation|Tour|Instructions
10|B1B|House Rules, Shared Lives|allowed,required,optional,considerate,disturb,fair enough|modals for obligation, prohibition, permission and advice|clear final /t/ in must and mustn't|Announcement|Conversation|Advice column
11|B1B|The Cake Arrived Sideways|damaged,missing,replace,refund,sort out,I'm afraid|complaints and indirect requests|polite rise-fall intonation|Customer service call|Voice note|Incident report
12|B1B|Mystery at Number 14|quietly,suddenly,carefully,suspicious,ordinary,to my surprise|adjectives versus adverbs in narration|-ly stress and endings|Story|Witness statement|News report
13|B1B|Tiny Café, Giant Queue|crowded,spacious,affordable,overrated,worth it,by far|comparisons, intensifiers, more, fewer and less|contrast stress and clear numbers|Review|Survey|Presentation
14|B1B|From Peel to Plant Pot|collect,separate,crush,mould,reusable,in order to|present and future passive|process stress and suffixes|Explanation|Tour|News feature
15|B1B|The Night Market Was Saved|organise,approve,volunteer,postpone,restore,recommend|recommend plus -ing; past and modal passive|final consonant clusters|Report|Interview|Recommendation
16|B2A|What Everyone Said About the New Library|welcoming,accessible,quiet zone,mixed views,point out,according to|reported speech and reported questions|prominence in reporting|Street interview|News report|Conversation
17|B2A|When the Lights Go Out|backup,power cut,charge up,manage without,by yourself,as soon as|future time clauses and reflexive pronouns|chunking instructions|Instructions|Conversation|Personal account
18|B2A|The Minute Everything Went Quiet|notice,interrupt,freeze,spill,rush over,all of a sudden|past continuous and simple past; when, while, so and such|story rhythm|Story|Witness account|Radio report
19|B2A|A Better Week for Your Body|stiff,worn out,hydrated,balanced,cut down on,it may help|giving graded advice|the sounds /s/, /z/ and /ʃ/|Interview|Podcast|Conversation
20|B2A|If Our Street Had No Cars|traffic-free,practical,inconvenient,pedestrian,alternative,on the other hand|second conditional versus first conditional|contrastive stress for real and imagined ideas|Opinion|Town-hall discussion|Proposal
21|B2A|Could You Tell Me Where It Is?|in stock,exchange,receipt,counter,delivery slot,let me check|indirect questions and service offers|intonation in direct and indirect questions|Shop conversation|Announcement|How-to
22|B2A|The Project on the Kitchen Table|work on,keep at,fall behind,catch up,take shape,for ages|present perfect continuous versus present perfect simple|weak forms and linking in have been|Interview|Monologue|Progress update
23|B2B|Read the Room|awkward,thoughtful,formal,casual,tactful,to be honest|register and softening; if you don't mind|warm, neutral and firm politeness|Conversation|Commentary|Briefing
24|B2B|Fix It Before You Replace It|loosen,tighten,plug in,take apart,line up,make sure|phrasal instructions; present continuous passive; sequencing|instructional stress and pauses|How-to|Repair conversation|Process report
25|B2B|More in Common Than We Thought|have in common,keen on,can't stand,get on with,curious,no way|so and neither; possessives and questions|reaction intonation|Conversation|Profile|Interview
26|B2B|Before Screens Took Over|old-fashioned,convenient,time-consuming,keep in touch,look back,back then|used to and would for past habits|natural reductions|Story|Report|Family conversation
27|B2B|The Hobby That Tests My Patience|absorbing,demanding,rewarding,frustrating,satisfying,what keeps me going|gerunds; gradable adjectives and intensifiers|emphatic stress|Interview|Demonstration|Monologue
28|B2B|If I Had Taken the Earlier Train|miss a chance,turn out,make up for,overlook,learn the hard way,looking back|third conditional; wish and if only|regret and relief intonation|Story|Conversation|Reflection
29|B2B|The Strange Light Over the Lake|clue,likely explanation,rule out,assume,evidence,apparently|deduction with must, might, could and can't have|certainty and caution in the voice|News report|Investigator dialogue|Evidence briefing
30|B2B|One Idea Worth Sharing|turning point,perspective,take away,make a difference,put into practice,even though|synthesis with concession, relative clauses and tense control|sustained pacing, prominence, pausing and closing|Presentation|Interview|Feature
""".strip().splitlines()

SPEAK={
4:['Repeat and vary','Experience answer','Follow-up interview','AI experience swap','Best-ever story'],5:['Suggestion drill','Change one detail','Personal plan','AI group-planning dialogue','Event pitch'],6:['Contrast and repeat','Progress update','Project questions','AI project check-in','Before-and-now talk'],7:['Repeat phone lines','Leave a message','Repair a misunderstanding','AI phone call','One-minute phone story'],8:['Substitution drill','Routine update','Habit interview','AI habit exchange','Change story'],9:['Route echo','Describe a landmark','Give directions','AI lost-visitor exchange','Mini guided tour'],10:['Modal substitution','State a rule','Negotiate politely','AI house meeting','Rules presentation'],11:['Complaint opener','Describe the problem','Service dialogue','AI complaint call','Full complaint'],12:['Adverb swap','Describe the action','Witness questions','AI witness interview','Suspense retell'],13:['Comparison echo','Compare two places','Make a recommendation','AI choice discussion','60-second review'],14:['Passive sentence','Explain one step','Process questions','AI eco-tour','Full-cycle explanation'],15:['Passive result','Project update','Make a recommendation','AI committee meeting','Full project report'],16:['Report a comment','Convert a question','Follow-up interview','AI reporter exchange','Balanced report'],17:['Time-clause practice','Safety instruction','Backup plan','AI outage planning','Emergency plan talk'],18:['Past-time drill','Build a scene','Witness dialogue','AI reconstruction','Dramatic retell'],19:['Sound and repeat','Describe symptoms','Give graded advice','AI health-coach exchange','Personal wellbeing plan'],20:['Conditional substitution','Explain a benefit','Give the other side','AI town-hall debate','Street proposal'],21:['Reformulate politely','Make an enquiry','Service dialogue','AI shopping exchange','Purchase decision'],22:['Duration practice','Project update','Progress interview','AI project coach','75-second project talk'],23:['Tone shift','Soften a message','Repair a dialogue','AI social repair','Register reflection'],24:['Instruction echo','Vary the command','Explain a repair','AI troubleshooting dialogue','Complete how-to'],25:['Agreement echo','Find common ground','Interview a person','AI new-neighbour chat','Compare two people'],26:['Past-habit repeat','Describe an old routine','Compare then and now','AI memory exchange','Then-and-now story'],27:['Adjective stress','Explain the appeal','Hobby interview','AI hobby decision','Persuade a beginner'],28:['Conditional completion','Express a regret','Support a speaker','AI hindsight exchange','Lesson-learned story'],29:['Certainty repeat','Present a clue','Challenge an assumption','AI investigation','Evidence conclusion'],30:['Opening rehearsal','30-second turning point','Follow-up interview','AI audience questions','Two-minute final talk']}

def level_of(n): return 'B1A' if n<=7 else 'B1B' if n<=15 else 'B2A' if n<=22 else 'B2B'
def sentence(words): return ', '.join(words[:-1])+f', and {words[-1]}'
def passage(title, vocab, genre, grammar, n):
    joined=sentence(vocab[:5])
    return (f"Welcome to {title}. In this {genre.lower()}, listen for {joined}. "
      f"The speaker explains a realistic situation and makes the purpose clear before adding details. "
      f"Notice how {grammar} helps the message stay precise. The main idea develops step by step, "
      f"with a reason, an example and a practical result. Listen once for meaning, then listen again "
      f"for the target language. Afterward, retell the situation in your own words and change one detail. "
      f"Unit {n} asks you to move from recognition to confident production, so keep your answer natural and complete.")
def dialogue(title,vocab,grammar):
    turns=[]
    prompts=[
      f"Let's talk about {title.lower()}.",f"Good idea. I want to use {vocab[0]} naturally.",f"What does {vocab[1]} add to the situation?",f"It makes the main point clearer.",f"Can you give me a practical example with {vocab[2]}?",f"Certainly. I can connect it to a real decision.",f"How should we organise the explanation?",f"First state the situation, then give a reason.",f"We also need to practise {grammar}.",f"Right. A complete sentence will make the meaning precise.",f"What question should we ask next?",f"Ask for one detail, then react to the answer.",f"That sounds natural. Shall we reach a decision?",f"Yes. Let's agree on one useful next step.",f"Perfect. Now we can explain it clearly in our own words."
    ]
    for i,t in enumerate(prompts): turns.append(['Maya' if i%2==0 else 'Kabir','marin' if i%2==0 else 'cedar',t])
    return turns
def config(row):
    n,level,title,v,grammar,pron,g1,g2,g3=row.split('|');n=int(n);vocab=v.split(',');tasks=SPEAK[n]
    targets=vocab+[grammar,pron]
    checks=[]
    for i in range(4):
      target=vocab[i]
      checks.append({'id':f'q{i+1}','label':'Vocabulary in context','prompt':f'Which item is target language for this unit?','options':[target,'a completely unrelated phrase','an impossible word form'],'answer':'a'})
    for i in range(4):
      checks.append({'id':f'q{i+6}','label':'Grammar and meaning','prompt':f'Which sentence best supports the unit focus: {grammar}?','options':[f'I can use {vocab[i%len(vocab)]} in a clear, complete message.','Words without a sentence.','Yesterday tomorrow because.'],'answer':'a'})
    for i in range(4):
      checks.append({'id':f'q{i+11}','label':'Hear and choose','prompt':'Which target word or phrase do you hear?','options':[vocab[i],vocab[(i+1)%len(vocab)],vocab[(i+2)%len(vocab)]],'answer':'a','audio':True})
    model=f"Use {vocab[0]} and {vocab[1]} while practising {grammar}."
    speaking={}
    for i,name in enumerate(tasks,1):
      speaking[f's{i}']={'title':name,'prompt':f'{name}: speak about {title.lower()}.','help':f'Use {vocab[(i-1)%len(vocab)]} and make the meaning easy to follow.','opening':f'Tell me your first idea about {title.lower()}.','type':'dialogue' if i==4 else 'personal','min':1 if i>=3 else 0,'markers':[vocab[-1].lower()],'model':model,'own':'Keep the pattern and change the details.'}
    return {'unitNo':n,'level':level,'title':title,'aim':f'Build confident spoken English through {g1.lower()}, {g2.lower()} and {g3.lower()}.','targets':targets,
      'feedbackGuidance':{'range':f'Bring one Unit {n} phrase into your next answer.','accuracy':f'Keep the target pattern clear: {grammar}.','fluency':'State the main idea, pause briefly, then add the supporting detail.','coherence':'Give the situation, reason and result in a clear order.'},
      'keyPoints':[{'kind':'Vocabulary','heading':f'Use the language of {title.lower()}','chips':vocab,'listen':g1,'genre':g1},{'kind':'Grammar','heading':grammar.capitalize(),'chips':[grammar], 'model':model,'listen':g2,'genre':g2},{'kind':'Pronunciation and voice','heading':pron.capitalize(),'chips':[pron],'listen':g3,'genre':g3}],
      'passages':{'kp1':[['','marin',passage(title,vocab,g1,grammar,n)]],'kp2':dialogue(title,vocab,grammar),'kp3':[['','marin',passage(title,vocab,g3,pron,n)]]},
      'checks':checks,'notes':{q['id']:f"The target answer is ‘{q['options'][0]}’. Hear or read it in context, then make a new sentence." for q in checks},
      'oral':{'q5':{'question':f'What is the main situation in {title}?','expected':f'The unit focuses on {title.lower()} and uses {vocab[0]} to explain the situation.','key':f'A strong answer identifies the topic and uses one relevant detail such as {vocab[0]}.'},'q10':{'question':f'How does the dialogue use the unit language to reach a clear result?','expected':f'The speakers use {vocab[0]} and {vocab[1]}, ask follow-up questions, and agree on a useful next step.','key':'A strong answer mentions target language, follow-up questions and a clear outcome.'}},
      'pron':{f'q{i+11}':vocab[i] for i in range(4)}|{'q15':f'{model} Say it clearly and naturally.'},'conversation':{'maxLearnerTurns':4,'model':model,'nextStep':'Keep the model and change the situation or outcome.'},'speaking':speaking}

HTML="""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ORACY</title><link rel="stylesheet" href="./oracy.css"><style>.model{margin:10px 0;padding:10px 12px;border-left:3px solid var(--gold);background:#fffaf0;border-radius:8px;line-height:1.5}.unit-nav{display:flex;justify-content:space-between;gap:12px;margin-top:18px}.unit-nav a{color:var(--ink);font-weight:700;text-decoration:none}.marker-guide{margin:10px 0;padding:10px 12px;border:1px solid #efd7a0;border-radius:10px;background:#fff8e8;line-height:1.45}.conversation-panel{margin-top:14px;padding:14px;border:1px solid #cfe0ec;border-radius:12px;background:#fff}.conversation-log{display:flex;flex-direction:column;gap:9px;max-height:340px;overflow:auto}.conversation-bubble{max-width:86%;padding:9px 12px;border-radius:13px;line-height:1.45}.conversation-bubble.coach{align-self:flex-start;background:#eef5fa}.conversation-bubble.learner{align-self:flex-end;background:#fff3d5}.conversation-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}.mic-light{width:11px;height:11px;border-radius:50%;background:#8996a0}.mic-light.on{background:#18a05e;box-shadow:0 0 0 5px rgba(24,160,94,.14)}.conversation-state{font-weight:700}.conversation-panel button.secondary{background:#fff;color:var(--ink);border:1px solid #9fb4c3}.hidden{display:none!important}</style></head><body><script src="./unit-N-content.js"></script><script src="./unit-renderer.js"></script><script src="./unit-shared.js"></script><script src="./conversation-shared.js"></script><script src="./level-system.js"></script></body></html>"""

def main():
  units=[config(r) for r in ROWS]
  for u in units:
    n=u['unitNo']; (ROOT/f'oracy/unit-{n}-content.js').write_text('window.ORACY_UNIT='+json.dumps(u,ensure_ascii=False,separators=(',',':'))+';\n')
    (ROOT/f'oracy/unit-{n}.html').write_text(HTML.replace('unit-N-content',f'unit-{n}-content'))
  server={str(u['unitNo']):{'level':u['level'],'title':u['title'],'scenario':u['speaking']['s4']['prompt'],'goals':'Use the unit language, respond to follow-up questions and reach one clear outcome in four learner turns.','language':', '.join(u['targets']),'model':u['conversation']['model'],'nextStep':u['conversation']['nextStep']} for u in units}
  (ROOT/'supabase/functions/oracy-voice/course-units-4-30.ts').write_text('export const COURSE_UNITS_4_30='+json.dumps(server,ensure_ascii=False,separators=(',',':'))+';\n')
  print(f'Generated {len(units)} protected units and shared server configuration.')

if __name__=='__main__': main()
