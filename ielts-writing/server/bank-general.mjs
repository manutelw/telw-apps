// General Training question sets 03 to 25: original TELW tasks in the published IELTS Writing
// format. Task 1 letters cover formal, semi-formal and informal purposes; Task 2 covers every
// common question type. Sets are immutable once learners have used them.
import {generalSet as set} from './format.mjs';

const AGREE = 'To what extent do you agree or disagree?';
const BOTH = 'Discuss both these views and give your own opinion.';
const OUTWEIGH = 'Do the advantages of this outweigh the disadvantages?';
const DEVELOPMENT = 'Is this a positive or negative development?';
const FORMAL = true, NAMED = false;

export const GENERAL_SETS = [
  set(3, 'You recently bought a piece of furniture online, but when it was delivered it was damaged.', 'the company you bought it from',
    ['give details of what you bought and when', 'describe the damage', 'explain what you would like the company to do'], FORMAL,
    'Many people now buy most of their goods online rather than in shops.', OUTWEIGH),

  set(4, 'A close friend has invited you to their wedding, but you will not be able to attend.', 'your friend',
    ['thank your friend for the invitation', 'explain why you cannot attend', 'suggest a way to celebrate with them at another time'], NAMED,
    'Some people believe that expensive weddings and celebrations are a waste of money.', AGREE),

  set(5, 'You have seen an advertisement for a part-time job at a local sports centre.', 'the manager of the sports centre',
    ['say which job you are applying for and where you saw it', 'describe your relevant experience', 'explain when you are available to work'], FORMAL,
    'Some people think that teenagers should have a part-time job while they are still at school. Others believe that they should focus only on their studies.', BOTH),

  set(6, 'Your neighbours often play loud music late at night, and it is affecting you.', 'your neighbours',
    ['explain how the noise is affecting you', 'suggest what they could do', 'say what you will do if the problem continues'], NAMED,
    'In many cities, people no longer know their neighbours.', 'Why is this? What can be done to build stronger local communities?'),

  set(7, 'You are going to move to a new city for work and need somewhere to live.', 'a letting agency in that city',
    ['explain why you are moving', 'describe the kind of accommodation you want', 'ask about the costs and the next steps'], FORMAL,
    'More young adults are choosing to live with their parents for longer than in the past.', 'Why is this happening? Is it a positive or negative development?'),

  set(8, 'You recently stayed at a hotel and left a personal item in your room.', 'the hotel manager',
    ['give details of your stay', 'describe the item you left and where you think it is', 'explain how you would like it returned to you'], FORMAL,
    'Some people say that travelling to other countries is the best way to learn about different cultures.', AGREE),

  set(9, 'A friend is planning to start learning a new language and has asked for your advice.', 'your friend',
    ['say which language you think they should learn', 'explain why', 'suggest how they could practise it'], NAMED,
    'Some people believe that children should start learning a foreign language at primary school rather than at secondary school.', OUTWEIGH),

  set(10, 'The road outside your home is in poor condition and has become dangerous.', 'your local council',
    ['describe the problem', 'explain why it is dangerous', 'say what action you would like the council to take'], FORMAL,
    'Some people think that the government should pay for all road repairs and public transport. Others say that the people who use them should pay.', BOTH),

  set(11, 'You need to take a few days off work for a personal reason.', 'your manager',
    ['explain why you need the time off', 'say which days you would like to take', 'suggest how your work could be covered while you are away'], NAMED,
    'Some companies now allow employees to work four days a week instead of five.', OUTWEIGH),

  set(12, 'You recently attended a course at a college, but you were not satisfied with it.', 'the course director',
    ['give details of the course', 'explain what you were not satisfied with', 'say what you would like the college to do'], FORMAL,
    'Online courses are becoming more popular than traditional classroom courses.', DEVELOPMENT),

  set(13, 'An old friend is coming to stay with you for a weekend.', 'your friend',
    ['say how you feel about their visit', 'describe what you have planned for the weekend', 'tell them what they should bring'], NAMED,
    'Some people prefer to spend their free time with friends, while others prefer to spend it alone.', 'Discuss both these views and say which you prefer.'),

  set(14, 'You work in a large office and think that the company could do more to protect the environment.', 'your manager',
    ['describe what the company does at the moment', 'suggest some changes', 'explain how these changes would help'], NAMED,
    'Some people think that businesses should be forced by law to reduce the waste they produce.', AGREE),

  set(15, 'You ordered a meal from a restaurant for a family celebration, but there were problems with the order.', 'the restaurant manager',
    ['give details of the order', 'explain what went wrong', 'say what you expect the restaurant to do'], FORMAL,
    'Fewer families eat meals together than in the past.', 'Why is this? What effects does it have on family life?'),

  set(16, 'A friend has asked you to recommend a book that you have enjoyed recently.', 'your friend',
    ['describe the book', 'explain why you enjoyed it', 'say why you think your friend would like it'], NAMED,
    'Some people believe that reading books is no longer important because people can get information and entertainment from the internet.', AGREE),

  set(17, 'You would like to organise a social event for the residents of the building where you live.', 'the building manager',
    ['describe the event you want to organise', 'explain why it would be good for the residents', 'ask for the help you need'], NAMED,
    'Many people today feel lonely, even though they live in large cities.', 'What are the reasons for this, and what can be done about it?'),

  set(18, 'You have lost your bag on a train.', 'the train company',
    ['give details of your journey', 'describe the bag and its contents', 'explain why it is important to you to get it back'], FORMAL,
    'Some people think that public transport should be free for everyone.', AGREE),

  set(19, 'You have just returned from a holiday where you stayed with a friend and their family.', 'your friend',
    ['thank them for their hospitality', 'describe what you enjoyed most', 'invite them to visit you'], NAMED,
    'Some people prefer to spend their holidays in their own country rather than travelling abroad.', OUTWEIGH),

  set(20, 'You belong to a local sports club, and you think the club could be improved.', 'the club secretary',
    ['say how long you have been a member', 'describe what you would like to change', 'explain how these changes would benefit members'], NAMED,
    'Professional sports players are paid far more than people in other important jobs, such as nurses and teachers.', 'Is this fair?'),

  set(21, 'You recently had to cancel an appointment at the last minute and could not contact the office in time.', 'the manager of the clinic',
    ['explain which appointment you missed', 'apologise and explain why you could not attend', 'ask to arrange a new appointment'], FORMAL,
    'Some people believe that people who miss appointments without warning should have to pay a fine.', AGREE),

  set(22, 'A colleague who has helped you a great deal is leaving the company.', 'your colleague',
    ['thank them for their help', 'describe how they have helped you', 'wish them well and suggest keeping in touch'], NAMED,
    'Some people stay in the same job for many years, while others change jobs often.', 'Discuss the advantages of both and give your own opinion.'),

  set(23, 'You are not satisfied with the internet service that you pay for at home.', 'the internet service provider',
    ['give details of your account', 'describe the problems you have had', 'say what you want the company to do'], FORMAL,
    'Many people now spend several hours a day using social media.', DEVELOPMENT),

  set(24, 'You want to volunteer to help at a community event in your area.', 'the event organiser',
    ['say how you heard about the event', 'explain why you want to help', 'describe what you could do'], FORMAL,
    'Some people think that everyone should do unpaid community work for a period of time.', AGREE),

  set(25, 'A friend is going to start at the college where you studied.', 'your friend',
    ['say how you feel about their news', 'give advice about life at the college', 'suggest places to visit in the town'], NAMED,
    'Some people believe that university education should be free for all students. Others think that students should pay for their own studies.', BOTH)
];
