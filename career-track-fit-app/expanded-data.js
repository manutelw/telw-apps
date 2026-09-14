const EXTRA_CORE_QUESTIONS = [
  {id:'v3',cap:'verbal',q:'A report says, “Returns increased after a packaging change.” Which response shows the best reasoning?',o:['The packaging change caused all returns.','The timing suggests a possible link, but other causes should be checked.','Customers dislike the brand.','Packaging is never important.'],a:1},
  {id:'v4',cap:'verbal',q:'Which sentence is the clearest summary for a manager?',ctx:'Data: Website visits rose 22%, enquiries rose 5%, sales were flat.',o:['The website did well.','Traffic increased, but the rise did not translate into stronger sales.','Sales teams failed.','More visitors always create more sales.'],a:1},
  {id:'v5',cap:'verbal',q:'Which statement separates fact from interpretation best?',o:['The team is lazy because output fell.','Output fell 12%; the cause still needs to be established.','Everyone knows morale is low.','The manager is the problem.'],a:1},
  {id:'n3',cap:'numerical',q:'A product price rises from ₹1,200 to ₹1,380. What is the percentage increase?',o:['10%','12%','15%','18%'],a:2},
  {id:'n4',cap:'numerical',q:'A project costs ₹8 lakh and saves ₹10 lakh in one year. What is the simple net benefit?',o:['₹2 lakh','₹8 lakh','₹10 lakh','₹18 lakh'],a:0},
  {id:'n5',cap:'numerical',q:'A branch serves 600 customers. 90 complain. What is the complaint rate?',o:['9%','12%','15%','18%'],a:2},
  {id:'d3',cap:'data',q:'Which product should be investigated first?',ctx:'Return rates: A 2%, B 3%, C 11%, D 4%. Sales volumes are similar.',o:['A','B','C','D'],a:2},
  {id:'d4',cap:'data',q:'Which conclusion is most defensible?',ctx:'Conversion: Mobile 1.2%, Desktop 3.8%. Mobile gets 70% of traffic.',o:['Desktop traffic must be increased.','Mobile conversion is the larger performance gap and deserves investigation.','Mobile users never buy.','Desktop is always the better channel.'],a:1},
  {id:'d5',cap:'data',q:'Which number would help most to test whether training improved productivity?',o:['Number of training slides','Productivity before and after training for comparable teams','Trainer satisfaction only','Office attendance'],a:1},
  {id:'s3',cap:'structured',q:'Customer churn increased. Which first breakdown is strongest?',o:['Happy vs unhappy customers','New vs existing customers, then by segment and tenure','Marketing vs HR','Easy vs difficult accounts'],a:1},
  {id:'s4',cap:'structured',q:'Costs are rising. Which split is most useful?',o:['People vs everything else','Fixed vs variable costs, then by major cost category','Good costs vs bad costs','Head office vs rumours'],a:1},
  {id:'s5',cap:'structured',q:'A delivery process is slow. Which approach best maps the problem?',o:['List every complaint randomly','Map the steps from order receipt to dispatch and measure delay at each stage','Ask only the manager','Focus only on the final step'],a:1},
  {id:'c3',cap:'critical',q:'Which evidence most strongly supports “stock-outs caused lost sales”?',o:['Managers think stock is important.','Sales dropped mainly on days when high-demand items were unavailable.','Competitors advertise heavily.','Customers like discounts.'],a:1},
  {id:'c4',cap:'critical',q:'Which finding would make you question a survey result?',o:['A large random sample','Most respondents came from one highly engaged customer group','The survey used the same questions for everyone','Responses were anonymous'],a:1},
  {id:'c5',cap:'critical',q:'A correlation is found between longer meetings and lower productivity. What can you conclude safely?',o:['Long meetings definitely cause low productivity.','There is an association; causation still needs to be tested.','Meetings should be banned.','Productivity data is useless.'],a:1},
  {id:'j3',cap:'judgement',q:'Two problems are equally urgent, but one affects 80% of customers and the other 8%. What should guide priority?',o:['Whichever is easier','Impact, risk and urgency together','Whichever has a louder sponsor','Random choice'],a:1},
  {id:'j4',cap:'judgement',q:'A manager asks you to hide an unfavourable data point from a report. Best response?',o:['Do it because the manager asked.','Present the data accurately and explain the implication.','Delete the whole report.','Change the number slightly.'],a:1},
  {id:'j5',cap:'judgement',q:'A quick solution may help now but create a larger recurring cost. Best next step?',o:['Take the quick win automatically.','Compare short-term benefit with long-term cost before deciding.','Reject all quick fixes.','Delay the decision indefinitely.'],a:1},
  {id:'m3',cap:'communication',q:'Which message follows a clear Point → Reason → Example structure?',o:['Sales are down. Many things happened.','We should focus on repeat customers because they account for most of the decline; for example, repeat orders fell 18% while new orders were flat.','Customers are important.','There are several possibilities.'],a:1},
  {id:'m4',cap:'communication',q:'Which email opening is clearest?',o:['Hope you are well. Just wanted to say many things.','I am writing to confirm the revised launch date of 18 September and the two actions needed before then.','Please see below.','This is regarding stuff we discussed.'],a:1},
  {id:'m5',cap:'communication',q:'Which sentence is most suitable for a senior manager?',o:['Basically, the issue is kind of big.','The main issue is a 14% rise in late deliveries; I recommend adding peak-hour capacity for two weeks and measuring the result.','There are lots of details.','I will explain everything from the start.'],a:1},
  {id:'a3',cap:'adaptability',q:'Your first plan depends on data that turns out to be unreliable. Best response?',o:['Continue to avoid delay.','Replace or validate the data and update the plan.','Hide the weakness.','Use only the parts that support your view.'],a:1},
  {id:'a4',cap:'adaptability',q:'A client changes the objective halfway through a project. Best first move?',o:['Ignore the change.','Clarify the new objective, impact on scope and what must change.','Start again without discussion.','Blame the client.'],a:1},
  {id:'a5',cap:'adaptability',q:'A pilot fails to meet the target but reveals a useful pattern. What should you do?',o:['Call the whole project a failure.','Use the learning to revise the hypothesis and next test.','Delete the result.','Scale it anyway.'],a:1}
];

const EXTRA_FAMILY_MODULES = {
  'Consulting':[
    {cap:'structured',q:'A client says profits fell because “staff are not motivated.” What should you do first?',o:['Accept the diagnosis.','Break profit into revenue and cost drivers before testing staff motivation as one hypothesis.','Recommend training immediately.','Replace the team.'],a:1},
    {cap:'critical',q:'Which hypothesis is easiest to test?',o:['The company has a bad culture.','Repeat sales fell because delivery time rose in the top two cities.','Customers are unhappy.','Management is weak.'],a:1},
    {cap:'data',q:'Which result best supports a pricing problem?',ctx:'After a 12% price rise, volume fell 18% in price-sensitive segments but stayed flat in premium segments.',o:['The price rise affected every customer equally.','The pattern suggests price sensitivity differs by segment.','Premium customers caused the whole decline.','Price cannot matter.'],a:1},
    {cap:'judgement',q:'You can test only one cause today. Which should you choose?',o:['The most interesting cause','A high-impact cause with available evidence and a clear test','The cause your friend suggests','The cause with the longest explanation'],a:1},
    {cap:'communication',q:'Which consultant-style recommendation is strongest?',o:['We should improve operations.','I recommend fixing the dispatch bottleneck first because it explains 61% of delays; run a two-week pilot and track cycle time and complaints.','There are many options.','Operations seems weak.'],a:1},
    {cap:'adaptability',q:'New evidence disproves your lead hypothesis. What should happen?',o:['Defend it for consistency.','Retire it, promote the next plausible hypothesis and explain the change.','Ignore the evidence.','Stop the analysis.'],a:1}
  ],
  'Finance':[
    {cap:'numerical',q:'A company earns ₹12 crore profit on ₹120 crore revenue. What is its net margin?',o:['5%','8%','10%','12%'],a:2},
    {cap:'data',q:'Revenue rises 20% while receivables rise 55%. What deserves attention?',o:['Nothing; revenue rose.','Cash collection and working capital quality.','Only employee count.','Share price alone.'],a:1},
    {cap:'critical',q:'Which is the safest statement?',o:['Higher profit always means stronger cash flow.','Profit and cash flow can diverge, so both should be examined.','Cash flow is irrelevant.','Debt is always bad.'],a:1},
    {cap:'judgement',q:'A model gives a strong return only under very optimistic assumptions. Best response?',o:['Present only the base case.','Run sensitivity analysis and show how the result changes.','Use the optimistic case as fact.','Hide assumptions.'],a:1},
    {cap:'communication',q:'Which summary is strongest?',o:['The numbers are complex.','I recommend option A: it produces a 14% return with lower downside risk; the key assumptions are demand growth and input cost.','Please read the spreadsheet.','Finance is important.'],a:1},
    {cap:'structured',q:'A margin decline is being analysed. Which breakdown is most useful?',o:['Revenue mix, pricing, volume, and major cost drivers','Good departments vs bad departments','Finance vs everyone else','Old data vs new data'],a:0}
  ],
  'BFSI':[
    {cap:'numerical',q:'A loan of ₹5 lakh carries annual interest of 10%. Approximate annual interest before repayments?',o:['₹25,000','₹40,000','₹50,000','₹75,000'],a:2},
    {cap:'critical',q:'A borrower has high income but very unstable monthly cash flow. What does that suggest?',o:['No risk at all.','Income level alone is not enough; repayment stability also matters.','Automatic rejection.','Only collateral matters.'],a:1},
    {cap:'judgement',q:'A client asks for a product they do not appear to understand. Best next step?',o:['Sell quickly.','Check understanding, explain risks and suitability, then proceed only if appropriate.','Avoid discussing risk.','Ask them to sign immediately.'],a:1},
    {cap:'communication',q:'Which response best handles a sensitive customer issue?',o:['Policy says no.','I understand the concern. Here is why the request was declined, what can be reviewed, and the next step available to you.','Nothing can be done.','Please call later.'],a:1},
    {cap:'data',q:'A default spike appears after one policy change. What should be checked first?',o:['Whether affected loans share the changed policy characteristics','Office attendance','Brand colour','Only total loan volume'],a:0},
    {cap:'adaptability',q:'A risk rule changes overnight. What should a strong employee do?',o:['Use the old process until someone complains.','Update decisions and customer communication immediately, and flag uncertain cases.','Ignore borderline cases.','Wait a month.'],a:1}
  ],
  'Sales & Growth':[
    {cap:'communication',q:'A buyer says, “I need to think about it.” Best response?',o:['Keep talking without pause.','Ask what specifically they need to think through and what would help the decision.','Offer a discount immediately.','End the call.'],a:1},
    {cap:'judgement',q:'Which lead deserves priority?',ctx:'Lead A: high fit, active buying signal. Lead B: low fit, friendly. Lead C: medium fit, no urgency.',o:['A','B','C','All equal'],a:0},
    {cap:'critical',q:'A campaign generated many leads but few qualified opportunities. What should you investigate?',o:['Lead quality and qualification criteria','Office layout','Number of presentations','Only email subject lines'],a:0},
    {cap:'adaptability',q:'A prospect changes the buying criterion from price to reliability. Best response?',o:['Keep the same price-led pitch.','Reframe the conversation around reliability evidence and business impact.','Argue that price matters more.','End the meeting.'],a:1},
    {cap:'verbal',q:'Which question uncovers business impact best?',o:['Do you like our product?','What happens to your team or customers if this problem is not fixed?','Can I send a brochure?','Who else sells to you?'],a:1},
    {cap:'data',q:'Which metric is most useful for diagnosing stalled deals?',o:['Stage-to-stage conversion and time spent in each stage','Number of coffee meetings','Slide count','Total website pages'],a:0}
  ],
  'Marketing & Research':[
    {cap:'critical',q:'Which sample is most likely to bias a brand study?',o:['A random customer sample','Only people who follow the brand on social media','A stratified sample by customer type','A large panel with known quotas'],a:1},
    {cap:'data',q:'Campaign reach rose sharply but qualified leads fell. What is the best interpretation?',o:['Reach alone does not prove business impact; audience quality and conversion need checking.','The campaign was definitely successful.','Leads do not matter.','Reach should always be maximised.'],a:0},
    {cap:'structured',q:'A product launch underperforms. Which breakdown is strongest?',o:['Awareness, consideration, trial, conversion and repeat by target segment','Good ads vs bad ads','Marketing vs sales','Online vs offline only'],a:0},
    {cap:'judgement',q:'Two campaigns have similar ROI but one is based on a very small sample. Best response?',o:['Treat them as equally certain.','Consider both ROI and confidence in the evidence before scaling.','Choose the prettier campaign.','Ignore sample size.'],a:1},
    {cap:'communication',q:'Which research conclusion is strongest?',o:['Customers like convenience.','Among urban first-time buyers, delivery speed is the strongest stated driver; validate this with behaviour data before changing the proposition.','Everyone wants speed.','The survey proves everything.'],a:1},
    {cap:'adaptability',q:'A campaign fails in one segment but works in another. Best next move?',o:['Cancel everything.','Reallocate based on segment evidence and test the revised approach.','Keep spend unchanged.','Ignore the difference.'],a:1}
  ],
  'Human Resources':[
    {cap:'judgement',q:'A high performer is accused of unfair behaviour by several colleagues. Best first response?',o:['Dismiss the concern because performance is high.','Gather facts fairly before deciding.','Assume guilt immediately.','Move the complainants.'],a:1},
    {cap:'communication',q:'Which feedback opening is strongest?',o:['You are not professional.','In the last two client calls, the handover was incomplete, which delayed follow-up. Let us agree on a clearer close-out checklist.','Everyone is unhappy with you.','Do better.'],a:1},
    {cap:'critical',q:'Employee engagement fell after a policy change. What is the safest conclusion?',o:['The policy definitely caused the fall.','The timing suggests a possible link; check other changes and segment data.','The survey is wrong.','Managers are the only cause.'],a:1},
    {cap:'data',q:'Attrition is 22% overall but 41% in one business unit. Where should analysis start?',o:['The high-attrition unit','Every unit equally','The lowest-attrition unit','Ignore business-unit differences'],a:0},
    {cap:'structured',q:'Recruitment time is too long. Which process view is best?',o:['Map requisition → sourcing → screening → interview → offer and measure delay at each step','Blame candidates','Focus only on interviews','Ask only HR leadership'],a:0},
    {cap:'adaptability',q:'A training programme scores well on satisfaction but performance does not improve. Best response?',o:['Keep it unchanged because learners liked it.','Revisit transfer-to-job practice, manager support and performance evidence.','Stop measuring performance.','Increase slides.'],a:1}
  ],
  'Operations & Analytics':[
    {cap:'structured',q:'Order cycle time is rising. Which first approach is strongest?',o:['Map each process step and its wait time','Ask for more staff immediately','Look only at final delivery','Ignore handoffs'],a:0},
    {cap:'data',q:'A process step handles 20% of volume but causes 58% of delays. What does that suggest?',o:['It is likely a bottleneck worth investigating.','It is unimportant because volume is low.','All steps are equal.','Delay data should be ignored.'],a:0},
    {cap:'numerical',q:'A process falls from 100 minutes to 82 minutes. What is the percentage reduction?',o:['8%','12%','18%','22%'],a:2},
    {cap:'critical',q:'Automation reduces processing time but increases error rate. What should you conclude?',o:['Automation is automatically better.','Judge the trade-off using both speed and quality.','Errors do not matter.','Stop all automation.'],a:1},
    {cap:'judgement',q:'A bottleneck fix is cheap but affects only 3% of total delay. Best priority?',o:['Always do the cheapest fix first.','Compare impact with effort and prioritise higher-value opportunities.','Ignore impact.','Choose randomly.'],a:1},
    {cap:'communication',q:'Which operations recommendation is strongest?',o:['Improve the process.','Remove the approval bottleneck at step 4; it causes 46% of waiting time. Pilot the change for one week and track cycle time and errors.','There are many delays.','Add more people everywhere.'],a:1}
  ]
};

const WORKSTYLE_ITEMS = [
  {id:'w1',trait:'ambiguity',text:'I can make a reasonable decision even when some information is missing.'},
  {id:'w2',trait:'ambiguity',text:'I stay effective when priorities change unexpectedly.'},
  {id:'w3',trait:'detail',text:'I naturally check figures, wording and small inconsistencies before I submit work.'},
  {id:'w4',trait:'detail',text:'I prefer evidence that can be verified rather than broad impressions.'},
  {id:'w5',trait:'persistence',text:'I keep working through a difficult problem after my first idea fails.'},
  {id:'w6',trait:'persistence',text:'I am comfortable repeating a task to improve accuracy or quality.'},
  {id:'w7',trait:'collaboration',text:'I actively seek other viewpoints before finalising an important decision.'},
  {id:'w8',trait:'collaboration',text:'I am comfortable resolving disagreement without avoiding the issue.'},
  {id:'w9',trait:'persuasion',text:'I enjoy explaining an idea in a way that helps another person see its value.'},
  {id:'w10',trait:'persuasion',text:'I am comfortable asking questions that move a discussion toward a decision.'},
  {id:'w11',trait:'structure',text:'I prefer to break a large task into clear steps before I start.'},
  {id:'w12',trait:'structure',text:'I usually organise information before presenting a conclusion.'},
  {id:'w13',trait:'learning',text:'When evidence changes, I am willing to change my view quickly.'},
  {id:'w14',trait:'learning',text:'I actively look for lessons after a mistake or failed attempt.'},
  {id:'w15',trait:'risk',text:'Before taking a high-impact action, I think through downside risk and alternatives.'},
  {id:'w16',trait:'risk',text:'I prefer a controlled test before scaling a difficult-to-reverse decision.'}
];

const WORKSTYLE_PROFILES = {
  'Consulting':{ambiguity:5,detail:4,persistence:4,collaboration:4,persuasion:4,structure:5,learning:5,risk:4},
  'Finance':{ambiguity:3,detail:5,persistence:4,collaboration:3,persuasion:3,structure:5,learning:4,risk:5},
  'BFSI':{ambiguity:3,detail:5,persistence:4,collaboration:4,persuasion:4,structure:4,learning:4,risk:5},
  'Sales & Growth':{ambiguity:5,detail:3,persistence:5,collaboration:4,persuasion:5,structure:3,learning:5,risk:3},
  'Marketing & Research':{ambiguity:4,detail:4,persistence:4,collaboration:4,persuasion:4,structure:4,learning:5,risk:3},
  'Human Resources':{ambiguity:4,detail:4,persistence:4,collaboration:5,persuasion:4,structure:4,learning:5,risk:4},
  'Operations & Analytics':{ambiguity:3,detail:5,persistence:5,collaboration:4,persuasion:3,structure:5,learning:4,risk:4}
};

const WRITING_TASKS = {
  email:{
    title:'Writing Task 1 — Professional email',
    prompt:'You are coordinating a student consulting project. The client presentation was promised for Friday, but the analysis will not be ready until Monday because two important data files arrived late. Write an 80–140 word email to the client. State the point clearly, explain the reason, give one concrete fact or example, and end with a clear next step.',
    min:80,max:140
  },
  recommendation:{
    title:'Writing Task 2A — Initial recommendation',
    prompt:'A service company has seen customer complaints rise by 42% in two months. Initial data shows the longest waiting times occur between 4–7 p.m. Management is considering hiring extra full-time staff at a cost of ₹6 lakh per month. Write a 90–150 word recommendation to the manager. Lead with your recommendation, give the reason, use the available evidence, and state the next step.',
    min:90,max:150
  },
  revision:{
    title:'Writing Task 2B — New fact: revise your recommendation',
    newFact:'NEW INFORMATION: A deeper review shows only 35% of complaints occur between 4–7 p.m. Another 40% are about staff giving customers incorrect information, not waiting time.',
    prompt:'Revise your recommendation in 60–120 words. Show what changed in your thinking, what you now recommend, why, and what should happen next.',
    min:60,max:120
  }
};
