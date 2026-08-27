(function(){
  "use strict";

  window.__ASCENT_PLAY_CORE__=true;

  function upper(value){return String(value||"").trim().toUpperCase();}

  function isJdAssignment(row){
    const title=upper(row&& (row.taskTitle||row.title||row.task_title));
    return title.includes("JD INTERVIEW MAPPER") || title.startsWith("JD ") || title.includes("· JD");
  }

  function isCoreBankQuestion(row){
    const questionType=upper(row&&(row.questionType||row.question_type));
    const rubricType=upper(row&&(row.rubricType||row.rubric_type));
    const title=upper(row&&(row.title||row.bankTitle||row.bank_name));
    if(questionType==="PI"||questionType==="GD"||questionType==="LUM"||questionType==="DIAGNOSTIC") return true;
    if(rubricType==="PI"||rubricType==="GD") return true;
    if(rubricType==="MANAGERIAL_COMMUNICATION"&&title.includes("LUM")) return true;
    if(title.includes("DIAGNOSTIC")) return true;
    return false;
  }

  function applyCoreScope(){
    if(Array.isArray(window.activeAssignments)){
      window.activeAssignments=window.activeAssignments.filter(function(row){return !isJdAssignment(row);});
    }
    if(Array.isArray(window.questionBank)){
      window.questionBank=window.questionBank.filter(isCoreBankQuestion);
    }
  }

  function removeNonCoreUi(){
    const customPack=document.getElementById("customQuestionPackBox");
    if(customPack) customPack.remove();

    const select=document.getElementById("practiceModeSelect");
    if(select){
      Array.from(select.options).forEach(function(option){
        if(option.value==="custom") option.remove();
      });
      if(select.value==="custom"){
        if(Array.from(select.options).some(function(option){return option.value==="assigned";})) select.value="assigned";
        else if(Array.from(select.options).some(function(option){return option.value==="question_bank";})) select.value="question_bank";
      }
    }

    const customField=document.getElementById("customQuestionField");
    if(customField) customField.hidden=true;

    document.querySelectorAll('a[href*="live-mock"],a[href*="coach"],a[href*="jd"],a[href*="custom-question-pack"]').forEach(function(link){link.remove();});
  }

  const originalRender=typeof window.renderPracticeContext==="function"?window.renderPracticeContext:null;
  if(originalRender){
    window.renderPracticeContext=function(){
      applyCoreScope();
      originalRender();
      removeNonCoreUi();
      if(typeof window.updatePracticeMode==="function") window.updatePracticeMode();
    };
  }

  const originalLoad=typeof window.loadPracticeContext==="function"?window.loadPracticeContext:null;
  if(originalLoad){
    window.loadPracticeContext=async function(){
      await originalLoad();
      applyCoreScope();
      if(typeof window.renderPracticeContext==="function") window.renderPracticeContext();
    };
  }

  applyCoreScope();
  if(typeof window.renderPracticeContext==="function") window.renderPracticeContext();
  removeNonCoreUi();
})();