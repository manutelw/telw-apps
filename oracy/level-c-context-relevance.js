// Level C Units 2-30: remove incidental place names from learner tasks while keeping place where it changes the meaning.
(function(){
'use strict';
const specs=window.ORACY_C_SPECS||{};
const exact={
 'comparing Mysuru and Bengaluru':'comparing two cities',
 'guiding a visitor around Hampi':'guiding a visitor around a heritage site',
 'an Indian student preparing for the UK':'an Indian student preparing to study in the UK',
 'an Indian student preparing to study in Britain':'an Indian student preparing to study in Britain'
};
function cleanContext(c){
 let s=exact[c]||String(c||'');
 s=s
  .replace(/\bin Indore\b/g,'')
  .replace(/\bin Chennai\b/g,'')
  .replace(/\bin Noida\b/g,'')
  .replace(/\bin Kochi\b/g,'')
  .replace(/\bin Hyderabad\b/g,'')
  .replace(/\bto Udaipur\b/g,'')
  .replace(/\bin Ladakh\b/g,' in a mountain region')
  .replace(/\bfrom Jaipur\b/g,'')
  .replace(/\bin Sikkim\b/g,'')
  .replace(/\bin Kerala\b/g,' after a visit')
  .replace(/\bMumbai apartment\b/g,'apartment')
  .replace(/\bfrom Mumbai\b/g,'from an Indian port')
  .replace(/\bleaving from Mumbai\b/g,'leaving from an Indian port')
  .replace(/\bMumbai cruise\b/g,'cruise')
  .replace(/\s{2,}/g,' ')
  .replace(/\s+([,.!?])/g,'$1')
  .trim();
 return s;
}
for(const unit of Object.values(specs)){
 if(!Array.isArray(unit?.contexts))continue;
 unit.contexts=unit.contexts.map(cleanContext);
}
})();
