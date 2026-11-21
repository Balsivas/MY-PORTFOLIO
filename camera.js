/* Project two stationary planes from a single moving viewpoint.
   Distances are in focal lengths. The selected office anchors both planes. */
(() => {
  const stage = document.querySelector('#arrival');
  const find = name => stage.querySelector('.' + name);
  const skyline = find('flight-world'), wall = find('glass-entry');
  const glass = find('window-interior'), reflection = find('glass-reflection');
  const near = find('cloud-near'), far = find('cloud-far');
  const caption = find('arrival-caption'), coords = find('arrival-coordinates');
  const meter = find('flight-meter i'), office = document.querySelector('.scene-world');
  const clamp = x => Math.max(0,Math.min(1,x));
  const ease = (x,a,b) => { const u = clamp((x-a)/(b-a)); return u*u*(3-2*u); };

  function project(element, size, depth, anchorX, anchorY, camera) {
    const scale = size / Math.max(.015,depth-camera.z);
    const x = (.5 + (2.24-camera.x)/Math.max(.015,depth-camera.z) - anchorX*scale)*innerWidth;
    const y = (.5 + (1.12-camera.y)/Math.max(.015,depth-camera.z) - anchorY*scale)*innerHeight;
    element.style.transform = 'translate3d('+x+'px,'+y+'px,0) scale('+scale+')';
    return scale;
  }
  window.paintFlight = ms => {
    const t = clamp(ms/16000), path = ease(t,0,.89);
    const remaining = 8*Math.pow(.018/8,path);
    const camera = {z:8-remaining+.5*ease(t,.78,1)};
    // Arc toward the tower while keeping its office within the frame.
    camera.x = 2.24 - remaining*(.28*(1-ease(t,0,.58)) + .06*Math.sin(Math.PI*ease(t,0,.65)));
    camera.y = 1.12 - remaining*.14*(1-ease(t,0,.62));
    project(skyline,8,8.03,.78,.64,camera);
    const coverage = project(wall,.78,8,.583,.582,camera);
    // Introduce architectural detail only after the building fills the shot.
    wall.style.opacity = camera.z >= 8 ? 0 : ease(coverage,1.65,2.25);
    skyline.style.opacity = 1-ease(coverage,2.25,3.2);
    glass.style.opacity = 1-ease(coverage,2.2,5.8);
    reflection.style.opacity = .55*(1-ease(coverage,2,5));
    const inside = ease(t,.51,1);
    office.style.transform = 'translate(-50%,-50%) translateX('+(-2.6*(1-inside))+'%) scale('+(.84+.16*inside)+')';
    near.style.transform = 'translate3d('+(-34*path)+'%,'+(50*path)+'%,0) scale('+(1+path)+')';
    far.style.transform = 'translate3d('+(13*path)+'%,'+(22*path)+'%,0)';
    near.style.opacity = .28*(1-ease(t,.08,.42));
    far.style.opacity = .19*(1-ease(t,.08,.47));
    caption.style.opacity = 1-ease(t,.32,.5);
    coords.style.opacity = .7*(1-ease(t,.25,.45));
    meter.style.transform = 'scaleX('+t+')';
  };
  window.paintFlight(0);
})();
