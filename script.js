const screens=[...document.querySelectorAll('[data-screen]')];
const arrival=document.querySelector('#arrival'),narration=document.querySelector('#narration'),progress=document.querySelector('#progress'),pauseButton=document.querySelector('#pause'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
const introDuration=16000,stepDuration=4400,decodeDuration=2700,total=introDuration+screens.length*stepDuration;
const labels=['Identity','Education','Toolkit','Ambitions','Blood Bridge','Connection'];
let elapsed=0,previous=0,paused=false,completed=false,lastPaint=0;
const binary=length=>Array.from({length},(_,i)=>i%32===31?'\n':Math.random()>.5?'1':'0').join('');
screens.forEach(screen=>{
  screen.querySelectorAll('.screen-content h2,.screen-content h3,.screen-content p,.screen-content .small-note,.screen-content .outline-tag,.screen-content a,.screen-content .large-number,.screen-content .skill-row>span').forEach(el=>{
    if(el.querySelector('.decode'))return;
    if(!el.dataset.text)el.dataset.text=el.textContent.trim();
    el.classList.add('decode');
  });
  const curtain=document.createElement('div');curtain.className='binary-curtain';curtain.setAttribute('aria-hidden','true');curtain.textContent=binary(700);screen.append(curtain);
});
function decodeScreen(screen,fraction){
  screen.querySelectorAll('.decode').forEach(el=>{
    const text=el.dataset.text,shown=Math.floor(text.length*fraction);
    el.textContent=[...text].map((char,i)=>char===' '?char:i<shown?char:Math.random()>.5?'1':'0').join('');
    el.classList.toggle('binary',fraction<1);
  });
  screen.style.setProperty('--photo-blur',String((1-fraction)*22)+'px');
  screen.style.setProperty('--photo-opacity',String(Math.max(0,(fraction-.2)/.8)));
  screen.classList.toggle('decoded',fraction>=.2);
  screen.classList.toggle('revealed',fraction>=1);
  screen.querySelector('.screen-content').toggleAttribute('inert',fraction<1);
}
function closeFocus(){document.body.classList.remove('screen-focused');screens.forEach(s=>s.classList.remove('focused'));document.querySelector('#close-focus').hidden=true;}
function setPause(value){paused=value;document.body.classList.toggle('paused',value);pauseButton.textContent=value?'Resume':'Pause';pauseButton.setAttribute('aria-pressed',String(value));}
function finish(){window.paintFlight(introDuration);document.body.classList.remove('operator-working');document.querySelector('#operator-action').textContent='OPERATOR / ARCHIVE RECOVERED';completed=true;arrival.classList.add('done');document.body.classList.remove('running');screens.forEach(screen=>{decodeScreen(screen,1);screen.classList.remove('active');screen.querySelector('.screen-status').textContent='DECRYPTED';});progress.style.width='100%';document.querySelector('#counter').textContent='06 / 06';narration.textContent='Archive decrypted. Explore the six monitors.';document.querySelector('#terminal-log').textContent='> 6 records recovered / session complete';}
function start(){document.body.classList.remove('operator-working');document.querySelector('#operator-action').textContent='OPERATOR / CONNECTING';if(window.paintFlight)window.paintFlight(0);closeFocus();elapsed=0;previous=0;lastPaint=0;completed=false;setPause(false);document.body.classList.remove('motion-still');document.body.classList.remove('inside');document.body.classList.add('running');arrival.classList.remove('done','impact');arrival.querySelectorAll('.flight-animate').forEach(el=>{el.style.animation='none';void el.offsetWidth;el.style.animation='';});screens.forEach(s=>{s.classList.remove('revealed','active','decoded');s.querySelector('.screen-status').textContent='ENCRYPTED';decodeScreen(s,0);});progress.style.width='0%';document.querySelector('#counter').textContent='00 / 06';narration.textContent='Approaching Burj Khalifa...';if(reduce.matches)finish();}
function render(){
  if(elapsed<introDuration){
    const phase=elapsed<4700?0:elapsed<9500?1:elapsed<12500?2:3;
    const captions=[['01 / DUBAI AFTER DARK','Above the city.<br>One window ahead.'],['02 / BURJ KHALIFA','Closer to the tower.<br>Closer to the story.'],['03 / WINDOW CONTACT','Right up to the glass.'],['04 / INSIDE THE ROOM','Connection established.']];
    document.querySelector('#arrival-label').textContent=captions[phase][0];document.querySelector('#arrival-text').innerHTML=captions[phase][1];arrival.classList.toggle('impact',elapsed>11200);
  }else{
    arrival.classList.add('done');document.body.classList.add('inside','operator-working');
    const index=Math.min(screens.length-1,Math.floor((elapsed-introDuration)/stepDuration));
    screens.forEach((screen,i)=>{
      const fraction=Math.max(0,Math.min(1,(elapsed-introDuration-i*stepDuration)/decodeDuration));
      decodeScreen(screen,fraction);screen.classList.toggle('active',i===index);
      screen.querySelector('.screen-status').textContent=fraction>=1?'DECRYPTED':i===index?'DECODING':'ENCRYPTED';
      if(fraction<.2)screen.querySelector('.binary-curtain').textContent=binary(700);
    });
    const currentFraction=Math.min(1,(elapsed-introDuration-index*stepDuration)/decodeDuration);
    document.querySelector('#operator-action').textContent=currentFraction<1?'OPERATOR / RECOVERING '+labels[index].toUpperCase():'OPERATOR / RECORD VERIFIED';
    const command='> archive.read("'+labels[index].toLowerCase()+'")';
    const typing=command.slice(0,Math.floor(currentFraction*command.length));
    const activeCurtain=screens[index].querySelector('.binary-curtain');
    if(currentFraction<.2)activeCurtain.textContent=typing+' _\n\n'+binary(650);
    narration.textContent=currentFraction<1?'Decrypting '+labels[index].toLowerCase()+'... '+Math.floor(currentFraction*100)+'%':labels[index]+' recovered on monitor '+(index+1)+'.';
    document.querySelector('#terminal-log').textContent='> public_archive / '+labels[index].toLowerCase().replaceAll(' ','_')+' / '+(currentFraction<1?'decoding stream...':'record recovered');
    document.querySelector('#counter').textContent=String(index+1).padStart(2,'0')+' / 06';
  }
  progress.style.width=String(Math.min(100,elapsed/total*100))+'%';if(elapsed>=total)finish();
}
function tick(time){if(!previous)previous=time;const delta=Math.min(time-previous,100);previous=time;if(!paused&&!completed){elapsed+=delta;if(elapsed<introDuration&&window.paintFlight)window.paintFlight(elapsed);if(time-lastPaint>70){render();lastPaint=time;}}requestAnimationFrame(tick);}
document.querySelector('#skip').addEventListener('click',()=>{elapsed=introDuration;window.paintFlight(introDuration);arrival.classList.add('done');render();});
document.querySelector('.skip-link').addEventListener('click',()=>{finish();});
pauseButton.addEventListener('click',()=>{if(completed){const still=document.body.classList.toggle('motion-still');pauseButton.textContent=still?'Resume':'Pause';pauseButton.setAttribute('aria-pressed',String(still));}else setPause(!paused);});
document.querySelector('#replay').addEventListener('click',start);
document.querySelectorAll('[data-focus]').forEach(button=>button.addEventListener('click',()=>{closeFocus();document.body.classList.add('screen-focused');screens[Number(button.dataset.focus)].classList.add('focused');document.querySelector('#close-focus').hidden=false;}));
document.querySelector('#close-focus').addEventListener('click',closeFocus);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFocus();});
document.querySelector('#copy').addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('kvssubbu02@gmail.com');status.textContent='Email copied.';}catch{status.textContent='Email: kvssubbu02@gmail.com';}});
document.querySelector('#year').textContent=new Date().getFullYear();
function clock(){document.querySelector('#clock').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());}clock();setInterval(clock,1000);reduce.addEventListener('change',()=>{if(reduce.matches)finish();});start();requestAnimationFrame(tick);
