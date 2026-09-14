const TRACKS = [
  {id:'bd-sales',name:'BD & Sales',family:'Sales & Growth',source:'BD & Sales',weights:{communication:1.25,judgement:1.15,critical:1.05,adaptability:1.15}},
  {id:'market-research',name:'Market Research',family:'Marketing & Research',source:'Market Research & Marketing Analytics',weights:{data:1.25,critical:1.2,verbal:1.1,structured:1.1}},
  {id:'marketing-analytics',name:'Marketing Analytics',family:'Marketing & Research',source:'Market Research & Marketing Analytics',weights:{data:1.35,numerical:1.25,structured:1.15,critical:1.1}},
  {id:'digital-marketing',name:'Digital Marketing',family:'Marketing & Research',source:'Digital Marketing',weights:{data:1.15,communication:1.2,adaptability:1.2,judgement:1.1}},
  {id:'financial-analyst',name:'Financial Analyst / Corporate Finance',family:'Finance',source:'Financial Analyst / Corporate Finance',weights:{numerical:1.4,data:1.25,critical:1.15,judgement:1.05}},
  {id:'investment-research',name:'Investment Research',family:'Finance',source:'Investment Research / Equity Research / Valuation',weights:{numerical:1.3,data:1.3,critical:1.25,structured:1.15}},
  {id:'equity-valuation',name:'Equity Research / Valuation',family:'Finance',source:'Investment Research / Equity Research / Valuation',weights:{numerical:1.35,data:1.3,critical:1.25,structured:1.15}},
  {id:'banking',name:'Banking',family:'BFSI',source:'Banking / Wealth Management / Credit / BFSI',weights:{numerical:1.2,judgement:1.2,communication:1.1,critical:1.1}},
  {id:'wealth',name:'Wealth Management',family:'BFSI',source:'Banking / Wealth Management / Credit / BFSI',weights:{communication:1.25,judgement:1.2,numerical:1.15,critical:1.05}},
  {id:'credit-bfsi',name:'Credit / BFSI',family:'BFSI',source:'Banking / Wealth Management / Credit / BFSI',weights:{numerical:1.3,critical:1.25,data:1.2,judgement:1.15}},
  {id:'talent-acquisition',name:'Talent Acquisition / Recruitment',family:'Human Resources',source:'Talent Acquisition / Recruitment',weights:{communication:1.3,judgement:1.25,verbal:1.15,adaptability:1.1}},
  {id:'hrbp',name:'HR Generalist / HR Business Partner',family:'Human Resources',source:'HR Generalist / HR Business Partner',weights:{judgement:1.3,communication:1.25,critical:1.1,adaptability:1.15}},
  {id:'ld',name:'Learning & Development',family:'Human Resources',source:'Learning & Development / HR Analytics',weights:{communication:1.3,verbal:1.2,structured:1.15,adaptability:1.1}},
  {id:'hr-analytics',name:'HR Analytics',family:'Human Resources',source:'Learning & Development / HR Analytics',weights:{data:1.3,numerical:1.2,critical:1.15,structured:1.1}},
  {id:'operations-analytics',name:'Operations Analytics',family:'Operations & Analytics',source:'Operations Analytics / Business Analytics',weights:{data:1.3,numerical:1.2,structured:1.25,judgement:1.1}},
  {id:'business-analytics',name:'Business Analytics',family:'Operations & Analytics',source:'Operations Analytics / Business Analytics',weights:{data:1.35,structured:1.25,numerical:1.2,critical:1.15}},
  {id:'supply-chain',name:'Supply Chain / Logistics Analytics',family:'Operations & Analytics',source:'Supply Chain / Logistics Analytics',weights:{structured:1.25,data:1.2,judgement:1.2,numerical:1.1}},
  {id:'process-excellence',name:'Process Excellence / Six Sigma / Automation',family:'Operations & Analytics',source:'Process Excellence / Six Sigma / Automation',weights:{structured:1.35,data:1.25,critical:1.2,judgement:1.1}},
  {id:'strategy-consulting',name:'Business / Strategy Consulting',family:'Consulting',source:'Business / Strategy / Analytics Consulting',weights:{structured:1.4,critical:1.3,data:1.15,communication:1.15}},
  {id:'analytics-consulting',name:'Analytics Consulting',family:'Consulting',source:'Business / Strategy / Analytics Consulting',weights:{structured:1.35,data:1.35,critical:1.25,communication:1.1}}
];

const CORE_QUESTIONS = [
 {id:'v1',cap:'verbal',q:'A manager says, “Customer satisfaction fell after we changed the support process.” What is the safest conclusion?',o:['The new process definitely caused the fall.','The timing suggests a possible link, but we need more evidence.','Support staff are performing badly.','The old process was better in every way.'],a:1},
 {id:'v2',cap:'verbal',q:'Which statement is the clearest business conclusion?',ctx:'Data: Complaints rose from 80 to 120 while total orders stayed roughly the same.',o:['Complaints are a problem.','Orders did not change much.','The complaint rate increased substantially and needs investigation.','Customers are unhappy because prices are high.'],a:2},
 {id:'n1',cap:'numerical',q:'Monthly sales rose from ₹40 lakh to ₹46 lakh. What was the percentage increase?',o:['6%','10%','15%','20%'],a:2},
 {id:'n2',cap:'numerical',q:'A team closes 30 of 120 qualified leads. What is the conversion rate?',o:['20%','25%','30%','40%'],a:1},
 {id:'d1',cap:'data',q:'Which segment deserves the first look?',ctx:'Revenue change: North +4%, South -18%, East +2%, West -3%. All regions are similar in size.',o:['North','South','East','West'],a:1},
 {id:'d2',cap:'data',q:'What is the strongest insight from this data?',ctx:'Average delivery time: Week 1 = 31 min, Week 2 = 32 min, Week 3 = 44 min. Complaints: 18, 20, 49.',o:['Complaints always rise over time.','Longer delivery time may be linked with the sharp rise in complaints.','Week 1 performance was perfect.','Delivery time is the only possible cause.'],a:1},
 {id:'s1',cap:'structured',q:'Profit has fallen. Which first split is the most useful?',o:['People vs technology','Revenue vs cost','Marketing vs HR','Easy problems vs hard problems'],a:1},
 {id:'s2',cap:'structured',q:'A store has fewer customers. Which breakdown is the most structured?',o:['Price, manager mood, weather, colour of the logo','New customers vs repeat customers, then by channel and time period','Good customers vs bad customers','Advertising vs everything else'],a:1},
 {id:'c1',cap:'critical',q:'Which is an assumption rather than a fact?',ctx:'Facts: App ratings fell from 4.4 to 3.8. Delivery time rose by 9 minutes.',o:['App ratings fell.','Delivery time rose.','Slow delivery caused the lower rating.','Both measures changed.'],a:2},
 {id:'c2',cap:'critical',q:'Your hypothesis is “repeat orders fell because delivery became slower.” Which evidence would weaken it most?',o:['Delivery time rose for repeat customers.','Repeat orders fell only in areas where delivery time did not change.','Complaints mention slow delivery.','Competitors deliver faster.'],a:1},
 {id:'j1',cap:'judgement',q:'You have one day to investigate four possible causes. What should you do first?',o:['Study all four equally.','Start with the causes that could explain most of the problem and can be tested quickly.','Pick the cause your manager likes most.','Choose the easiest cause even if impact is small.'],a:1},
 {id:'j2',cap:'judgement',q:'A solution could improve sales but creates a high compliance risk. What is the best response?',o:['Ignore the risk because sales matter more.','Reject the idea immediately without analysis.','Assess the risk, expected benefit and safer alternatives before deciding.','Ask someone else to decide so you are not responsible.'],a:2},
 {id:'m1',cap:'communication',q:'Which recommendation is strongest?',o:['We should improve service.','Maybe we can try something with staffing.','Add one service counter from 12–2 pm because 68% of delays occur then; test for two weeks and track wait time and repeat orders.','Customers dislike waiting.'],a:2},
 {id:'m2',cap:'communication',q:'A senior manager asks for the conclusion first. Which opening works best?',o:['Let me explain everything we did from the beginning.','There are many things to consider.','I recommend option B because it gives the largest impact with manageable risk. I will show the two facts behind that.','This is a very complicated issue.'],a:2},
 {id:'a1',cap:'adaptability',q:'New data strongly contradicts your first view. What should you do?',o:['Defend the first view to appear confident.','Change the numbers.','Update the hypothesis and explain why your view changed.','Ignore the new data until the project ends.'],a:2},
 {id:'a2',cap:'adaptability',q:'You planned a customer survey, but only 12 people respond. What is the best next step?',o:['Treat the 12 responses as fully representative.','Stop the project.','State the limitation, seek another data source and revise the plan.','Remove responses that do not fit your expectation.'],a:2}
];

const FAMILY_MODULES = {
 'Consulting':[
  {cap:'structured',q:'A retailer’s profit is falling. Which issue tree is strongest?',o:['Profit → staff / ads / office','Profit → revenue / cost; revenue → price / volume; cost → fixed / variable','Profit → good / bad','Profit → online / manager'],a:1},
  {cap:'critical',q:'A client insists price is the problem. What should you do?',o:['Accept it as the root cause.','Test price against other plausible causes using data.','Lower price immediately.','Avoid questioning the client.'],a:1},
  {cap:'data',q:'Which fact most deserves priority?',ctx:'Price complaints: 6% of lost orders. Stock-outs: 12%. Late delivery: 54%. Unknown: 28%.',o:['Price complaints','Stock-outs','Late delivery','Unknown only'],a:2},
  {cap:'communication',q:'Which answer follows recommendation-first logic?',o:['Here are twelve facts...','I recommend fixing peak-hour delivery capacity; it explains most lost repeat orders and can be tested quickly.','We need more meetings.','There are pros and cons.'],a:1},
  {cap:'judgement',q:'A promising solution is expensive and hard to reverse. What is the best move?',o:['Launch everywhere.','Pilot it on a limited scale with success metrics.','Reject it because it is expensive.','Wait indefinitely.'],a:1},
  {cap:'adaptability',q:'After a pilot, the expected benefit appears only half as large. What should happen?',o:['Keep the original claim.','Review assumptions, update the business case and decide again.','Hide the pilot result.','Scale faster.'],a:1}
 ],
 'Finance':[
  {cap:'numerical',q:'Revenue is ₹80 crore and EBITDA margin is 15%. Approximate EBITDA?',o:['₹8 cr','₹12 cr','₹15 cr','₹20 cr'],a:1},
  {cap:'data',q:'A company’s revenue grows but cash from operations falls sharply. What is the best response?',o:['Growth means everything is fine.','Investigate working capital and cash conversion before concluding.','Cash never matters if profit rises.','Assume fraud.'],a:1},
  {cap:'critical',q:'Which statement is strongest?',o:['The stock is cheap because its price fell.','The stock may be undervalued if fundamentals support a value above market price.','A low share price always means value.','Past growth guarantees future growth.'],a:1},
  {cap:'judgement',q:'Two investments offer similar return, but one has far more downside risk. What should you do?',o:['Ignore risk.','Compare risk-adjusted return and fit with the investor objective.','Choose the more exciting company.','Split money equally without analysis.'],a:1},
  {cap:'communication',q:'How should you explain a financial recommendation to a non-finance manager?',o:['Use more jargon to sound expert.','Lead with the decision, business impact and two key numbers.','Read every ratio.','Avoid numbers completely.'],a:1},
  {cap:'structured',q:'Credit quality worsens. Which first split is useful?',o:['Borrower capacity / willingness / collateral and loan terms','Good / bad customers','Sales / HR','Old / young managers'],a:0}
 ],
 'BFSI':[
  {cap:'numerical',q:'A borrower pays ₹24,000 per month on income of ₹80,000. What share of income goes to this payment?',o:['20%','25%','30%','40%'],a:2},
  {cap:'judgement',q:'A client wants a high-risk product but says capital safety is the top priority. What should you do?',o:['Sell it because the client asked.','Clarify the mismatch and recommend options aligned with the stated goal.','Avoid discussing risk.','Promise there will be no loss.'],a:1},
  {cap:'critical',q:'Which is a warning sign that deserves further checking in credit analysis?',o:['Stable cash flow','Falling cash flow with rising short-term debt','Regular repayments','Lower leverage'],a:1},
  {cap:'communication',q:'A customer is upset about a declined request. Best response?',o:['The system rejected it. Nothing can be done.','Explain the reason clearly, what can be reviewed, and the next possible step.','Use policy jargon.','End the call quickly.'],a:1},
  {cap:'data',q:'Default rate rises only in one borrower segment. What should you do first?',o:['Change policy for everyone.','Compare that segment with others and identify what changed.','Stop all lending.','Ignore it until next year.'],a:1},
  {cap:'adaptability',q:'New regulation changes product eligibility. What should happen?',o:['Keep using the old rule.','Update the decision process and customer communication promptly.','Hide the change.','Wait for complaints.'],a:1}
 ],
 'Sales & Growth':[
  {cap:'communication',q:'A prospect says, “Your price is too high.” What is the best first response?',o:['Immediately offer a discount.','Ask what they are comparing it with and what outcome matters most.','Say the price is fixed and end the conversation.','Criticise the competitor.'],a:1},
  {cap:'judgement',q:'You have ten leads and limited time. Which should you contact first?',o:['Random leads','High-fit leads showing recent buying intent','Oldest names only','Friends first'],a:1},
  {cap:'critical',q:'Sales fell after a price increase. What should you conclude?',o:['Price definitely caused the fall.','Price is one hypothesis; check customer segment, competitor action, volume and timing.','Never raise price.','Marketing failed.'],a:1},
  {cap:'adaptability',q:'A pitch is not landing with a technical buyer. Best move?',o:['Repeat it louder.','Shift to the buyer’s technical priorities and evidence.','End early.','Use more generic benefits.'],a:1},
  {cap:'verbal',q:'Which question is most useful in discovery?',o:['You like our product, right?','What is making this problem important now?','Can I send a brochure?','Who is your favourite vendor?'],a:1},
  {cap:'data',q:'Which sales metric best signals funnel quality?',o:['Number of emails sent alone','Qualified-lead-to-opportunity conversion','Office attendance','Total slide count'],a:1}
 ],
 'Marketing & Research':[
  {cap:'critical',q:'A survey of 40 Instagram followers says 90% love the brand. Best conclusion?',o:['90% of all customers love the brand.','The result is useful but may be biased because the sample is narrow.','The campaign is proven successful.','No more research is needed.'],a:1},
  {cap:'data',q:'Campaign A has CTR 4% and conversion 0.4%; Campaign B has CTR 2% and conversion 1.6%. If sales are the goal, what needs attention?',o:['CTR only','Conversion and economics after the click','Follower count','Logo colour'],a:1},
  {cap:'structured',q:'Brand consideration is falling. Which breakdown is most useful?',o:['Awareness → consideration → trial → repeat, by segment/channel','Good ads / bad ads','Online / everything else','Creative / finance'],a:0},
  {cap:'communication',q:'How should a research insight be presented?',o:['All raw data first','Insight → evidence → implication → recommended action','Only a chart','Only the recommendation'],a:1},
  {cap:'adaptability',q:'A message works for students but fails for working professionals. Best response?',o:['Use the same message everywhere.','Adapt message and proof to the second audience, then retest.','Stop the campaign.','Assume professionals are not interested.'],a:1},
  {cap:'judgement',q:'You can test one campaign idea this week. Which should you choose?',o:['The most creative one','The one tied to the key business question and measurable outcome','The longest one','The cheapest regardless of objective'],a:1}
 ],
 'Human Resources':[
  {cap:'judgement',q:'A manager wants to reject a candidate based on “gut feel” despite strong evidence. Best response?',o:['Agree with the manager.','Ask for job-relevant evidence and apply the same criteria used for others.','Ignore the manager.','Select the candidate automatically.'],a:1},
  {cap:'communication',q:'An employee raises a sensitive concern. Best first response?',o:['Promise an outcome immediately.','Listen, clarify facts, explain the process and maintain appropriate confidentiality.','Tell colleagues.','Give advice before hearing details.'],a:1},
  {cap:'critical',q:'Attrition is high in one team. What is the best starting view?',o:['The manager is definitely the problem.','Treat manager behaviour as one hypothesis and compare workload, pay, role clarity and team data.','Employees are disloyal.','Exit interviews are useless.'],a:1},
  {cap:'data',q:'Training satisfaction is high but performance does not improve. What should you do?',o:['Declare training successful.','Look at behaviour/performance measures and barriers to transfer.','Run the same course again.','Stop measuring.'],a:1},
  {cap:'adaptability',q:'Employees resist a new process. Best next step?',o:['Force compliance immediately.','Find the source of resistance, clarify impact and adjust support where needed.','Cancel all change.','Ignore feedback.'],a:1},
  {cap:'structured',q:'A hiring problem is broad. Which split is useful?',o:['Attraction → screening → selection → offer → joining','Recruiters / everyone else','Good / bad candidates','Campus / office furniture'],a:0}
 ],
 'Operations & Analytics':[
  {cap:'structured',q:'Orders are late. Which process view is most useful?',o:['Order received → picked → packed → dispatched → delivered','People vs machines only','Morning vs evening only','Good vs bad orders'],a:0},
  {cap:'data',q:'A process has average time 10 min but 15% of cases take 45+ min. What matters?',o:['Average proves the process is fine.','Investigate the long-tail cases and their causes.','Delete the slow cases.','Only increase staffing.'],a:1},
  {cap:'numerical',q:'Defects fall from 50 per 1,000 units to 20 per 1,000. What is the reduction in defects?',o:['20%','40%','60%','150%'],a:2},
  {cap:'critical',q:'Automation is proposed for a broken process. Best response?',o:['Automate immediately.','Understand and simplify the process before automating it.','Reject all automation.','Buy the newest tool.'],a:1},
  {cap:'judgement',q:'Two bottlenecks exist. One affects 70% of late orders; the other affects 8%. Which first?',o:['The 8% issue because it is easier','The 70% issue, unless constraints make another sequence better','Both equally','Neither'],a:1},
  {cap:'communication',q:'How should an operations recommendation be framed?',o:['Use technical detail only','State the bottleneck, quantified impact, proposed change and measure of success','Avoid numbers','List every process step'],a:1}
 ]
};

const TRAINING = {
 verbal:{title:'Business Verbal Reasoning',desc:'Identify the main point, separate inference from fact, and summarise business information accurately.'},
 numerical:{title:'Business Numeracy',desc:'Practise percentages, ratios, growth, averages and quick business calculations.'},
 data:{title:'Data Interpretation',desc:'Read charts and tables, find the signal, compare segments and state the business implication.'},
 structured:{title:'Structured Problem Solving',desc:'Break broad problems into logical branches, build issue trees and avoid gaps or overlap.'},
 critical:{title:'Critical Thinking & Hypothesis Testing',desc:'Separate fact from assumption, build testable explanations and look for evidence that could disprove them.'},
 judgement:{title:'Prioritisation & Business Judgement',desc:'Choose what matters first using impact, evidence, risk and practical constraints.'},
 communication:{title:'Recommendation Communication',desc:'Give the answer first, support it with two or three reasons, evidence, risk and next step.'},
 adaptability:{title:'Adaptability Under New Information',desc:'Update your view when facts change, state uncertainty and adjust your plan without losing clarity.'}
};
