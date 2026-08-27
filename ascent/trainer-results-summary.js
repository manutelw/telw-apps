(function(){
  "use strict";

  const SANDEEP_TRAINER_UUID="11a461af-dde2-4f3c-a617-3ad7675f34d8";
  const SANDEEP_EMAIL="sandeep.kumar@fiib.edu.in";

  function isSandeepTrainer(){
    if(typeof currentSession==="undefined"||!currentSession) return false;
    const trainerUuid=String(currentSession.trainerUuid||currentSession.trainer_uuid||"").trim().toLowerCase();
    const email=String(currentSession.email||"").trim().toLowerCase();
    return trainerUuid===SANDEEP_TRAINER_UUID || email===SANDEEP_EMAIL;
  }

  function resultCategory(row){
    if (typeof resultTaskCategory === "function") return resultTaskCategory(row);
    const questionType=String(row&&row.questionType||"").trim().toUpperCase();
    const rubricType=String(row&&row.rubricType||"").trim().toUpperCase();
    const taskTitle=String(row&&row.taskTitle||"").trim().toUpperCase();
    if(taskTitle.includes("JD INTERVIEW MAPPER")||taskTitle.startsWith("JD ")||taskTitle.includes("· JD")) return "JD";
    if(questionType==="PI"||rubricType==="PI") return "PI";
    if(questionType==="GD"||rubricType==="GD") return "GD";
    if(questionType==="LUM"||(rubricType==="MANAGERIAL_COMMUNICATION"&&taskTitle.startsWith("LUM "))) return "LUM";
    return "ASCENT_TASK";
  }

  function categoryLabel(value){
    return value==="ASCENT_TASK"?"Ascent Task":value;
  }

  function numericScore(row){
    const value=row&&row.latestScore;
    if(value===null||value===undefined||value==="") return null;
    const number=Number(value);
    return Number.isFinite(number)?number:null;
  }

  function newestDate(rows){
    let newest=null;
    rows.forEach(function(row){
      if(!row||!row.latestSubmittedAt) return;
      const date=new Date(row.latestSubmittedAt);
      if(Number.isNaN(date.getTime())) return;
      if(!newest||date>newest) newest=date;
    });
    return newest;
  }

  function aggregateResults(rows){
    const groups=new Map();
    rows.forEach(function(row){
      if(!row) return;
      const category=resultCategory(row);
      const studentKey=String(row.studentUuid||row.studentId||row.email||row.fullName||"");
      const key=studentKey+"|"+category;
      if(!groups.has(key)) groups.set(key,{sample:row,category:category,rows:[],scores:[]});
      const group=groups.get(key);
      group.rows.push(row);
      const score=numericScore(row);
      if(score!==null) group.scores.push(score);
    });

    return Array.from(groups.values()).map(function(group){
      const latest=newestDate(group.rows);
      const average=group.scores.length?group.scores.reduce(function(a,b){return a+b;},0)/group.scores.length:null;
      return {
        sample:group.sample,
        category:group.category,
        average:average,
        submittedAt:latest,
        responseCount:group.scores.length
      };
    }).sort(function(a,b){
      const at=a.submittedAt?a.submittedAt.getTime():0;
      const bt=b.submittedAt?b.submittedAt.getTime():0;
      return bt-at;
    });
  }

  function enforceSandeepResultsUi(){
    if(!isSandeepTrainer()||typeof byId!=="function") return;
    const taskSelect=byId("resultTaskFilter");
    if(taskSelect){
      taskSelect.innerHTML='<option value="ASCENT_TASK">Ascent Task</option>';
      taskSelect.value="ASCENT_TASK";
      taskSelect.disabled=true;
    }
  }

  function renderStudentSummaryResults(){
    if(typeof resultFilter!=="function"||typeof byId!=="function"||typeof escapeHtml!=="function") return;
    enforceSandeepResultsUi();

    let rows=resultFilter((reportData&&reportData.results)||[],"result").filter(function(row){
      return Number(row&&row.attemptCount||0)>0 || numericScore(row)!==null;
    });

    if(isSandeepTrainer()){
      rows=rows.filter(function(row){return resultCategory(row)==="ASCENT_TASK";});
    }

    const summaries=aggregateResults(rows);
    visibleResultRows=rows;

    const countLabel=byId("resultCountLabel");
    if(countLabel) countLabel.textContent=summaries.length+" student/task summaries shown";
    const wrap=byId("resultsTableWrap");
    if(!wrap) return;
    if(!summaries.length){
      wrap.innerHTML='<div class="empty-state">No results match these filters.</div>';
      return;
    }

    wrap.innerHTML='<table><thead><tr><th>Student</th><th>Batch</th><th>Task</th><th>Status</th><th>Average Score</th><th>Responses</th><th>Latest Submission</th></tr></thead><tbody>'+summaries.map(function(item){
      const row=item.sample;
      const score=item.average===null?"—":item.average.toFixed(2).replace(/\.00$/,"");
      const submitted=item.submittedAt?(typeof formatDate==="function"?formatDate(item.submittedAt):item.submittedAt.toLocaleString()):"—";
      return '<tr><td><strong>'+escapeHtml(row.fullName||"")+'</strong><br>'+escapeHtml(row.studentId||"")+'<br>'+escapeHtml(row.email||"")+'</td><td>'+escapeHtml(row.batch||"—")+'</td><td><strong>'+escapeHtml(categoryLabel(item.category))+'</strong></td><td><span class="status-badge completed">COMPLETED</span></td><td>'+escapeHtml(score)+'</td><td>'+escapeHtml(String(item.responseCount))+'</td><td>'+escapeHtml(submitted)+'</td></tr>';
    }).join('')+'</tbody></table>';
  }

  window.renderResultsTable=renderStudentSummaryResults;

  document.addEventListener("DOMContentLoaded",function(){
    window.setTimeout(function(){
      enforceSandeepResultsUi();
      renderStudentSummaryResults();
    },0);
  });
})();
