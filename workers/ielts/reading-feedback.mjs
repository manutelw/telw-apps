import {compactFeedback} from '../../ielts-listening/public/feedback.mjs';
// Presentation only: retain the service's assignment, timer, answers and scoring.
export function withReadingFeedback(html){
 const start=html.indexOf('const ranges=track==="academic"'),end=html.indexOf('$("score").textContent=correct+" / 40"',start);
 if(start<0||end<start)return html;
 const options='<option value="">Not sure yet</option>'+Array.from({length:11},(_,i)=>{const band=(4+i/2).toFixed(1);return '<option value="'+band+'">'+band+'</option>';}).join('');
 const target='<p><label for="diagnosticTarget">Your target Reading band</label><br><select id="diagnosticTarget" style="padding:11px;max-width:420px;width:100%">'+options+'</select></p>';
 html=html.slice(0,start)+'$("bandReference").innerHTML=compactFeedback({skill:"Reading",track,score:scored,target:$("diagnosticTarget").value});$("targetBand").value=$("diagnosticTarget").value||"Not sure yet";$("questionTypes").replaceChildren();$("practiceSteps").replaceChildren();'+html.slice(end);
 // The deploy bundler may wrap inner functions in __name(...). The page has no such helper, so supply one.
 const feedbackScript='var __name=globalThis.__name||(f=>f);'+compactFeedback.toString();
 html=html.replace('"use strict";let attemptId',feedbackScript+';"use strict";let attemptId')
  .replace('<p><button id="start">',target+'<p><button id="start">')
  .replace('<h3>What your answers show</h3>','').replace('<h3>Your recommended areas for improvement</h3>','')
  .replace(/\$\("summary"\)\.textContent="You answered "[\s\S]*?; \$\("breakdown"\)\.textContent=[\s\S]*?;show\("result"\)/,'$("summary").textContent="";$("breakdown").textContent="";show("result")')
  .replace('Please call TELW The English Workshop on <a href="tel:+919211392003"><strong>9211392003</strong></a> and ask','Please WhatsApp TELW The English Workshop on <a href="https://wa.me/919717116831"><strong>+91 9717 116 831</strong></a> (messages only) and ask')
  .replace('email:$("feedbackEmail").value,consent:$("feedbackConsent").checked})','email:$("feedbackEmail").value,consent:$("feedbackConsent").checked,target:$("diagnosticTarget").value})')
  .replace(' You can still call TELW on 9211392003.',' You can still WhatsApp TELW on +91 9717 116 831 (messages only).')
  .replace('This result is based on an original, uncalibrated diagnostic. It is not an official IELTS band score. Detailed answers and explanations belong to the improvement programme, not this initial diagnostic.','Your detailed diagnostic evidence remains available to TELW when you opt in to training.');
 return html;
}
