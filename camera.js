/* One camera clock keeps the skyline, window and room in the same shot. */
(() => {
  const stage=document.querySelector('#arrival');
  const world=stage.querySelector('.flight-world');
  const facade=stage.querySelector('.glass-entry');
  const room=document.querySelector('.scene-world');
  const opening=facade.querySelector('.window-interior');
  const near=stage.querySelector('.cloud-near');
  const far=stage.querySelector('.cloud-far');
  const reflection=stage.querySelector('.glass-reflection');
  const flash=stage.querySelector('.impact-flash');
  const rings=stage.querySelector('.impact-rings');
  const glint=stage.querySelector('.lens-glint');
  const haze=stage.querySelector('.speed-haze');
  const meter=stage.querySelector('.flight-meter i');
  const caption=stage.querySelector('.arrival-caption');
  const coordinates=stage.querySelector('.arrival-coordinates');
  const destination=stage.querySelector('.destination-window');
  let width=innerWidth,height=innerHeight;
  addEventListener('resize',()=>{width=innerWidth;height=innerHeight;},{passive:true});
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const segment=(t,a,b)=>smooth((t-a)/(b-a));
  const geometric=(a,b,t)=>a*Math.pow(b/a,t);
  window.paintFlight=(milliseconds)=>{
    const t=clamp(milliseconds/16000);
    // Keep the establishing image below 3x; replace it with vector architecture.
    const advance=segment(t,.08,.65);
    const skyScale=geometric(1.015,2.8,advance);
    const track=segment(t,.12,.64);
    world.style.transform=`translate3d(${-28*track}%,${-14*track}%,0) scale(${skyScale})`;
    // Once the facade fills the viewport, remove the sky behind its opening.
    world.style.opacity=String(1-segment(t,.59,.67));
    const approach=segment(t,.29,.89);
    const scale=geometric(.085,18,approach);
    const cx=mix(.78,.5,track),cy=mix(.64,.5,track);
    if(destination)destination.style.opacity=String(segment(t,.06,.15)*(1-segment(t,.26,.39)));
    const x=(cx-.58333*scale)*width,y=(cy-.58333*scale)*height;
    facade.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
    facade.style.opacity=String(segment(t,.30,.46));
    // The glass reflection thins out while the near sill and jambs move past.
    opening.style.opacity=String(1-segment(t,.60,.77));
    const entry=segment(t,.64,.98);
    room.style.transform=`translate(-50%,-50%) translateX(${mix(2.8,0,entry)}%) scale(${mix(.94,1,entry)})`;
    reflection.style.opacity=String(mix(.8,.1,segment(t,.63,.86)));
    near.style.transform=`translate3d(${mix(4,-24,advance)}%,${mix(-14,47,advance)}%,0) scale(${mix(.85,1.9,advance)})`;
    near.style.opacity=String((.12+.35*Math.sin(Math.PI*clamp(t/.6)))*(1-segment(t,.38,.64)));
    far.style.transform=`translate3d(${mix(-5,15,advance)}%,${mix(-6,35,advance)}%,0) scale(${mix(.9,1.5,advance)})`;
    far.style.opacity=String(.24*(1-segment(t,.30,.62)));
    const contact=Math.exp(-Math.pow((t-.807)/.006,2));
    flash.style.opacity=String(contact*.075);
    rings.style.opacity=String(contact*.3);
    glint.style.opacity=String(Math.sin(Math.PI*segment(t,.58,.84))*.17);
    haze.style.opacity=String(Math.sin(Math.PI*segment(t,.42,.90))*.25);
    meter.style.transform=`scaleX(${t})`;
    caption.style.opacity=String(1-segment(t,.57,.69));
    coordinates.style.opacity=String(.7*(1-segment(t,.48,.60)));
  };
  window.paintFlight(0);
})();
