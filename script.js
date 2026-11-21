const screens=[...document.querySelectorAll('[data-screen]')];
const arrival=document.querySelector('#arrival'),narration=document.querySelector('#narration'),progress=document.querySelector('#progress'),pauseButton=document.querySelector('#pause'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
const introDuration=16000,stepDuration=4400,total=introDuration+screens.length*stepDuration;
const labels=['Identity','Education','Toolkit','Ambitions','Blood Bridge','Connection'];
const skipButton = document.querySelector('#skip');
const dialog = document.querySelector('#monitor-dialog');
const closeButton = document.querySelector('#close-focus');
const grid = document.querySelector('.monitor-grid');
let expandedScreen = null;
let screenSlot = null;
let elapsed=0,previous=0,paused=false,completed=false,lastPaint=0;
const queries = ['identity', 'education', 'skills', 'ambitions', 'projects', 'contact'];
screens.forEach(screen=>{
  const curtain=document.createElement('div');curtain.className='binary-curtain';curtain.setAttribute('aria-hidden','true');curtain.textContent='Awaiting operator…';screen.append(curtain);
});
function decodeScreen(screen,fraction){
  screen.classList.toggle('decoded',fraction>=.2);
  screen.classList.toggle('revealed',fraction>=1);
  screen.querySelector('.screen-content').toggleAttribute('inert',fraction<1);
  screen.querySelector('.focus-screen').disabled = fraction < 1;
}
function restoreScreen() {
  if (!expandedScreen) return;
  const opener = expandedScreen.querySelector('.focus-screen');
  dialog.append(closeButton);
  screenSlot.replaceWith(expandedScreen);
  expandedScreen = null;
  screenSlot = null;
  opener.focus({preventScroll:true});
}
function closeFocus() {
  if (dialog.open) dialog.close();
  restoreScreen();
}
function openScreen(screen) {
  if (dialog.open || !screen.classList.contains('revealed')) return;
  expandedScreen = screen;
  screenSlot = document.createElement('div');
  screenSlot.setAttribute('aria-hidden', 'true');
  screen.replaceWith(screenSlot);
  const header = screen.querySelector('.monitor-head');
  const title = header.firstElementChild;
  title.id = 'monitor-title-' + screen.dataset.screen;
  dialog.setAttribute('aria-labelledby', title.id);
  header.append(closeButton);
  dialog.append(screen);
  dialog.showModal();
  closeButton.focus({preventScroll:true});
}
function setFlightActive(active) {
  document.body.classList.toggle('inside', !active);
  arrival.classList.toggle('done', !active);
  skipButton.hidden = !active;
}
function setPause(value){paused=value;document.body.classList.toggle('paused',value);pauseButton.textContent=value?'Resume':'Pause';pauseButton.setAttribute('aria-pressed',String(value));}
function finish() {
  window.paintFlight(introDuration);
  setFlightActive(false);
  completed = true;
  document.body.classList.remove('is-typing','operator-working','running');

  screens.forEach(screen => {
    decodeScreen(screen,1);
    screen.classList.remove('active');
    screen.querySelector('.screen-status').textContent = 'DECRYPTED';
  });
  progress.style.width = '100%';
  document.querySelector('#counter').textContent = '06 / 06';
  narration.textContent = 'Session complete';
  document.querySelector('#terminal-log').textContent = 'All six records are available to explore.';
}
function start() {
  closeFocus();
  elapsed = previous = lastPaint = 0;
  completed = false;
  setPause(false);
  setFlightActive(true);
  document.body.classList.remove('is-typing','operator-working','motion-still');
  document.body.classList.add('running');
  arrival.classList.remove('impact');

  document.querySelector('#terminal-log').textContent = 'Establishing connection...';
  screens.forEach(screen => {
    screen.classList.remove('active');
    decodeScreen(screen,0);
    screen.querySelector('.screen-status').textContent = 'STANDBY';
    screen.querySelector('.binary-curtain').textContent = 'Awaiting operator…';
  });
  document.querySelector('.room').scrollTop = 0;
  document.querySelector('#counter').textContent = '00 / 06';
  narration.textContent = '';
  window.paintFlight(0);
  if (reduce.matches) finish();
  else render();
}
function render(){
  if(elapsed<introDuration){
    const phase=elapsed<4700?0:elapsed<9500?1:elapsed<12500?2:3;
    const captions=[['Dubai / After dark','The Night<br><em>Session.</em>'],['Burj Khalifa / Approach','One light<br><em>still on.</em>'],['Burj Khalifa / Office','Through the glass.'],['Private workstation','The search begins.']];
    document.querySelector('#arrival-label').textContent=captions[phase][0];document.querySelector('#arrival-text').innerHTML=captions[phase][1];arrival.classList.toggle('impact',elapsed>11200);
  }else{
    if (!arrival.classList.contains('done')) {
      window.paintFlight(introDuration);
      setFlightActive(false);
      document.body.classList.add('operator-working');
    }
    const index=Math.min(screens.length-1,Math.floor((elapsed-introDuration)/stepDuration));
    const age = elapsed-introDuration-index*stepDuration;
    const command = 'find "Siva Syam" /'+queries[index];
    const typed = command.slice(0,Math.floor(Math.min(1,age/1450)*command.length));
    const monitor = String(index+1).padStart(2,'0');
    document.body.classList.toggle('is-typing',age<1450);
        screens.forEach((screen,i)=>{
      const fraction = Math.max(0,Math.min(1,(elapsed-introDuration-i*stepDuration-1750)/1800));
      if (fraction>0 && fraction<1 || screen.classList.contains('revealed') !== (fraction>=1)) decodeScreen(screen,fraction);
      screen.classList.toggle('active',i===index);
      screen.querySelector('.screen-status').textContent = fraction>=1?'DECRYPTED':i===index?'SEARCHING':'STANDBY';
      screen.querySelector('.binary-curtain').textContent = i===index
        ? '$ '+typed+(age<1450?'▏':'\nMatch found · opening record') : 'Awaiting operator…';
    });
    const activity = age<1450?'Typing query':age<1750?'Searching archive':'Reading record';

    document.querySelector('#terminal-log').textContent = age<1750 ? '$ '+typed+'_' : activity+' from public archive';
    narration.textContent = labels[index]+' / Monitor '+monitor;
    document.querySelector('#counter').textContent=String(index+1).padStart(2,'0')+' / 06';
  }
  progress.style.width=String(Math.min(100,elapsed/total*100))+'%';if(elapsed>=total)finish();
}
document.addEventListener('visibilitychange',()=>{previous=0;});
function tick(time) {
  const delta = previous && !document.hidden ? time - previous : 0;
  previous = time;
  if (!paused && !completed) {
    elapsed += delta;
    if (elapsed < introDuration) window.paintFlight(elapsed);
    if (time - lastPaint > 70) {
      render();
      lastPaint = time;
    }
  }
  window.drawOperator?.({
    time, elapsed, flight:introDuration, step:stepDuration, completed,
    paused:paused || document.hidden || dialog.open || document.body.classList.contains('motion-still'),
    reduced:reduce.matches
  });
  requestAnimationFrame(tick);
}
skipButton.addEventListener('click', () => { elapsed = introDuration; render(); pauseButton.focus({preventScroll:true}); });
document.querySelector('.skip-link').addEventListener('click',()=>{finish();});
pauseButton.addEventListener('click',()=>{if(completed){const still=document.body.classList.toggle('motion-still');pauseButton.textContent=still?'Resume':'Pause';pauseButton.setAttribute('aria-pressed',String(still));}else setPause(!paused);});
document.querySelector('#replay').addEventListener('click',start);
grid.addEventListener('click', event => {
  const screen = event.target.closest('[data-screen]');
  if (!screen || event.target.closest('a, button:not(.focus-screen)')) return;
  if (!event.target.closest('.focus-screen') && window.getSelection()?.toString()) return;
  openScreen(screen);
});
closeButton.addEventListener('click',closeFocus);
dialog.addEventListener('close', () => { if (!dialog.open) restoreScreen(); });
dialog.addEventListener('click', event => { if (event.target === dialog) closeFocus(); });
document.querySelector('#copy').addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('kvssubbu02@gmail.com');status.textContent='Email copied.';}catch{status.textContent='Email: kvssubbu02@gmail.com';}});
document.querySelector('#year').textContent=new Date().getFullYear();
function clock(){document.querySelector('#clock').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());}clock();setInterval(clock,1000);reduce.addEventListener('change',()=>{if(reduce.matches)finish();});start();requestAnimationFrame(tick);
