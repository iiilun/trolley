'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const NS = 'http://www.w3.org/2000/svg';
  const SCENES = [
    {id:'switch',title:'一與五',kind:'switch',main:5,side:1,category:'經典 · 轉轍器',copy:'失控的電車正朝五個人前進。旁邊的支線上，站著一個人。你是唯一能改變方向的人。',act:'拉動拉桿：轉向支線，一人犧牲。',idle:'不動：沿原軌道，五人犧牲。',actionLabel:'轉向',gesture:'拖曳或點按拉桿，也可以按空白鍵。',principle:'當犧牲是改道的副作用，你如何衡量人數？',utility:true},
    {id:'two',title:'差距變小了',kind:'switch',main:2,side:1,category:'延伸 · 人數差距',copy:'同一座月台，同一支拉桿。這一次，主線上只有兩個人；支線上仍是一個人。',act:'拉動拉桿：一人犧牲，兩人獲救。',idle:'不動：兩人犧牲。',actionLabel:'轉向',gesture:'拖曳或點按拉桿；電車通過岔口前可以改變心意。',principle:'當救下的人數減少，你的判斷是否改變？',utility:true},
    {id:'equal',title:'沒有比較少',kind:'switch',main:1,side:1,category:'延伸 · 作為與不作為',copy:'兩條軌道上，各站著一個陌生人。無論是否改道，都會有一個人犧牲。',act:'拉動拉桿：讓支線上的人犧牲。',idle:'不動：讓主線上的人犧牲。',actionLabel:'轉向',gesture:'拖曳或點按拉桿。什麼也不做，時間仍會前進。',principle:'結果相同時，是否主動介入可能更重要。'},
    {id:'loop',title:'回到原點',kind:'loop',main:5,side:1,category:'經典 · 迴圈軌道',copy:'支線會繞回主線。支線上的一個人能以身體擋停電車；若沒有他，電車仍會繞回去撞上五人。',act:'拉動拉桿：犧牲他來擋停電車，五人獲救。',idle:'不動：五人犧牲。',actionLabel:'轉向',gesture:'拖曳或點按拉桿。這次，一個人的犧牲是救人的手段。',principle:'把傷害視為手段，與把傷害視為副作用，有差別嗎？',utility:true,means:true},
    {id:'close',title:'那個人，你認識',kind:'switch',main:5,side:1,category:'延伸 · 親近關係',copy:'主線上的五個人是陌生人。支線上，那個被圓圈標記的人，是你最親近的人。',act:'拉動拉桿：犧牲你最親近的人，救下五人。',idle:'不動：五個陌生人犧牲，親近的人生還。',actionLabel:'轉向',gesture:'拖曳或點按拉桿。圓圈只標示與你的關係。',principle:'當關係進入選擇，抽象的人數還有相同重量嗎？',utility:true},
    {id:'risk',title:'你看不清的支線',kind:'risk',main:1,side:5,category:'延伸 · 不確定性',copy:'主線上確定有一個人。支線有 80% 機率無人、20% 機率有五個人；半透明的人影表示這份不確定。',act:'拉動拉桿：可能無人受傷，也可能五人犧牲。',idle:'不動：確定一人犧牲。',actionLabel:'承擔風險',gesture:'拖曳或點按拉桿。兩種選擇的預期犧牲人數都是一人。',principle:'在相同預期結果下，你會承擔更大的變動嗎？'},
    {id:'bridge',title:'手的距離',kind:'push',main:5,side:1,category:'經典 · 天橋',copy:'你站在天橋上。身旁的人足以擋停電車。唯一能救下軌道上五人的方法，是親手把他推下去。',act:'推動手掌：將他推下天橋，一人犧牲，五人獲救。',idle:'不動：五人犧牲，橋上的人安全。',actionLabel:'推下',gesture:'向左拖曳手掌，或點按／按空白鍵。推出後無法收回。',principle:'親手造成傷害時，你的界線是否不同？',utility:true,means:true,direct:true},
    {id:'trapdoor',title:'隔著一個機關',kind:'hatch',main:5,side:1,category:'延伸 · 天橋活板門',copy:'天橋上的人站在活板門上。你不必碰他，只要拉下門環，他就會落在軌道上，擋停電車。',act:'拉下門環：一人犧牲，五人獲救。',idle:'不動：五人犧牲。',actionLabel:'開啟活板門',gesture:'向下拖曳門環，或點按／按空白鍵。開門後無法收回。',principle:'相同的犧牲，隔著機關是否更容易接受？',utility:true,means:true},
    {id:'consent',title:'他說，讓我來',kind:'push',main:5,side:1,category:'延伸 · 自願與同意',copy:'你再次站在天橋上。這次，身旁的人明確表示願意犧牲，希望你推他下去，擋停電車、救下五人。',act:'推動手掌：依照他的意願，犧牲他來救五人。',idle:'不動：五人犧牲，他生還。',actionLabel:'推下',gesture:'向左拖曳手掌，或點按／按空白鍵。他的意願由空心人物表示。',principle:'當對方同意，主動傷害的界線會移動嗎？',utility:true,means:true,direct:true},
    {id:'self',title:'最後一個，是你',kind:'self',main:5,side:1,category:'延伸 · 自我犧牲',copy:'五個人仍在軌道上。這一次，能擋停電車的人只有你。你可以走下月台，以自己的生命換取他們生還。',act:'踏出腳步：你犧牲，五人獲救。',idle:'不動：五人犧牲，你生還。',actionLabel:'踏入軌道',gesture:'向上拖曳腳步，或點按／按空白鍵。踏出後無法收回。',principle:'當代價落在自己身上，你是否仍做出相同選擇？',utility:true,means:true}
  ];

  // No identity, responses, or results leave this page or persist across reloads.
  const state = {name:'',index:0,phase:'welcome',elapsed:0,last:0,active:false,locked:false,paused:false,answers:[],changes:0,firstAction:null,finalAction:null,branch:null,branchLength:0,readyAt:0,pointer:null};
  const sceneSvg = $('#scene');
  let frame;
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const percent = (part,total) => total ? Math.round(part / total * 100) : 0;
  const current = () => SCENES[state.index];
  const decisionTime = () => current().kind === 'risk' ? 14000 : 12000;
  const reversible = () => ['switch','loop','risk'].includes(current().kind);
  const announce = message => { $('#announcement').textContent = message; };
  const showScreen = name => ['welcome','game','results'].forEach(id => { $(`#${id}`).hidden = id !== name; });

  function person(x,y,{special=false,uncertain=false}={}) {
    return `<g class="person${special?' special':''}${uncertain?' uncertain':''}" transform="translate(${x} ${y})"><circle cy="-11" r="4.6"/><path d="M-3.5-3.5h7l2 11h-11z"/><path d="M-3 7v8M3 7v8" stroke="${special?'#171717':'#1f1f1f'}" stroke-width="2.2" fill="none"/></g>`;
  }
  function people(n,x,y,options={}) {
    return Array.from({length:n},(_,i)=>person(x+(i-(n-1)/2)*19,y,options)).join('');
  }
  function straightSleepers(x,y1,y2) {
    let result=''; for(let y=y1;y<y2;y+=24) result+=`<line class="sleeper" x1="${x-19}" x2="${x+19}" y1="${y}" y2="${y}"/>`; return result;
  }
  function track(d,id='') { return `<path ${id?`id="${id}"`:''} class="rail" d="${d}"/>`; }
  function renderScene() {
    const s=current(), bridge=['push','hatch','self'].includes(s.kind);
    let content=straightSleepers(270,75,752)+track('M263 752V45M277 752V45','main-rail');
    let extension='M270 285L270 145';
    if(!bridge) {
      content+=track('M263 285C263 217 456 245 456 171V45M277 285C277 230 470 257 470 171V45','side-rail');
      content+=straightSleepers(463,70,190);
      for(let t=0;t<7;t++) {const x=291+t*22,y=241+Math.sin(t/6*Math.PI)*7;content+=`<line class="sleeper" x1="${x-4}" x2="${x+4}" y1="${y-11}" y2="${y+11}"/>`;}
      extension='M270 285C270 224 463 251 463 171L463 145';
      if(s.kind==='loop') {
        content+=track('M456 45C456-14 263-14 263 45M470 45C470-30 277-30 277 45');
        for(let x=292;x<453;x+=22)content+=`<line class="sleeper" x1="${x}" x2="${x}" y1="-8" y2="12"/>`;
      }
    } else {
      content+='<g class="bridge"><path d="M217 250H351V275H217z"/><path d="M226 250v25M242 250v25M301 250v25M317 250v25M333 250v25"/></g>';
      if(s.kind==='hatch') content+='<path id="trap-panel" class="bridge" d="M299 253h34v19h-34z"/>';
      extension='M270 285L270 277';
    }
    content+=`<g id="main-people">${people(s.main,270,105)}</g>`;
    const special=['close','consent','self'].includes(s.id);
    const sx=bridge?316:463, sy=bridge?239:105;
    if(special)content+=`<circle class="special-ring" cx="${sx}" cy="${sy}" r="24"/>`;
    content+=`<g id="side-people">${people(s.side,sx,sy,{special,uncertain:s.kind==='risk'})}</g>`;
    content+='<path id="straight-extension" class="path-guide" d="M270 285L270 145"/>';
    content+=`<path id="active-extension" class="path-guide" d="${extension}"/>`;
    content+='<g id="train" transform="translate(270 720)"><ellipse class="train-halo" rx="20" ry="25"/><text class="train-emoji" x="0" y="0" text-anchor="middle" dominant-baseline="central">🚊</text></g>';
    sceneSvg.innerHTML=content;
    sceneSvg.setAttribute('aria-label',`${s.title}。${s.copy} ${s.act} ${s.idle}`);
  }
  function renderMechanism() {
    const s=current();
    let drawing='';
    if(reversible()) drawing='<circle class="control-ring" cx="66" cy="44" r="34"/><path d="M46 68h40M57 67l4-9h10l4 9" class="lever-base"/><g class="control-arm"><path d="M66 61L47 25" stroke-width="3"/><circle class="lever-knob" cx="47" cy="25" r="7"/></g>';
    else if(s.kind==='push') drawing='<circle class="control-ring" cx="66" cy="44" r="34"/><path d="M35 28v32" stroke="#ccc"/><g class="push-hand"><path d="M88 55H68c-5 0-7-2-10-5L45 39c-4-4 1-8 5-5l11 8V20c0-5 7-5 7 0v13-17c0-5 7-5 7 0v17-14c0-5 7-5 7 0v17-10c0-5 6-4 6 0v23c0 3 0 5-1 8Z" fill="white"/><path d="M61 42v6M88 54v9H68v-8"/></g>';
    else if(s.kind==='hatch') drawing='<circle class="control-ring" cx="66" cy="44" r="34"/><path d="M51 18h30M57 20v10M75 20v10" stroke="#aaa"/><g class="hatch-ring"><circle cx="66" cy="45" r="15"/><circle cx="66" cy="45" r="11" stroke="#ddd"/><path d="M66 27v3"/></g>';
    else drawing='<circle class="control-ring" cx="66" cy="44" r="34"/><g class="footsteps" fill="white"><path d="M52 60c-5-4-4-11-2-17 2-8 2-14 7-14 6 0 7 7 6 14-1 6-3 9-3 15 0 6-5 6-8 2Z"/><path d="M73 52c-5-4-4-11-2-17 2-8 2-14 7-14 6 0 7 7 6 14-1 6-3 9-3 15 0 6-5 6-8 2Z"/></g>';
    $('#mechanism').innerHTML=`<button id="control" class="object-button" type="button" aria-label="${esc(s.act)}" aria-pressed="false"><svg viewBox="0 0 132 88" aria-hidden="true">${drawing}</svg></button>`;
    const control=$('#control');
    let suppressClickUntil=0;
    control.addEventListener('click',()=> { if(performance.now()<suppressClickUntil) return; toggleAction(); });
    control.addEventListener('pointerdown',event=> {
      if(state.phase!=='running'||state.locked||state.paused) return;
      state.pointer={id:event.pointerId,x:event.clientX,y:event.clientY,dragged:false};
      control.setPointerCapture(event.pointerId);
    });
    control.addEventListener('pointermove',event=> {
      const p=state.pointer;
      if(!p||p.id!==event.pointerId||p.dragged) return;
      const dx=event.clientX-p.x,dy=event.clientY-p.y;
      const distance=s.kind==='push'?-dx:s.kind==='hatch'?dy:s.kind==='self'?-dy:Math.max(Math.abs(dx),Math.abs(dy));
      if(distance>19) { p.dragged=true; suppressClickUntil=performance.now()+700; toggleAction(); }
    });
    control.addEventListener('pointerup',()=> { if(state.pointer?.dragged)suppressClickUntil=performance.now()+700; state.pointer=null; });
    control.addEventListener('pointercancel',()=> {state.pointer=null;});
  }
  function beginScene() {
    Object.assign(state,{phase:'intro',elapsed:0,active:false,locked:false,paused:false,changes:0,firstAction:null,finalAction:null,branch:null,pointer:null,readyAt:performance.now()+1200});
    $('#pause-overlay').hidden=true;
    $('#progress').innerHTML=SCENES.map((_,i)=>`<i class="${i<state.index?'done':i===state.index?'current':''}"></i>`).join('');
    $('#progress').setAttribute('aria-label',`第 ${state.index+1} 關，共 10 關`);
    const s=current();
    $('#scene-number').textContent=`${String(state.index+1).padStart(2,'0')} / 10 · ${s.category}`;
    $('#scene-title').textContent=s.title;
    $('#scene-copy').textContent=s.copy;
    $('#action-copy').textContent=s.act;
    $('#inaction-copy').textContent=s.idle;
    $('#gesture-copy').textContent=`${s.gesture} 讀完後點一下，或按 Enter 出發。${state.index===0?'按 Esc 可暫停。':''}`;
    $('#intro').hidden=false;
    $('#readiness-fill').style.width='0';
    renderScene(); renderMechanism();
    $('#control').disabled=true;
    $('#intro').setAttribute('tabindex','0');
    $('#intro').setAttribute('role','group');
    $('#intro').setAttribute('aria-label','閱讀情境後按 Enter 開始');
    $('#intro').focus({preventScroll:true});
    announce(`第 ${state.index+1} 關，${s.title}。${s.copy} ${s.act} ${s.idle}`);
  }
  function depart() {
    if(state.phase!=='intro') return;
    state.phase='running'; state.elapsed=0; state.last=performance.now();
    $('#intro').hidden=true; $('#control').disabled=false;
    $('#control').focus({preventScroll:true});
    announce('電車出發了。你可以操作下方物件，或保持不動。');
  }
  function toggleAction() {
    if(state.phase!=='running'||state.locked||state.paused||state.elapsed>=decisionTime()) return false;
    if(state.active&&!reversible()) return false;
    state.active=!state.active;
    if(state.firstAction===null)state.firstAction=state.elapsed;
    state.finalAction=state.elapsed; state.changes++;
    $('#control').classList.toggle('is-active',state.active);
    $('#control').setAttribute('aria-pressed',String(state.active));
    if($('#side-rail'))$('#side-rail').classList.toggle('rail-selected',state.active);
    if($('#main-rail'))$('#main-rail').classList.toggle('rail-selected',!state.active);
    // Direct acts are irreversible and immediately move the participant into the path.
    if(state.active&&!reversible()) {
      $('#side-people').style.transform='translate(-46px, 21px)';
      if($('#trap-panel'))$('#trap-panel').style.opacity='.1';
      $('#control').disabled=true;
    }
    announce(state.active?current().act:current().idle);
    return true;
  }
  function lockChoice() {
    state.locked=true; $('#control').disabled=true;
    state.branch=state.active?$('#active-extension'):$('#straight-extension');
    state.branchLength=state.branch.getTotalLength();
    announce('電車已通過最後能改變的地方。');
  }
  function resolve() {
    const s=current();
    // The uncertain outcome is sampled once, independently of scoring.
    const riskOccupied=s.kind==='risk'&&state.active?Math.random()<.2:null;
    const deaths=state.active?(s.kind==='risk'?(riskOccupied?5:0):1):s.main;
    const answer={id:s.id,action:state.active,firstAction:state.firstAction,finalAction:state.finalAction,changes:state.changes,revisions:Math.max(0,state.changes-1),decisionWindow:decisionTime(),deaths,riskOccupied};
    state.answers.push(answer); state.phase='resolved'; state.elapsed=0;
    if(state.active) {
      if(s.kind==='risk'&&!riskOccupied)$('#side-people').style.opacity='0';
      else $('#side-people').style.opacity='.12';
    } else $('#main-people').style.opacity='.12';
    const outcome=s.kind==='risk'&&state.active?(riskOccupied?'支線上有五個人。五人犧牲。':'支線上沒有人。所有人生還。'):state.active?s.act:s.idle;
    announce(outcome);
    $('#train').style.opacity='.65';
  }
  function tick(now) {
    const delta=state.last?now-state.last:0; state.last=now;
    if(state.phase==='intro') $('#readiness-fill').style.width=`${Math.min(100,100-(state.readyAt-now)/12)}%`;
    if(!state.paused&&!document.hidden) {
      if(state.phase==='running') {
        state.elapsed+=delta;
        const limit=decisionTime();
        if(state.elapsed<limit) {
          const progress=Math.min(1,state.elapsed/limit);
          $('#train').setAttribute('transform',`translate(270 ${720-435*progress})`);
        } else {
          if(!state.locked)lockChoice();
          const travel=Math.min(1,(state.elapsed-limit)/2200);
          const point=state.branch.getPointAtLength(state.branchLength*travel);
          $('#train').setAttribute('transform',`translate(${point.x} ${point.y})`);
          if(travel>=1)resolve();
        }
      } else if(state.phase==='resolved') {
        state.elapsed+=delta;
        if(state.elapsed>=2100) {
          state.index++;
          if(state.index<SCENES.length)beginScene(); else finish();
        }
      }
    }
    if(state.phase!=='welcome'&&state.phase!=='results')frame=requestAnimationFrame(tick);
  }
  function pause() {
    if(!['running','resolved'].includes(state.phase)||state.paused) return;
    state.paused=true; $('#pause-overlay').hidden=false; $('#resume').focus({preventScroll:true});
    announce('時間已暫停。按 Enter 或繼續，即可返回。');
  }
  function resume() {
    if(!state.paused||document.hidden)return;
    state.paused=false; state.last=performance.now(); $('#pause-overlay').hidden=true;
    if(state.phase==='running'&&!state.locked&&!$('#control').disabled)$('#control').focus({preventScroll:true});
  }
  function analyze(answers) {
    const utility=answers.filter((_,i)=>SCENES[i].utility);
    const means=answers.filter((_,i)=>SCENES[i].means);
    const acts=answers.filter(a=>a.action);
    const times=acts.map(a=>a.finalAction/1000);
    const fastest=times.length?Math.min(...times):null;
    const avg=times.length?times.reduce((a,b)=>a+b,0)/times.length:null;
    return {
      outcome:percent(utility.filter(a=>a.action).length,utility.length),
      boundary:percent(means.filter(a=>!a.action).length,means.length),
      intervention:percent(acts.length,answers.length),
      deliberation:percent(acts.filter(a=>a.finalAction!==null&&a.finalAction>=a.decisionWindow*.6).length,acts.length),
      actions:acts.length,total:answers.length,avg,fastest,
      revisions:answers.reduce((n,a)=>n+a.revisions,0),
      risk:answers.find(a=>a.id==='risk'),
      close:answers.find(a=>a.id==='close'),
      bridge:answers.find(a=>a.id==='bridge'),
      consent:answers.find(a=>a.id==='consent'),
      self:answers.find(a=>a.id==='self')
    };
  }
  function metric(label,value,description) {
    return `<article class="metric"><h2 class="metric-label">${label}</h2><div class="metric-value"><span data-count="${value}">${value}</span><small>%</small></div><p class="metric-description">${description}</p><div class="metric-scale" aria-hidden="true"><span style="width:${value}%"></span></div></article>`;
  }
  function choiceSignature() {
    const pts=state.answers.map((a,i)=>`${18+i*29},${a.action?26:84}`);
    return `<svg class="signature" viewBox="0 0 305 115" role="img" aria-label="十次選擇的軌跡：實心點代表行動，空心點代表不行動"><line x1="10" x2="292" y1="26" y2="26"/><line x1="10" x2="292" y1="84" y2="84"/><path d="M${pts.join(' L')}"/>${state.answers.map((a,i)=>`<circle class="${a.action?'active':''}" cx="${18+i*29}" cy="${a.action?26:84}" r="3.5"/>`).join('')}</svg>`;
  }
  function finish() {
    state.phase='results'; cancelAnimationFrame(frame);
    showScreen('results');
    const p=analyze(state.answers);
    const title=p.outcome>=75?(p.boundary>=40?'在結果與界線之間':'願意承擔結果的重量'):p.boundary>=60?'為選擇保留一道界線':'讓每個情境重新說話';
    let lede=p.outcome>=75?'多數情境裡，你選擇減少犧牲的人數，即使這需要你主動承擔代價。':p.boundary>=60?'當救人必須以另一個人的犧牲作為手段，你多次選擇停下。對你而言，如何抵達結果也有重量。':'你沒有把所有難題交給同一條規則。情境改變時，你也重新衡量行動的重量。';
    let reflection=p.bridge.action!==p.consent.action?'當橋上的人表達同意，你的選擇改變了。這兩次決定，可能反映你對他人意願的重視。':'在天橋與自願犧牲的情境中，你做了相同的選擇；是否同意，這次沒有改變你的決定。';
    reflection+=' '+(p.close.action?'當那一人是你最親近的人，你仍選擇救下五人。':'當那一人是你最親近的人，你選擇保留這段關係。');
    reflection+=' '+(p.self.action?'最後，你也願意讓代價落在自己身上。':'最後，面對自己的生命，你選擇留在月台。');
    const riskText=p.risk.action?'面對相同的預期犧牲人數，你選擇承擔支線的不確定性。這只描述那一次風險選擇。':'面對相同的預期犧牲人數，你保留確定的結果。這只描述那一次風險選擇。';
    const rows=state.answers.map((a,i)=> {
      const s=SCENES[i];
      let outcome=a.action?s.act:s.idle;
      if(s.kind==='risk'&&a.action)outcome+=a.riskOccupied?' 這次支線有人，五人犧牲。':' 這次支線無人，無人犧牲。';
      return `<div class="choice-row"><span class="row-num">${String(i+1).padStart(2,'0')}</span><div><p>${s.title}</p><small>${esc(outcome)}<br>${s.principle}</small></div><span class="row-action">${a.action?s.actionLabel:'保持不動'}${a.finalAction!==null?` · ${(a.finalAction/1000).toFixed(1)}s`:''}</span></div>`;
    }).join('');
    $('#results').innerHTML=`
      <header class="masthead"><span>TROLLEY</span><span class="edition">YOUR PORTRAIT · 10 / 10</span></header>
      <div class="result-intro"><div><p class="eyebrow">選擇之後</p><h1>${esc(state.name)}<span>${title}</span></h1><p class="result-lede">${lede}</p></div><div>${choiceSignature()}<p class="name-hint">十次選擇，留下的軌跡。實心是行動，空心是停留。</p></div></div>
      <div class="profile-grid">
        ${metric('結果取向',p.outcome,'在能以一人救下多人的 8 個情境中，選擇減少犧牲人數的比例。')}
        ${metric('手段界線',p.boundary,'在以犧牲作為救人手段的 5 個情境中，選擇不介入的比例。')}
        ${metric('主動介入',p.intervention,'十個情境中，最後選擇操作物件、改變原本進程的比例。')}
        ${metric('後段決定',p.deliberation,p.actions?'所有介入的選擇中，在決策時間後 40% 才作出最後操作的比例。':'這次沒有介入的選擇，因此沒有可計算的操作時間；顯示為 0%。')}
      </div>
      <div class="result-detail"><div><h3>你在意的，不只有人數。</h3><p>${reflection}</p><p>${riskText}</p></div><div class="result-stats"><div class="small-stat"><b>${p.actions}<small>/ 10</small></b><span>主動選擇介入</span></div><div class="small-stat"><b>${p.avg===null?'—':p.avg.toFixed(1)}<small>秒</small></b><span>介入時的平均決定時間</span></div></div></div>
      <details class="choice-review"><summary>回看你的十次選擇</summary><div class="choice-list">${rows}</div></details>
      <footer class="result-footer"><p>這是基於十次情境選擇的自我探索，百分比是本次回答的比例，並非經心理計量驗證的人格測驗、常模排名或診斷。沒有善惡評分。名字與答案只留在這個頁面，重新整理即清除。<br>經典轉轍器、天橋與迴圈情境參考 <a href="https://plato.stanford.edu/entries/doing-allowing/" target="_blank" rel="noopener noreferrer">Stanford Encyclopedia of Philosophy</a>；其餘為本作品的延伸情境。</p><button id="restart" class="restart">再走一次</button></footer>`;
    $('#restart').addEventListener('click',restart);
    window.scrollTo(0,0); $('#results').setAttribute('tabindex','-1'); $('#results').focus({preventScroll:true});
    announce('十個情境已完成。你的選擇分析已顯示。');
  }
  function start(name) {
    state.name=name.trim().slice(0,24);
    if(!state.name)return;
    state.index=0; state.answers=[]; state.last=performance.now();
    showScreen('game'); beginScene();
    cancelAnimationFrame(frame); frame=requestAnimationFrame(tick);
  }
  function restart() {
    cancelAnimationFrame(frame); state.phase='welcome'; state.answers=[]; state.name=''; state.paused=false;
    showScreen('welcome'); $('#results').innerHTML=''; $('#name').value=''; window.scrollTo(0,0); $('#name').focus();
  }
  $('#name-form').addEventListener('submit',event=> {
    event.preventDefault();
    const name=$('#name').value.trim();
    if(!name) {$('#name').setCustomValidity('請輸入你的名字。');$('#name').reportValidity();return;}
    $('#name').setCustomValidity(''); start(name);
  });
  $('#name').addEventListener('input',()=>$('#name').setCustomValidity(''));
  $('#intro').addEventListener('click',depart);
  $('#resume').addEventListener('click',resume);
  document.addEventListener('keydown',event=> {
    if(state.phase==='intro'&&['Enter',' '].includes(event.key)){event.preventDefault();depart();}
    else if(event.key==='Escape'&&['running','resolved'].includes(state.phase)){event.preventDefault();state.paused?resume():pause();}
    else if(state.paused&&['Enter',' '].includes(event.key)){event.preventDefault();resume();}
    else if(state.phase==='running'&&event.key===' '&&!event.repeat){event.preventDefault();toggleAction();}
  });
  document.addEventListener('visibilitychange',()=> { if(document.hidden)pause(); state.last=performance.now(); });
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
  window.addEventListener('pageshow',event=> {if(event.persisted&&!['welcome','results'].includes(state.phase)){state.last=performance.now();frame=requestAnimationFrame(tick);}});

  // Optional page-native, read-only tools. Browsers without WebMCP need no polyfill.
  const context=document.modelContext;
  if(context?.registerTool) {
    const lifecycle=new AbortController();
    const tool={name:'read_trolley_progress',title:'讀取電車測試進度',description:'Read the visible test phase and completed scene count. Does not make a moral choice or disclose the participant name.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:input=> {
      if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');
      return {phase:state.phase,completed:state.answers.length,total:SCENES.length,paused:state.paused};
    }};
    try {Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();
