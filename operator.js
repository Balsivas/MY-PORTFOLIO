/* Deform the filmed pose in its own image coordinates. Monitor glass and room
   architecture stay fixed; the same session clock drives keys, gaze and light. */
(() => {
  const canvas = document.querySelector('.operator-film');
  const plate = document.querySelector('.room-plate');
  const gl = canvas.getContext('webgl', {alpha:true, antialias:false, depth:false, powerPreference:'low-power'});
  if (!gl) return;

  const vertex = `
    attribute vec2 position;
    uniform vec4 motion;   // head yaw, pitch, shoulder follow, breathing
    uniform vec2 fingers;
    varying vec2 uv;
    varying float bounce;
    float weight(vec2 p, vec2 center, vec2 radius) {
      vec2 d = (p-center)/radius;
      return 1.0-smoothstep(.30,1.0,dot(d,d));
    }
    void main() {
      uv = position;
      vec2 p = position;
      vec2 neck = vec2(.507,.728);
      float head = weight(p,vec2(.506,.619),vec2(.091,.132));
      float upperBack = weight(p,vec2(.506,.746),vec2(.213,.129));
      float leftHand = weight(p,vec2(.335,.718),vec2(.047,.040));
      float rightHand = weight(p,vec2(.671,.718),vec2(.048,.040));
      float sleeves = weight(p,vec2(.333,.775),vec2(.076,.09))*fingers.x
                    + weight(p,vec2(.674,.775),vec2(.075,.09))*fingers.y;
      vec2 rel = p-neck;
      p.x += head*(motion.x*(.004-rel.y*.062)+rel.x*motion.y*.025);
      p.y += head*(motion.y*.009+motion.x*rel.x*.10);
      p.x += upperBack*motion.z*.0035;
      p.y -= upperBack*motion.w*.0028 + head*motion.w*.0016;
      p.y += .0036*(leftHand*fingers.x+rightHand*fingers.y)+.0014*sleeves;
      p.x += .0019*(leftHand*fingers.x-rightHand*fingers.y);
      bounce = .45*head+.55*upperBack+.8*(leftHand+rightHand);
      gl_Position=vec4(p*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
    }`;
  const fragment = `
    precision mediump float;
    uniform sampler2D frame;
    uniform vec2 light;
    varying vec2 uv;
    varying float bounce;
    void main() {
      // Sample the outline of the photographed hood before applying the pose.
      // Its bright stitched seam stays opaque even under cool monitor light.
      vec2 pixel=uv*vec2(1536.,1024.);
      if(pixel.y<536.) discard;
      float alpha=1.;
      if(pixel.y<617.) {
        vec2 edge=mix(vec2(778.,779.),vec2(762.,795.),clamp((pixel.y-536.)/5.,0.,1.));
        edge=mix(edge,vec2(743.,813.),clamp((pixel.y-541.)/10.,0.,1.));
        edge=mix(edge,vec2(728.,827.),clamp((pixel.y-551.)/12.,0.,1.));
        edge=mix(edge,vec2(717.,840.),clamp((pixel.y-563.)/18.,0.,1.));
        edge=mix(edge,vec2(698.,858.),clamp((pixel.y-581.)/36.,0.,1.));
        alpha=smoothstep(-.65,.65,min(pixel.x-edge.x,edge.y-pixel.x));
        if (pixel.y>605.) alpha=max(alpha,smoothstep(605.,617.,pixel.y));
        if(alpha<=0.)discard;
      }
      vec3 color=texture2D(frame,uv).rgb;
      vec2 spread=(uv-vec2(light.x,.83))*vec2(3.3,8.);
      float desk=exp(-dot(spread,spread))*.40;
      color += vec3(.26,.78,.72)*(bounce+desk)*light.y*(.05+color*.12);
      gl_FragColor=vec4(color*alpha,alpha);
    }`;
  function shader(type, source) {
    const result=gl.createShader(type);
    gl.shaderSource(result,source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  }
  function prepare() {
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Could not initialize scene.');
    gl.useProgram(program);
    const points=[], triangles=[], cols=96, rows=70;
    for(let y=0;y<=rows;y++) for(let x=0;x<=cols;x++) points.push(x/cols,y/rows);
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x, b=a+cols+1;
      triangles.push(a,b,a+1,a+1,b,b+1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(triangles),gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,plate);
    const motion=gl.getUniformLocation(program,'motion'), keys=gl.getUniformLocation(program,'fingers'), light=gl.getUniformLocation(program,'light');
    let last=0, clock=0, yaw=0, pitch=0, follow=0;
    const ease=(a,b,d,k)=>a+(b-a)*(1-Math.exp(-k*d));
    const stroke=t=>Math.max(0,Math.sin(t))**3;
    let dirty=true;
    new ResizeObserver(()=>{dirty=true;}).observe(canvas);
    window.drawOperator=({time,elapsed,flight,step,paused,completed,reduced})=>{
      if (reduced || elapsed<flight-5000 && !completed) {
        canvas.style.visibility='hidden';canvas.parentElement.classList.remove('film-ready');last=0;return;
      }
      if (paused) {last=0;return;}
      if (last && time-last<32) return;
      const dt=last?Math.min((time-last)/1000,.075):.032;
      last=time;clock+=dt;
      if(dirty) {
        const w=Math.min(2200,Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,1.5)));
        if(!w)return;
        canvas.width=w;canvas.height=Math.round(w*plate.naturalHeight/plate.naturalWidth);
        gl.viewport(0,0,canvas.width,canvas.height);dirty=false;
      }
      const stage=Math.max(0,(elapsed-flight)/step);
      const screen=Math.min(5,Math.floor(stage)), age=(stage%1)*step;
      const typing=!completed && elapsed>=flight && age<1450;
      const read=!completed && elapsed>=flight && age>1120;
      const direction=screen%3-1;
      // Gaze leads the shoulders. Wrists settle before the reading posture.
      yaw=ease(yaw,read?direction*.94:Math.sin(clock*.48)*.13,dt,3.8);
      pitch=ease(pitch,typing?.7:read?(screen<3?-.86:-.25):.05,dt,3.2);
      follow=ease(follow,yaw,dt,1.45);
      const breath=.65*Math.sin(clock*1.55)+.16*Math.sin(clock*2.78+.6);
      gl.uniform4f(motion,yaw,pitch,follow,breath);
      const envelope=typing?Math.min(1,age/170,(1450-age)/170):0;
      gl.uniform2f(keys,envelope*stroke(clock*23+Math.sin(clock*6)),envelope*stroke(clock*29+1.5*Math.sin(clock*4.2)));
      gl.uniform2f(light,.5+direction*.17,read?.54:typing?.26+.08*stroke(clock*19):.18);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES,triangles.length,gl.UNSIGNED_SHORT,0);
      canvas.style.visibility='visible';
      canvas.parentElement.classList.add('film-ready');
    };
  }
  canvas.addEventListener('webglcontextlost',()=>{canvas.style.visibility='hidden';canvas.parentElement.classList.remove('film-ready');window.drawOperator=null;});
  plate.decode().then(prepare).catch(()=>{canvas.style.visibility='hidden';});
})();
