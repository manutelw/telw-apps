(()=>{
'use strict';
const replacements={Natasha:'Naina',Amanda:'Priya',Karl:'Karan'};

document.querySelectorAll('.passage[data-audio-id] p').forEach(p=>{
  const label=p.querySelector(':scope > b:first-child');
  if(label){
    const current=label.textContent.replace(/:$/,'').trim();
    if(replacements[current])label.textContent=`${replacements[current]}:`;
  }
  for(const node of p.childNodes){
    if(node.nodeType!==Node.TEXT_NODE)continue;
    let text=node.nodeValue||'';
    for(const [from,to] of Object.entries(replacements))text=text.replace(new RegExp(`\\b${from}\\b`,'g'),to);
    node.nodeValue=text;
  }
});
})();
