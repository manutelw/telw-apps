// Level C Units 2-30: remove incidental place names from learner tasks while keeping place where it changes the meaning.
(function(){
'use strict';
const specs=window.ORACY_C_SPECS||{};
const replacements={
 'a new neighbourhood in Indore':'a new neighbourhood',
 'comparing Mysuru and Bengaluru':'comparing two cities',
 'an evening walk beside a restored lake':'an evening walk beside a restored lake',
 'joining a weekend cycling group':'joining a weekend cycling group',
 'learning classical guitar in Chennai':'learning classical guitar',
 'helping a cousin prepare for a theatre audition':'helping a cousin prepare for a theatre audition',
 'rearranging a flat in Noida':'rearranging a flat',
 'describing a family home in Kochi':'describing a family home',
 'finding space in a compact Mumbai apartment':'finding space in a compact apartment',
 'planning a family train trip to Udaipur':'planning a family train trip',
 'describing a film set in Ladakh':'describing a film set in a mountain region',
 'repairing spectacles in Hyderabad':'repairing spectacles',
 'describing a handmade lamp from Jaipur':'describing a handmade lamp',
 'guiding a visitor around Hampi':'guiding a visitor around a heritage site',
 'planning a nature trail in Sikkim':'planning a nature trail',
 'thanking a host family in Kerala':'thanking a host family after a visit',
 'an Indian student preparing for the UK':'an Indian student preparing to study in the UK',
 'planning a cruise from Mumbai':'planning a cruise from an Indian port'
};
for(const unit of Object.values(specs)){
 if(!Array.isArray(unit?.contexts))continue;
 unit.contexts=unit.contexts.map(c=>replacements[c]||c);
}
})();
