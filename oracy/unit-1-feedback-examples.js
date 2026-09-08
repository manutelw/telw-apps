// ORACY Unit 1 feedback overlay: turn rubric comments into concrete practice.
(function(){
  function score(item){const n=Number(item?.score||0);return n>=1&&n<=3?n:0;}
  function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function suggestions(rubric,rule){
    const raw=Array.isArray(rubric?.suggested_vocabulary)?rubric.suggested_vocabulary:[];
    const allowed=new Set([...ORACY_CORE_VOCAB,...rule.markers]);
    const hit=raw.filter(v=>allowed.has(String(v?.item||'').toLowerCase())&&String(v?.example||'').trim()).slice(0,5);
    if(hit.length)return hit;
    return [
      {item:'at least',example:'I practise English at least once every day.'},
      {item:'native language',example:'Hindi is my native language.'},
      {item:'by the way',example:'By the way, I use English at work too.'},
      {item:'anyway',example:'Anyway, I want to keep improving my English.'}
    ];
  }
  function exAt(list,i,fallback){return String(list[i]?.example||fallback).trim();}
  function itemAt(list,i,fallback){return String(list[i]?.item||fallback).trim();}
  function markerExample(rule){
    if(rule.type==='dialogue')return 'Exactly! English really helps me when I travel.';
    return 'By the way, I use English with my students too.';
  }
  function practiceBlock(example,ownPrompt){
    return `<div style="margin-top:6px;padding:8px 10px;border-left:3px solid #d59a19;background:#fffaf0"><b>Try this first:</b> “${esc(example)}”<br><b>Then you:</b> ${esc(ownPrompt)}</div>`;
  }

  oracyFriendlyRubric=function(rubric,rule,usedMarkers){
    const task=score(rubric?.task_achievement),range=score(rubric?.range),accuracy=score(rubric?.accuracy),fluency=score(rubric?.fluency),coherence=score(rubric?.coherence);
    const list=suggestions(rubric,rule);
    const ex1=exAt(list,0,'I use English for talking to my students.');
    const ex2=exAt(list,1,'I practise English at least once every day.');
    const ex3=exAt(list,2,'Anyway, I want to keep improving my English.');
    const item2=itemAt(list,1,'at least');
    const marker=markerExample(rule);
    const markerNames=usedMarkers.map(m=>ORACY_MARKER_LABELS[m]).join(', ');

    const taskText=task===3?'You covered the task well. Let’s stretch it with one more vivid detail.':task===2?'You answered the question. Good. Now make the answer easier to picture.':'You have the start of an answer. Now give me one clear point and one real detail.';
    const rangeText=range===3?'You used a good mix of words. Now make one of the Unit 1 expressions truly yours.':'Your meaning is clear. Let’s add one of the new expressions instead of repeating familiar words.';
    const accuracyText=accuracy===3?'Your sentences are working well. Keep the same clean shape when you add a new idea.':'Keep the sentence short and complete. Copy the pattern once, then make your own.';
    const fluencyText=fluency===3?'Your answer moves well. Now keep two ideas flowing together without stopping between every word.':'Build the answer in little chunks: idea + detail, then the next idea.';
    const coherenceText=coherence===3?'Your ideas are easy to follow. Keep using signposts only where they sound natural.':'Give the listener a signpost before you move to the next idea.';

    return [
      `<div><b>Your level today</b><br>${esc(oracyWarmLevelText(rubric?.cefr_estimate))}</div>`,
      `<div><b>Did you answer the task? ${task||'–'}/3</b><br>${esc(taskText)}${practiceBlock(ex1,'Now add one different detail from your own life — where, when, who with, or why.')}</div>`,
      `<div><b>Your words and expressions ${range||'–'}/3</b><br>${esc(rangeText)}${practiceBlock(ex2,`Now make a new sentence of your own using “${item2}”.`)}</div>`,
      `<div><b>Your sentences ${accuracy||'–'}/3</b><br>${esc(accuracyText)}${practiceBlock('I use English for reading messages.','Now make one sentence with the same pattern: “I use English for …ing”.')}</div>`,
      `<div><b>Your flow ${fluency||'–'}/3</b><br>${esc(fluencyText)}${practiceBlock(`${ex1} ${ex3}`,'Say both sentences together. Then add a third short sentence of your own without rushing.')}</div>`,
      `<div><b>Easy to follow? ${coherence||'–'}/3</b><br>${esc(coherenceText)}${practiceBlock(marker,rule.type==='dialogue'?'Now reply with a different reaction marker and add your own idea.':'Now use “Anyway” or “By the way” once in a new sentence of your own.')}</div>`,
      `<div><b>Pronunciation</b><br>Keep practising the /w/–/v/ work in this unit. Pronunciation should be judged from audio, not guessed from a transcript.</div>`,
      markerNames?`<div><b>Nice language choice</b><br>You used: ${esc(markerNames)}.</div>`:''
    ].filter(Boolean).join('<div style="height:10px"></div>');
  };

  oracyTeacherVoiceText=function(rubric,rule,passed,used){
    const list=suggestions(rubric,rule);
    const example=exAt(list,0,'I use English for talking to my students.');
    const task=score(rubric?.task_achievement);
    const opening=task>=3?'Lovely. You covered the task well. ':task===2?'Good — you answered the question. Now let’s make it more vivid. ':'You have a good start. Let’s build it one clear step at a time. ';
    const usedText=used.length?`I liked hearing ${used.map(m=>ORACY_MARKER_LABELS[m]).join(' and ')} in your answer. `:'';
    const markerText=passed?'Your speaking marker worked naturally. ':`On the next recording, remember to use ${rule.min===1?'one':'two'} suitable speaking marker${rule.min===1?'':'s'}. `;
    return `${opening}${usedText}Here is one sentence to copy first: ${example} Say that once. Good. Now give me another sentence of your own with a similar kind of detail. ${markerText}Keep it short and natural. I’d love to hear your next version.`;
  };
})();
