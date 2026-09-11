// Narrow source-audit corrections. Frozen Unit 1 is excluded.
// This file is intentionally limited to source coverage corrections; it does not change the shared ORACY architecture.
(function(){'use strict';const S=window.ORACY_C_SPECS;if(!S)return;
// Units 8-15 were checked against the supplied SLFT plan. Only clear coverage gaps are corrected here.
if(S[8]){S[8].theme='past events that made history and sea travel';S[8].contexts=['a maritime museum account of a historic rescue off the Indian coast','a sea journey in which one decision changed the outcome','discussing what might have happened if a warning had arrived later'];S[8].vocab=[['harbour','deck','cabin','lifeboat','crew'],['turning point','decisive','fortunate','avoidable','consequence'],['miss out on','come across','step in','go wrong','work out']];}
if(S[10]){S[10].theme='the body and physical appearance';S[10].vocab=[['regret','relieved','self-conscious','practical','unnecessary'],['forehead','jaw','shoulder','wrist','ankle'],['sort out','put off','go for','change one\'s mind','live with']];}
if(S[11]){S[11].theme='detailed description of unusual objects and extended family';S[11].vocab=[['oval','rough-textured','pale','compact','oversized'],['hand-painted','dark-blue','well-worn','lightweight','three-legged'],['maternal aunt','paternal uncle','cousin','niece','nephew']];}
// Units 16-30: restore lexical domains that were explicit in the full source but were under-represented in the summary-only placeholders.
if(S[16])S[16].vocab=[['put up','keep away','go ahead','put out','go through'],['procession','ritual','custom','harvest celebration','commemoration'],['fire exit','first-aid point','crowd control','open flame','safety barrier']];
if(S[19])S[19].vocab=[['kilometre','mile','kilogram','pound','rupee'],['fraction','decimal','percentage','multiplied by','divided by'],['add up','work out','round off','come to','break down']];
if(S[21])S[21].vocab=[['economics','sociology','physics','literature','geography'],['evening class','workshop','seminar','certificate course','assessment'],['catch up','fall behind','go over','hand in','keep at']];
if(S[24])S[24].vocab=[['livestock','wildlife','stray animal','domesticated','endangered'],['opposed to','object to','in favour of','strongly believe','unconvinced'],['speak out against','stand up for','back down','bring about','deal with']];
})();
