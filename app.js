'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct = (n,d) => d ? Math.round(100*n/d) : 0;
  const SCENES = [
    {id:'driver',title:'你是列車長',en:'THE DRIVER',kind:'driver',main:5,side:1,minimizeAction:true,copy:'你握著控制桿。直行有五人，支線有一人。',act:'轉向，一人犧牲。',idle:'直行，五人犧牲。',gesture:'點按下方拉桿，或保持不動。',principle:'身為駕駛，選擇是否帶來不同的責任感？'},
    {id:'observer',title:'你站在鐵軌旁',en:'THE BYSTANDER',kind:'switch',main:5,side:1,minimizeAction:true,copy:'同一班電車。這次，你只是旁觀者。',act:'轉向，一人犧牲。',idle:'直行，五人犧牲。',gesture:'點按下方拉桿，或保持不動。',principle:'條件相同，只換了視角與角色。你的選擇有改變嗎？'},
    {id:'close',title:'{close}',en:'SOMEONE YOU LOVE',kind:'switch',main:1,side:5,minimizeAction:false,copy:'直行是{close}。支線是五位陌生人。',act:'轉向，救下{close}，犧牲五人。',idle:'直行，{close}犧牲。',gesture:'點按下方拉桿，或保持不動。',principle:'為了親密的人，你是否願意改變原本的人數選擇？'},
    {id:'fatman',title:'天橋上的胖子',en:'THE FAT MAN',kind:'bridge',main:5,side:1,minimizeAction:true,meansAction:true,copy:'推下天橋上的陌生人，是救下五人的唯一方法。',act:'推下他，一人犧牲。',idle:'不動，五人犧牲。',gesture:'將較大的圓點拖入軌道虛線框。空白鍵亦可操作。',principle:'親手把一個人當作救人的手段，是你的界線嗎？'},
    {id:'villain',title:'肥胖的惡棍',en:'THE FAT VILLAIN',kind:'bridge',villain:true,main:5,side:1,minimizeAction:true,meansAction:true,copy:'他綁架了軌道上的五人。推下他，可以擋停電車。',act:'推下他，惡棍犧牲。',idle:'不動，五人犧牲。',gesture:'將帶細圈的圓點拖入軌道虛線框。空白鍵亦可操作。',principle:'當被犧牲的人是加害者，你的界線會改變嗎？'},
    {id:'hatch',title:'隔著一扇活板門',en:'THE TRAPDOOR',kind:'hatch',main:5,side:1,minimizeAction:true,meansAction:true,copy:'胖子站在活板門上。開門，便能擋停電車。',act:'開門，一人犧牲。',idle:'不動，五人犧牲。',gesture:'按下胖子旁的方形機關。',principle:'相同的犧牲，隔著機關是否更容易接受？'},
    {id:'transplant',title:'器官移植醫生',en:'THE TRANSPLANT',kind:'surgery',main:5,side:1,minimizeAction:true,meansAction:true,copy:'犧牲一位健康、未同意捐贈的人，能救活五位病患。',act:'手術，一人犧牲。',idle:'不動，五人死亡。',gesture:'將紅叉拖到左側健康的人。空白鍵亦可操作。',principle:'醫生的角色，是否改變你對一人換五人的判斷？'},
    {id:'transplant-close',title:'病床上的{close}',en:'THE TRANSPLANT · PERSONAL',kind:'surgery',familiar:true,main:5,side:1,minimizeAction:true,meansAction:true,copy:'五位病患中，有{close}。健康的人仍未同意捐贈。',act:'手術，救下五人，犧牲一人。',idle:'不動，{close}與另四人死亡。',gesture:'將紅叉拖到左側健康的人。空白鍵亦可操作。',principle:'救下的五人包含親密對象時，你是否改變了界線？'},
    {id:'loop',title:'已經轉向的迴圈',en:'THE LOOP · REVERSED DEFAULT',kind:'loop',defaultDivert:true,main:5,side:1,minimizeAction:false,meansAction:false,copy:'列車已轉進迴圈。一人會擋停它，救下五人。',act:'切回直行，五人犧牲。',idle:'保持迴圈，一人犧牲。',gesture:'點按下方拉桿，可切回主線。',principle:'當救多人是既定路線，你是否仍拒絕犧牲一人作為手段？'},
    {id:'autonomous',title:'AI 的最後一個指令',en:'AUTONOMOUS VEHICLES',kind:'car',main:5,side:1,minimizeAction:true,self:true,copy:'你是唯一乘客。AI 要自撞，還是撞上五位行人？',act:'轉向自撞，你犧牲。',idle:'保持直行，五人犧牲。',gesture:'點按下方方向控制器，或保持不動。',principle:'當減少傷害的代價是自己，你願意讓 AI 執行嗎？'}
  ];
  const state={name:'',close:'',setup:0,index:0,phase:'welcome',elapsed:0,last:0,active:false,locked:false,paused:false,answers:[],changes:0,firstAction:null,finalAction:null,branch:null,branchLength:0,report:null};
  let frame=0, transitionTimer=0, exportBusy=false, resultImageUrl=null;
  const svg=$('#scene');
  const current=()=>SCENES[state.index];
  const replaceNames=t=>String(t).replaceAll('{close}',state.close);
  const titleOf=s=>replaceNames(s.title);
  const decisionTime=()=>12000;
  const reversible=()=>['driver','switch','loop','car'].includes(current().kind);
  const divert=()=>!!current().defaultDivert!==state.active;
  const announce=t=>{$('#announcement').textContent=t;};
  const showScreen=name=>['welcome','game','results'].forEach(id=>{$(`#${id}`).hidden=id!==name;});
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function person(x,y,{fat=false,villain=false,special=false,scale=1}={}){
    return `<g transform="translate(${x} ${y}) scale(${scale})"><circle class="person${special?' special':''}" r="${fat?14:6}"/>${villain?'<circle class="fat-ring" r="19"/>':''}</g>`;
  }
  function group(n,x,y,options={}){return Array.from({length:n},(_,i)=>person(x+i*28,y,options)).join('');}
  function track(d,id){return `<path ${id?`id="${id}"`:''} class="rail" d="${d}"/>`;}
  function trainMarkup(){return '<circle id="train" class="vehicle" cx="100" cy="300" r="12"/>';}
  function horizontalScene(s){
    let html=track('M80 300H925','main-rail');
    html+=track('M480 300L650 180H925','side-rail');
    if(s.kind==='loop')html+=track('M925 180H950V420H700V300');
    if(s.kind==='car'){
      html+=`<g id="main-people">${group(5,780,300)}</g><g id="side-people"><path d="M810 158V202" stroke="#444" stroke-width="2" vector-effect="non-scaling-stroke"/></g>`;
    }else html+=`<g id="main-people">${group(s.main,780,300,{special:s.id==='close'})}</g><g id="side-people">${group(s.side,780,180)}</g>`;
    return html+trainMarkup();
  }
  function bridgeScene(s){
    return track('M80 300H925','main-rail')+track('M535 190H665')+`<rect id="drop-target" class="drop-zone" x="577" y="277" width="46" height="46" rx="0"/><g id="main-people">${group(5,780,300)}</g><g id="falling-person" opacity="0">${person(600,300,{fat:true,villain:s.villain})}</g>${s.kind==='hatch'?'<g id="bridge-subject">'+person(600,190,{fat:true})+'</g>':''}`+trainMarkup();
  }
  function surgeryScene(s){
    let html=track('M180 300H880')+`<g id="donor">${person(250,300)}</g><circle id="drop-target" class="donor-target" cx="250" cy="300" r="24" fill="transparent"/><g id="patients">`;
    for(let i=0;i<5;i++)html+=`<g class="patient">${person(680+i*34,300,{special:s.familiar&&i===2})}</g>`;
    html+='</g><path id="donor-cross" class="cross" d="M242 292L258 308M258 292L242 308" opacity="0"/>';
    return html;
  }
  function renderScene(){
    const s=current(),mode=['bridge','hatch'].includes(s.kind)?'bridge':s.kind==='surgery'?'surgery':'railway';
    $('#world').dataset.view=mode;svg.innerHTML=mode==='bridge'?bridgeScene(s):mode==='surgery'?surgeryScene(s):horizontalScene(s);
    svg.setAttribute('viewBox','0 0 1000 600');
    $('#world').querySelectorAll('.scene-name').forEach(e=>e.remove());
    if(s.id==='close'||s.familiar){const name=document.createElement('span');name.className='scene-name';name.style.left=`${s.familiar?74.8:78}%`;name.style.top='50%';name.textContent=state.close;$('#world').append(name);}
    updateRoute();
  }
  function leverDrawing(){return '<path d="M20 49H44" stroke="#aaa" stroke-width="1"/><g class="arm"><path d="M32 48L18 18" stroke="#444" stroke-width="1.5"/><circle cx="18" cy="18" r="4" fill="#191919"/></g>';}
  function isDragScene(){return ['bridge','surgery'].includes(current().kind);}
  function dropAllowed(rect,x,y){const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;return Math.abs(x-cx)<=Math.max(27,rect.width/2+8)&&Math.abs(y-cy)<=Math.max(27,rect.height/2+8);}
  function attachDrag(control){
    let pointer=null;
    const reset=()=>{control.classList.add('returning');control.style.transform='';$('#drop-target')?.classList.remove('is-over');};
    control.addEventListener('pointerdown',e=>{
      if(state.phase!=='running'||state.paused||state.locked||state.active)return;
      e.preventDefault();const box=control.getBoundingClientRect();pointer={id:e.pointerId,x:e.clientX,y:e.clientY,cx:box.left+box.width/2,cy:box.top+box.height/2};control.classList.remove('returning');control.setPointerCapture(e.pointerId);
    });
    control.addEventListener('pointermove',e=>{
      if(!pointer||pointer.id!==e.pointerId)return;
      if(state.paused||state.locked||state.phase!=='running'){pointer=null;reset();return;}
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;control.style.transform=`translate(${dx}px,${dy}px)`;
      const target=$('#drop-target');target.classList.toggle('is-over',dropAllowed(target.getBoundingClientRect(),pointer.cx+dx,pointer.cy+dy));
    });
    control.addEventListener('pointerup',e=>{
      if(!pointer||pointer.id!==e.pointerId)return;
      const moved=Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>8;const x=pointer.cx+e.clientX-pointer.x,y=pointer.cy+e.clientY-pointer.y;pointer=null;
      const valid=moved&&dropAllowed($('#drop-target').getBoundingClientRect(),x,y);
      if(valid&&toggleAction()){control.style.transform='';control.classList.add('is-active');}else reset();
    });
    control.addEventListener('pointercancel',()=>{pointer=null;reset();});
    control.addEventListener('lostpointercapture',()=>{if(pointer){pointer=null;reset();}});
  }
  function renderControl(){
    const s=current();$('#scene-object').innerHTML='';$('#mechanism').innerHTML='';$('#mechanism').hidden=false;
    if(s.kind==='bridge'){
      $('#mechanism').hidden=true;
      $('#scene-object').innerHTML=`<button id="control" type="button" class="drag-control${s.villain?' villain':''}" style="left:60%;top:31.666%" aria-label="${esc(replaceNames(s.act))}"><span class="dot"></span></button>`;
    }else if(s.kind==='hatch'){
      $('#mechanism').hidden=true;$('#scene-object').innerHTML=`<button id="control" type="button" class="hatch-control" aria-label="${esc(s.act)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4H20V20H4Z" fill="none" stroke="#bbb"/><path class="hatch-lid" d="M4 4H20V20H4Z" fill="white" stroke="#555"/><circle cx="12" cy="12" r="2" fill="#333"/></svg></button>`;
    }else{
      let drawing=leverDrawing();
      if(s.kind==='car')drawing='<g class="wheel"><circle cx="32" cy="32" r="17" fill="none" stroke="#555" stroke-width="1"/><circle cx="32" cy="32" r="3" fill="#222"/><path d="M15 32H49M32 32V49" stroke="#777" stroke-width="1"/></g>';
      if(s.kind==='surgery')drawing='<path class="cross" d="M6 6L22 22M22 6L6 22"/>';
      $('#mechanism').innerHTML=`<button id="control" type="button" class="control${s.kind==='surgery'?' cross-control':''}" aria-label="${esc(replaceNames(s.act))}" aria-pressed="false"><svg viewBox="${s.kind==='surgery'?'0 0 28 28':'0 0 64 64'}" aria-hidden="true">${drawing}</svg></button>`;
    }
    const control=$('#control');
    if(isDragScene())attachDrag(control);
    else{
      let pointer=null,suppressUntil=0;
      control.addEventListener('click',()=>{if(performance.now()>=suppressUntil)toggleAction();});
      control.addEventListener('pointerdown',e=>{if(!reversible()||state.phase!=='running'||state.locked||state.paused)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false};control.setPointerCapture(e.pointerId);});
      control.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||pointer.dragged)return;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>16){pointer.dragged=true;suppressUntil=performance.now()+700;toggleAction();}});
      control.addEventListener('pointerup',()=>{if(pointer?.dragged)suppressUntil=performance.now()+700;pointer=null;});control.addEventListener('pointercancel',()=>{pointer=null;});
    }
    control.disabled=true;
  }
  function demoGroup(n,x,y){return Array.from({length:n},(_,i)=>`<circle class="demo-person" cx="${x+i*10}" cy="${y}" r="2.2"/>`).join('');}
  function renderDemo(){
    const s=current();let html='';
    if(['bridge','hatch'].includes(s.kind)){
      html='<path class="demo-rail" d="M25 130H335M178 69H242"/><rect class="demo-rail" x="198" y="118" width="24" height="24" stroke-dasharray="3 4"/>'+demoGroup(5,282,130)+'<g class="demo-push"><circle class="demo-person" cx="210" cy="69" r="7"/>'+(s.villain?'<circle cx="210" cy="69" r="10" fill="none" stroke="#999"/>':'')+'</g><circle class="demo-vehicle demo-route demo-bridge-vehicle" r="5"/>';
      if(s.kind==='hatch')html+='<path d="M248 58H266V76H248Z" class="demo-rail" stroke="#aaa"/>';
    }else if(s.kind==='surgery'){
      html='<path class="demo-rail" d="M48 112H325"/><circle cx="85" cy="112" r="3" class="demo-person"/><g class="demo-sick">'+demoGroup(5,238,112)+'</g><g class="demo-cross"><path d="M170 150L184 164M184 150L170 164" stroke="#b34842" stroke-width="1.5"/></g>';
    }else{
      html='<path class="demo-rail" d="M25 125H335M170 125L224 72H335"/>';
      if(s.kind==='loop')html+='<path class="demo-rail" d="M335 72H351V175H260V125"/>';
      html+=demoGroup(5===s.main?5:1,282,125);
      html+=s.kind==='car'?'<path d="M288 61V83" class="demo-rail" stroke="#aaa"/>':demoGroup(s.side,282,72);
      html+=`<circle class="demo-vehicle demo-route${s.kind==='loop'?' demo-loop':''}" r="5"/><path d="M146 189H174" class="demo-rail"/><g class="demo-arm"><path d="M160 189L149 160" stroke="#aaa" stroke-width="1.2"/><circle cx="149" cy="160" r="3" fill="#eee"/></g>`;
    }
    $('#demo').innerHTML=html;
  }
  function updateRoute(){const d=divert();$('#main-rail')?.classList.toggle('selected-rail',!d);$('#side-rail')?.classList.toggle('selected-rail',d);}
  function beginScene(){
    clearTimeout(transitionTimer);Object.assign(state,{phase:'intro',elapsed:0,active:false,locked:false,paused:false,changes:0,firstAction:null,finalAction:null});
    $('#pause-overlay').hidden=true;$('#game').dataset.running='false';$('#world').classList.remove('urgent','impact','treated','expired');
    const s=current();$('#scene-title').textContent=titleOf(s);$('#scene-copy').textContent=replaceNames(s.copy);$('#action-copy').textContent=replaceNames(s.act);$('#inaction-copy').textContent=replaceNames(s.idle);
    renderScene();renderControl();renderDemo();$('#intro').classList.remove('is-leaving');$('#intro').classList.add('is-entering');$('#intro').hidden=false;$('#intro').scrollTop=0;$('#intro').focus({preventScroll:true});
    announce(`第 ${state.index+1} 關，${titleOf(s)}。${replaceNames(s.copy)} ${replaceNames(s.act)} ${replaceNames(s.idle)} ${replaceNames(s.gesture)}`);
  }
  function depart(){
    if(state.phase!=='intro')return;state.phase='transition';$('#intro').classList.remove('is-entering');$('#intro').classList.add('is-leaving');
    transitionTimer=setTimeout(()=>{if(state.phase!=='transition')return;$('#intro').hidden=true;state.phase='running';$('#game').dataset.running='true';state.elapsed=0;state.last=performance.now();$('#control').disabled=false;announce('情境開始。可以操作物件，或保持不動。');if(document.hidden)pause();},reduced()?0:800);
  }
  function toggleAction(){
    if(state.phase!=='running'||state.paused||state.locked||state.elapsed>=decisionTime())return false;if(state.active&&!reversible())return false;
    state.active=!state.active;state.changes++;if(state.firstAction===null)state.firstAction=state.elapsed;state.finalAction=state.elapsed;
    const control=$('#control');control.classList.toggle('is-active',state.active);control.setAttribute('aria-pressed',String(state.active));updateRoute();
    if(!reversible()){
      control.disabled=true;
      if(['bridge','hatch'].includes(current().kind)){$('#falling-person').setAttribute('opacity','1');$('#drop-target').style.opacity='0';if($('#bridge-subject'))$('#bridge-subject').style.opacity='0';}
      if(current().kind==='surgery'){$('#world').classList.add('treated');$('#donor').style.opacity='.08';const h=8*1000/$('#world').getBoundingClientRect().width;$('#donor-cross').setAttribute('d',`M${250-h} ${300-h}L${250+h} ${300+h}M${250+h} ${300-h}L${250-h} ${300+h}`);$('#donor-cross').setAttribute('opacity','1');control.style.opacity='0';}
    }
    announce(replaceNames(state.active?current().act:current().idle));return true;
  }
  function lockChoice(){state.locked=true;$('#control').disabled=true;$('#control').style.transform='';$('#drop-target')?.classList.remove('is-over');}
  function pointOnRoute(points,t){
    const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let left=distances.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,t));
    for(let i=0;i<distances.length;i++){if(left<=distances[i]){const q=distances[i]?left/distances[i]:1;return{x:points[i][0]+(points[i+1][0]-points[i][0])*q,y:points[i][1]+(points[i+1][1]-points[i][1])*q};}left-=distances[i];}const p=points.at(-1);return{x:p[0],y:p[1]};
  }
  function animateScene(){
    const s=current(),p=Math.min(1,state.elapsed/decisionTime()),travel=Math.max(0,Math.min(1,(state.elapsed-decisionTime())/2200));
    $('#world').classList.toggle('urgent',!state.paused&&state.elapsed>decisionTime()*.78&&!reduced());
    if(s.kind==='surgery')return;
    let point={x:100+380*(.25*p+.75*Math.pow(p,2.7)),y:300};
    if(state.locked){let route;
      if(['bridge','hatch'].includes(s.kind))route=[[480,300],[state.active?580:762,300]];
      else if(divert())route=s.kind==='car'?[[480,300],[650,180],[795,180]]:[[480,300],[650,180],[762,180]];
      else route=[[480,300],[762,300]];
      const motion=['bridge','hatch'].includes(s.kind)&&state.active?1-Math.pow(1-travel,1.4):.55*travel+.45*travel*travel;point=pointOnRoute(route,motion);
    }
    $('#train').setAttribute('cx',String(point.x));$('#train').setAttribute('cy',String(point.y));
  }
  function resolve(){
    const s=current(),deaths=state.active?(s.minimizeAction?1:5):(s.minimizeAction?5:1);
    state.answers.push({id:s.id,action:state.active,deaths,firstAction:state.firstAction,finalAction:state.finalAction,revisions:Math.max(0,state.changes-1),decisionWindow:decisionTime()});state.phase='resolved';state.elapsed=0;
    if(s.kind==='surgery'){if(!state.active)$('#world').classList.add('expired');}
    else if(['bridge','hatch'].includes(s.kind)){$(state.active?'#falling-person':'#main-people').style.opacity='.06';}
    else if(s.kind==='car'){if(!state.active)$('#main-people').style.opacity='.06';else $('#train').style.opacity='.06';}
    else $(divert()?'#side-people':'#main-people').style.opacity='.06';
    $('#world').classList.remove('urgent');$('#world').classList.add('impact');announce(replaceNames(state.active?s.act:s.idle));
  }
  function tick(now){
    const dt=state.last?Math.min(100,now-state.last):0;state.last=now;
    if(!state.paused&&!document.hidden){if(state.phase==='running'){state.elapsed+=dt;if(state.elapsed>=decisionTime()&&!state.locked)lockChoice();animateScene();if(state.elapsed>=decisionTime()+2200)resolve();}else if(state.phase==='resolved'){state.elapsed+=dt;if(state.elapsed>=1700){state.index++;$('#world').classList.remove('impact');state.index<SCENES.length?beginScene():finish();}}}
    if(!['welcome','results'].includes(state.phase))frame=requestAnimationFrame(tick);
  }
  function pause(){if(!['running','resolved'].includes(state.phase)||state.paused)return;state.paused=true;$('#game').dataset.running='false';$('#world').classList.remove('urgent');$('#control').style.transform='';$('#drop-target')?.classList.remove('is-over');$('#pause-overlay').hidden=false;$('#resume').focus({preventScroll:true});}
  function resume(){if(!state.paused||document.hidden)return;state.paused=false;$('#game').dataset.running='true';state.last=performance.now();$('#pause-overlay').hidden=true;}

  function analyze(answers){
    const means=answers.filter(a=>SCENES.find(s=>s.id===a.id).meansAction!==undefined);
    const acts=answers.filter(a=>a.action),time=acts.map(a=>a.finalAction/1000);
    const result={outcome:pct(answers.filter(a=>a.action===SCENES.find(s=>s.id===a.id).minimizeAction).length,answers.length),boundary:pct(means.filter(a=>a.action!==SCENES.find(s=>s.id===a.id).meansAction).length,means.length),intervention:pct(acts.length,answers.length),deliberation:pct(acts.filter(a=>a.finalAction>=a.decisionWindow*.6).length,acts.length),actions:acts.length,avg:time.length?time.reduce((x,y)=>x+y,0)/time.length:null,total:answers.length};
    result.byId=Object.fromEntries(answers.map(a=>[a.id,a]));return result;
  }
  function metric(label,value,description){return `<article class="metric"><h2 class="metric-label">${label}</h2><div class="metric-value">${value}<small>%</small></div><p class="metric-description">${description}</p><div class="metric-scale" aria-hidden="true"><span style="width:${value}%"></span></div></article>`;}
  function choiceSignature(){const points=state.answers.map((a,i)=>`${18+i*29},${a.action?26:84}`);return `<svg class="signature" viewBox="0 0 305 115" role="img" aria-label="十次選擇：實心是操作，空心是不操作"><line x1="10" x2="292" y1="26" y2="26"/><line x1="10" x2="292" y1="84" y2="84"/><path d="M${points.join(' L')}"/>${state.answers.map((a,i)=>`<circle class="${a.action?'active':''}" cx="${18+i*29}" cy="${a.action?26:84}" r="3.5"/>`).join('')}</svg>`;}
  function makeReport(){
    const p=analyze(state.answers),b=p.byId;
    const title=p.outcome>=80?'你看見結果的重量':p.boundary>=67?'你為手段留下界線':'你讓情境改變答案';
    const lede=p.outcome>=80?'即使角色、關係與既定路線改變，你仍多次選擇讓較少的人犧牲。':p.boundary>=67?'當救人必須把另一個人當作手段，你多次選擇保留這道界線。':'你沒有只依照一條規則。不同的角色、關係與行動方式，留下了不同的選擇。';
    const perspective=b.driver.action===b.observer.action?'列車長與旁觀者的角色，沒有改變你的選擇。':'列車長與旁觀者的角色，改變了你的選擇。';
    const villain=b.fatman.action===b.villain.action?'面對陌生人與加害者，你保留了相同的天橋選擇。':'當天橋上的人是加害者，你改變了推人的選擇。';
    const personal=b['transplant'].action===b['transplant-close'].action?`病患中出現${state.close}，仍沒有改變你的手術決定。`:`病患中出現${state.close}後，你改變了手術決定。`;
    const close=b.close.action?`為了救下${state.close}，你選擇讓電車轉向五名陌生人。`:`當${state.close}在直行路線，你仍選擇讓五名陌生人生還。`;
    const self=b.autonomous.action?'最後，你選擇讓 AI 以你的生命換取五名行人生還。':'最後，你選擇讓自駕車維持直行、保留自己的生命。';
    return {name:state.name,close:state.close,p,title,lede,notes:[perspective,villain,personal,close,self],answers:state.answers.map((a,i)=>({...a,title:titleOf(SCENES[i]),outcome:replaceNames(a.action?SCENES[i].act:SCENES[i].idle),principle:SCENES[i].principle}))};
  }
  function finish(){
    state.phase='results';cancelAnimationFrame(frame);showScreen('results');state.report=makeReport();const r=state.report,p=r.p;
    const rows=r.answers.map((a,i)=>`<div class="choice-row"><span class="row-num">${String(i+1).padStart(2,'0')}</span><div><p>${esc(a.title)}</p><small>${esc(a.outcome)}</small></div><span class="row-action">${a.action?'介入':'不動'}</span></div>`).join('');
    $('#results').innerHTML=`<header class="logotype">TROLLEY</header><div class="result-intro"><h1>${esc(r.name)}<span>${r.title}</span></h1>${choiceSignature()}</div><div class="profile-grid">${metric('減少犧牲',p.outcome,'選擇較少人犧牲。')}${metric('手段界線',p.boundary,'避免將人作為手段。')}${metric('主動介入',p.intervention,'改變原本的進程。')}${metric('後段決定',p.deliberation,p.actions?'在最後 40% 作出決定。':'沒有介入時間樣本。')}</div><div class="result-detail">${r.notes.slice(0,3).map(n=>`<p>${esc(n)}</p>`).join('')}</div><details class="choice-review"><summary>十次選擇</summary><div class="choice-list">${rows}</div></details><div class="result-actions"><button id="download-result" class="download-button">儲存圖片</button><button id="restart" class="restart">重新開始</button><span id="export-status" class="export-status" role="status"></span></div><footer class="result-footer">本次選擇的輪廓，並非心理診斷。</footer>`;
    $('#download-result').addEventListener('click',downloadResult);$('#restart').addEventListener('click',restart);window.scrollTo(0,0);$('#results').setAttribute('tabindex','-1');$('#results').focus({preventScroll:true});announce('十個情境已完成。你的選擇分析已顯示，可以儲存結果圖片。');
  }
  function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines=Infinity){
    let line='',lines=0;
    for(const ch of String(text)){if(ctx.measureText(line+ch).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;line='';lines++;if(lines>=maxLines)return y;}line+=ch;}
    if(line){ctx.fillText(line,x,y);y+=lineHeight;}return y;
  }
  async function createResultCanvas(report){
    await document.fonts.ready;
    const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1700;
    const c=canvas.getContext('2d');if(!c)throw new Error('圖片輸出暫時無法使用。');
    const pad=120,W=1440,r=report,p=r.p;c.fillStyle='#fff';c.fillRect(0,0,W,1700);
    c.fillStyle='#222';c.font='16px -apple-system, sans-serif';c.fillText('T R O L L E Y',pad,85);
    let nameSize=78;do{c.font=`${nameSize}px "Songti TC", serif`;if(c.measureText(r.name).width<=W-2*pad)break;nameSize-=2;}while(nameSize>32);c.fillText(r.name,pad,260);
    c.fillStyle='#888';c.font='23px -apple-system, "PingFang TC", sans-serif';c.fillText(r.title,pad,318);
    const gy=408,step=54;c.strokeStyle='#ededed';c.lineWidth=1;
    for(const y of [gy,gy+66]){c.beginPath();c.moveTo(pad,y);c.lineTo(pad+9*step,y);c.stroke();}
    c.strokeStyle='#444';c.lineWidth=1.4;c.beginPath();r.answers.forEach((a,i)=>{const x=pad+i*step,y=gy+(a.action?0:66);i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();r.answers.forEach((a,i)=>{c.beginPath();c.arc(pad+i*step,gy+(a.action?0:66),4,0,Math.PI*2);c.fillStyle=a.action?'#333':'#fff';c.fill();c.stroke();});
    c.strokeStyle='#e5e5e5';c.beginPath();c.moveTo(pad,555);c.lineTo(W-pad,555);c.stroke();
    const labels=['減少犧牲','手段界線','主動介入','後段決定'],values=[p.outcome,p.boundary,p.intervention,p.deliberation],col=(W-pad*2)/4;
    labels.forEach((label,i)=>{const x=pad+i*col;c.fillStyle='#888';c.font='20px -apple-system, "PingFang TC", sans-serif';c.fillText(label,x,614);c.fillStyle='#222';c.font='99px "Bodoni 72", "Times New Roman", serif';c.fillText(String(values[i]),x,760);const nw=c.measureText(String(values[i])).width;c.font='21px -apple-system, sans-serif';c.fillText('%',x+nw+7,705);});
    c.strokeStyle='#e5e5e5';c.beginPath();c.moveTo(pad,826);c.lineTo(W-pad,826);c.stroke();
    c.fillStyle='#888';c.font='21px -apple-system, "PingFang TC", sans-serif';let y=903;for(const note of r.notes.slice(0,3))y=wrapText(c,note,pad,y,W-pad*2,35)+17;
    c.strokeStyle='#e5e5e5';c.beginPath();c.moveTo(pad,1090);c.lineTo(W-pad,1090);c.stroke();
    r.answers.forEach((a,i)=>{const x=pad+(i%2)*(W-pad*2)/2,yy=1156+Math.floor(i/2)*74;c.fillStyle='#aaa';c.font='15px monospace';c.fillText(String(i+1).padStart(2,'0'),x,yy);c.fillStyle='#555';let rowSize=21;c.font=`${rowSize}px -apple-system, "PingFang TC", sans-serif`;while(c.measureText(a.title).width>425&&rowSize>12){rowSize--;c.font=`${rowSize}px -apple-system, "PingFang TC", sans-serif`;}c.fillText(a.title,x+40,yy);c.fillStyle='#999';c.font='14px -apple-system, sans-serif';c.fillText(a.action?'介入':'不動',x+40,yy+27);});
    c.fillStyle='#aaa';c.font='16px -apple-system, "PingFang TC", sans-serif';c.fillText('本次選擇的輪廓，並非心理診斷。',pad,1620);
    return canvas;
  }
  async function downloadResult(){
    if(exportBusy||!state.report)return;exportBusy=true;const button=$('#download-result'),status=$('#export-status');button.disabled=true;status.textContent='正在準備圖片…';
    try{const canvas=await createResultCanvas(state.report);const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('無法輸出圖片。')),'image/png'));if(resultImageUrl)URL.revokeObjectURL(resultImageUrl);resultImageUrl=URL.createObjectURL(blob);const link=document.createElement('a');link.href=resultImageUrl;link.download='Trolley-我的選擇.png';document.body.append(link);link.click();link.remove();status.textContent='圖片已準備好。';const retry=document.createElement('a');retry.href=canvas.toDataURL('image/png');retry.download='Trolley-我的選擇.png';retry.textContent='再次儲存';status.append(' ',retry);}
    catch(error){status.textContent='圖片未能下載，請再試一次。';}
    finally{exportBusy=false;button.disabled=false;}
  }
  function start(){state.index=0;state.answers=[];state.last=performance.now();showScreen('game');beginScene();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}
  function restart(){
    cancelAnimationFrame(frame);clearTimeout(transitionTimer);if(resultImageUrl){URL.revokeObjectURL(resultImageUrl);resultImageUrl=null;}Object.assign(state,{phase:'welcome',setup:0,name:'',close:'',answers:[],report:null,paused:false});showScreen('welcome');$('#results').innerHTML='';$('#setup-title').textContent='你是誰？';$('#setup-label').textContent='你的名字';$('#setup-name').setAttribute('aria-label','你的名字');$('#setup-name').value='';$('.enter-button').setAttribute('aria-label','下一步');$('#setup-name').focus();window.scrollTo(0,0);
  }
  $('#setup-form').addEventListener('submit',event=>{
    event.preventDefault();const value=$('#setup-name').value.trim();if(!value){$('#setup-name').setCustomValidity('請輸入一個名字。');$('#setup-name').reportValidity();return;}$('#setup-name').setCustomValidity('');
    if(state.setup===0){state.name=value.slice(0,24);state.setup=1;$('#setup-title').textContent='你最在乎誰？';$('#setup-label').textContent='親密家人或朋友的名字';$('#setup-name').setAttribute('aria-label','親密家人或朋友的名字');$('#setup-name').value='';$('#setup-name').name='close';$('.enter-button').setAttribute('aria-label','開始測試');$('#setup-name').focus();}
    else{state.close=value.slice(0,24);start();}
  });
  $('#setup-name').addEventListener('input',()=>$('#setup-name').setCustomValidity(''));
  $('#intro').addEventListener('click',depart);$('#resume').addEventListener('click',resume);
  document.addEventListener('keydown',event=>{
    if(state.phase==='intro'&&['Enter',' '].includes(event.key)&&!event.repeat){event.preventDefault();depart();}
    else if(event.key==='Escape'&&['running','resolved'].includes(state.phase)){event.preventDefault();state.paused?resume():pause();}
    else if(state.paused&&['Enter',' '].includes(event.key)){event.preventDefault();resume();}
    else if(state.phase==='running'&&event.key===' '&&!event.repeat){event.preventDefault();toggleAction();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();state.last=performance.now();});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);clearTimeout(transitionTimer);});
  window.addEventListener('pageshow',event=>{if(event.persisted&&!['welcome','results'].includes(state.phase)){if(state.phase==='transition'){state.phase='intro';$('#intro').hidden=false;$('#intro').classList.remove('is-leaving');}state.last=performance.now();frame=requestAnimationFrame(tick);}});
  const context=document.modelContext;
  if(context?.registerTool){try{Promise.resolve(context.registerTool({name:'read_trolley_progress',title:'讀取測試進度',description:'Read phase and completion count without names or moral choices.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');return{phase:state.phase,completed:state.answers.length,total:SCENES.length,paused:state.paused};}})).catch(()=>{});}catch{}}
})();
