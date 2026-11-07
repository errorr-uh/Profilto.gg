(function(){
var d=document,$=function(i){return d.getElementById(i)},body=d.body;
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- Data: socials (rail + tiles), websites ---------- */
var SOC=[
 ['GitHub','https://github.com/errorr-uh','fa-brands fa-github','#ffffff'],
 ['TikTok','https://www.tiktok.com/@.errorr_','fa-brands fa-tiktok','tt'],
 ['Discord','https://discord.com/users/1263414928967208992','fa-brands fa-discord','#5865f2'],
 ['X','https://x.com/error_yoh','fa-brands fa-x-twitter','#ffffff'],
 ['Reddit','https://reddit.com/user/_error','fa-brands fa-reddit-alien','#ff4500'],
 ['Steam','https://steamcommunity.com/id/errrrorrrr/','fa-brands fa-steam','#66c0f4'],
 ['MeWe','https://mewe.com/errorr','fa-brands fa-mewe','#2e8bff'],
 ['Dev Certificate','https://skillissue.bond','fa-solid fa-award','#f5c542']];
function link(s,cls,inner){return '<a class="'+cls+' rev'+(s[3]==='tt'?' tt':'')+'" style="--c:'+(s[3]==='tt'?'#fe2c55':s[3])+'" href="'+s[1]+'" target="_blank" rel="noopener" aria-label="'+s[0]+'">'+inner+'</a>'}
$('tiles').innerHTML=SOC.map(function(s){return link(s,'tile glass','<i class="ic '+s[2]+'"></i><b>'+s[0]+'</b>')}).join('');
$('sitegrid').innerHTML=['errorr.bond','error.sld.lol'].map(function(h){
 return '<div class="site glass rev" style="--c:#ff3d5a"><div class="bar"><i></i><i></i><i></i><span>'+h+'</span><i class="fa-solid fa-arrow-up-right-from-square"></i></div>'+
 '<div class="view"><div class="fb"><div><i class="fa-solid fa-globe"></i>'+h+'</div></div><iframe data-src="https://'+h+'" title="'+h+' preview" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin"></iframe>'+
 '<a class="cover" href="https://'+h+'" target="_blank" rel="noopener" aria-label="Open '+h+'"></a></div></div>'}).join('');
function fit(){d.querySelectorAll('.view').forEach(function(w){w.querySelector('iframe').style.transform='scale('+(w.clientWidth/1280)+')'})}
var ifr=d.querySelectorAll('.view iframe');
if('IntersectionObserver' in window){var lo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.src=e.target.dataset.src;lo.unobserve(e.target)}})},{rootMargin:'300px 0px'});ifr.forEach(function(f){lo.observe(f)})}
else ifr.forEach(function(f){f.src=f.dataset.src});
addEventListener('resize',fit);fit();

/* ---------- Character: WebGL mesh, frame atlas + live idle motion ---------- */
var FW=360,FH=362,PAD=2,CW=FW+2*PAD,CH=FH+2*PAD,COLS=6,AW=CW*COLS,AH=CH*3,NF=18,STEP=46;
var cv=$('g'),girl=$('girl'),gl=null,prog,uni={},atlasImg=new Image(),mask=null;
var noGL=false,phase='wait',t0=0,idle0=0,shot=-1e5,drift=0;

var VS='attribute vec2 a;uniform vec2 uC;uniform float t,amp,rec,sg;varying vec2 uv;'+
'float sm(float e0,float e1,float x){float k=clamp((x-e0)/(e1-e0),0.,1.);return k*k*(3.-2.*k);}'+
'void main(){'+
' vec2 p=a*vec2(360.,362.),d=vec2(0.);float h=1.-p.y/362.;'+
' float br=.5+.5*sin(t*1.5);'+
' d.y-=amp*br*4.4*pow(h,1.4);d.x+=amp*br*(p.x-190.)*.006*sm(.3,.75,h);d.x+=amp*sin(t*.7)*1.1*sm(.35,.8,h);'+
/* hand tremor: small rotation of gun + fist around the wrist, plus recoil kick */
' float wg=(1.-sm(124.,146.,p.x))*(1.-sm(180.,262.,p.y));'+
' float th=amp*(.010*sin(t*2.1)+.006*sin(t*3.7+1.3)+.0035*sin(t*11.+t*t*.2))+rec*.17;'+
' vec2 r=p-vec2(124.,235.);d+=wg*vec2(-th*r.y,th*r.x);d.y-=wg*rec*9.;'+
' d+=wg*amp*vec2(.35*sin(t*9.3),.3*sin(t*7.9));'+
/* hair flow: strands sway with a travelling wave, outer strands move more */
' float hy=sm(10.,110.,p.y)*(1.-sm(118.,150.,p.y));float hx=sm(140.,150.,p.x)*(1.-sm(214.,224.,p.x));'+
' float sd=max(1.-sm(150.,172.,p.x),sm(188.,208.,p.x));float wh=hy*hx*(.25+.75*sd);'+
' d.x+=amp*wh*(1.7*sin(t*1.9+p.y*.06)+.8*sin(t*3.1+p.y*.11))+rec*wh*sg*5.;d.y+=amp*wh*.5*sin(t*2.3+p.x*.1);'+
/* body flinch when she fires */
' d+=vec2(rec*2.,rec*4.*h);'+
' p+=d;uv=(uC*vec2('+CW+'.,'+CH+'.)+vec2('+PAD+'.)+a*vec2(360.,362.))/vec2('+AW+'.,'+AH+'.);'+
' gl_Position=vec4(p.x/180.-1.,1.-p.y/181.,0.,1.);}';
var FS='precision mediump float;varying vec2 uv;uniform sampler2D tx;void main(){gl_FragColor=texture2D(tx,uv);}';

function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s}
function initGL(){
  try{gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false})}catch(e){gl=null}
  if(!gl)return false;
  prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){gl=null;return false}
  gl.useProgram(prog);
  var N=48,v=[],ix=[],i,j;
  for(j=0;j<=N;j++)for(i=0;i<=N;i++)v.push(i/N,j/N);
  for(j=0;j<N;j++)for(i=0;i<N;i++){var k=j*(N+1)+i;ix.push(k,k+1,k+N+1,k+1,k+N+2,k+N+1)}
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ix),gl.STATIC_DRAW);
  ['uC','t','amp','rec','sg','tx'].forEach(function(n){uni[n]=gl.getUniformLocation(prog,n)});
  var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlasImg);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(uni.tx,0);gl.clearColor(0,0,0,0);
  return true;
}
function size(){
  if(!gl)return;
  var r=Math.min(devicePixelRatio||1,2),w=Math.round(cv.clientWidth*r)||FW;
  if(cv.width!==w){cv.width=w;cv.height=Math.round(w*FH/FW)}
  if(gl)gl.viewport(0,0,cv.width,cv.height);
}
function draw(cell,amp,t,rec,sg){
  if(!gl)return;
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(uni.uC,cell%COLS,Math.floor(cell/COLS));
  gl.uniform1f(uni.t,t);gl.uniform1f(uni.amp,amp);gl.uniform1f(uni.rec,rec);gl.uniform1f(uni.sg,sg);
  gl.drawElements(gl.TRIANGLES,48*48*6,gl.UNSIGNED_SHORT,0);
}
var aim=0,aiming=false,lastDraw=0;
function loop(now){
  if(scrollY>innerHeight*.6&&now-lastDraw<42){requestAnimationFrame(loop);return} /* lighter redraw while she sits behind the content */
  lastDraw=now;
  var cell=0,amp=0,t=0;
  if(phase==='intro'){cell=Math.max(0,Math.min(NF-1,Math.floor((now-t0)/STEP)));if(cell>=NF-1){phase='idle';idle0=now;shootIntro()}}
  if(phase==='idle'){cell=NF-1;amp=reduce?0:Math.min(1,(now-idle0)/1400);t=(now-idle0)/1000}
  if(phase==='wait')cell=0;
  aim+=((aiming?1:0)-aim)*.12;amp*=1-.82*aim;
  var rec=Math.exp(-(now-shot)/170);if(rec<.002)rec=0;
  draw(cell,amp,t+3,rec,drift);
  requestAnimationFrame(loop);
}

/* ---------- Shoot ---------- */
var ac=null;
var GUN_URL='',gunBuf=null,gunReq=0,irBuf=null; /* set GUN_URL to a real gunshot .mp3/.wav to use it instead of the synth */
function nz(c,sec,pw){var n=Math.floor(c.sampleRate*sec),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(var i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,pw);return b}
function bang(auto){
  var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  if(auto&&(!ac||ac.state!=='running'))return;
  try{
    ac=ac||new AC();if(ac.state==='suspended')ac.resume();
    var T=ac.currentTime,out=ac.createDynamicsCompressor(),dry=ac.createGain(),wet=ac.createGain(),rv=ac.createConvolver(),dl=ac.createDelay(1),fb=ac.createGain(),m=ac.createGain();
    if(!irBuf){var n=Math.floor(ac.sampleRate*2.8);irBuf=ac.createBuffer(2,n,ac.sampleRate);for(var c=0;c<2;c++){var a=irBuf.getChannelData(c);for(var i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.8)}}
    rv.buffer=irBuf;wet.gain.value=.55;dl.delayTime.value=.23;fb.gain.value=.32;m.gain.value=.95;
    dry.connect(out);wet.connect(rv);rv.connect(out);wet.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(out);out.connect(m);m.connect(ac.destination);
    if(GUN_URL&&!gunBuf&&!gunReq){gunReq=1;fetch(GUN_URL).then(function(r){return r.arrayBuffer()}).then(function(b){ac.decodeAudioData(b,function(x){gunBuf=x})}).catch(function(){})}
    function N(buf,ft,f0,f1,dur,gn){var s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=buf;f.type=ft;f.frequency.setValueAtTime(f0,T);f.frequency.exponentialRampToValueAtTime(f1,T+dur);g.gain.value=gn;s.connect(f);f.connect(g);g.connect(dry);g.connect(wet);s.start(T)}
    if(gunBuf){var s=ac.createBufferSource();s.buffer=gunBuf;s.connect(dry);s.connect(wet);s.start(T);return}
    N(nz(ac,.03,1.2),'highpass',2600,1400,.03,1.2);   /* supersonic crack */
    N(nz(ac,.5,2.2),'lowpass',7500,260,.45,1.05);     /* muzzle blast */
    N(nz(ac,1.7,3),'lowpass',1000,110,1.6,.38);       /* rumble tail */
    N(nz(ac,.6,4),'bandpass',2900,2300,.5,.22);       /* metallic ring */
    var o=ac.createOscillator(),og=ac.createGain(),ws=ac.createWaveShaper(),cu=new Float32Array(256);
    for(var j=0;j<256;j++){var x=j/128-1;cu[j]=Math.tanh(x*3)}ws.curve=cu;
    o.frequency.setValueAtTime(155,T);o.frequency.exponentialRampToValueAtTime(28,T+.55);og.gain.setValueAtTime(1.1,T);og.gain.exponentialRampToValueAtTime(.001,T+.6);
    o.connect(ws);ws.connect(og);og.connect(dry);og.connect(wet);o.start(T);o.stop(T+.62);
    [[.52,3900],[.66,2800],[.78,3300]].forEach(function(q){var p=ac.createOscillator(),pg=ac.createGain();p.type='triangle';p.frequency.value=q[1];pg.gain.setValueAtTime(.0001,T+q[0]);pg.gain.exponentialRampToValueAtTime(.13,T+q[0]+.004);pg.gain.exponentialRampToValueAtTime(.0001,T+q[0]+.12);p.connect(pg);pg.connect(dry);p.start(T+q[0]);p.stop(T+q[0]+.14)}); /* shell casing clinks */
  }catch(e){}
}
function restart(el,c){el.classList.remove(c);void el.offsetWidth;el.classList.add(c)}
var SAF=/^((?!chrome|android).)*safari/i.test(navigator.userAgent),bloodURL=null,wantBlood=false;
function bloodSrc(){return 'blood.webm'}
function blood(x,y){
  var v=d.createElement('video'),W=Math.min(innerWidth*1.15,Math.max(innerWidth*.85,760));
  v.src=bloodSrc();v.muted=true;v.setAttribute('playsinline','');v.className='bld';
  v.style.cssText='left:'+x+'px;top:'+y+'px;width:'+W+'px;margin:'+(-W*.28)+'px 0 0 '+(-W/2)+'px;mix-blend-mode:'+(SAF?'screen':'normal');
  d.body.appendChild(v);var go=function(){v.remove()};v.onended=go;v.onerror=go;setTimeout(go,4500);var p=v.play();if(p&&p.catch)p.catch(go);
}
function crack(x,y){
  var w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2),cn=d.createElement('canvas'),i,j,k,sg=9;
  cn.width=w*dpr;cn.height=h*dpr;cn.className='crk';var g=cn.getContext('2d');g.scale(dpr,dpr);g.lineCap='round';g.lineJoin='round';
  var R=Math.max(w,h)*(w<700?.64:.5),n=16+Math.floor(Math.random()*6),a0=Math.random()*6.283,ry=[];
  for(i=0;i<n;i++){var a=a0+i*6.283/n+(Math.random()-.5)*.3,len=R*(.55+Math.random()*.45),pt=[[x,y]];
    for(k=1;k<=sg;k++){var aa=a+(Math.random()-.5)*.14,r=len*Math.pow(k/sg,1.08)*(.94+Math.random()*.12);pt.push([x+Math.cos(aa)*r,y+Math.sin(aa)*r])}ry.push(pt)}
  for(i=0;i<n;i++){j=(i+1)%n;for(k=1;k<7;k++){if(Math.random()<.25)continue;       /* glass facets */
    g.beginPath();g.moveTo(ry[i][k][0],ry[i][k][1]);g.lineTo(ry[i][k+1][0],ry[i][k+1][1]);g.lineTo(ry[j][k+1][0],ry[j][k+1][1]);g.lineTo(ry[j][k][0],ry[j][k][1]);g.closePath();
    g.fillStyle=Math.random()<.7?'rgba(255,255,255,'+(Math.random()*.1).toFixed(3)+')':'rgba(0,0,0,'+(Math.random()*.16).toFixed(3)+')';g.fill()}}
  function seg(p,q,lw,al){g.strokeStyle='rgba(0,0,0,'+al*.6+')';g.lineWidth=lw*1.9;g.beginPath();g.moveTo(p[0]+1.2,p[1]+1.6);g.lineTo(q[0]+1.2,q[1]+1.6);g.stroke();
    g.strokeStyle='rgba(255,255,255,'+al+')';g.lineWidth=lw;g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke()}
  [2,3,5,7].forEach(function(k,q){for(i=0;i<n;i++){if(Math.random()<.2)continue;var p=ry[i][k],r2=ry[(i+1)%n][k],mid=[(p[0]+r2[0])/2+(Math.random()-.5)*8,(p[1]+r2[1])/2+(Math.random()-.5)*8];seg(p,mid,1.1-q*.12,.75);seg(mid,r2,1.1-q*.12,.75)}});
  for(i=0;i<n;i++){for(k=1;k<=sg;k++){seg(ry[i][k-1],ry[i][k],Math.max(.6,3.4*(1-k/sg)),.95);
    if(k>2&&k<sg&&Math.random()<.45){var ba=Math.atan2(ry[i][k][1]-y,ry[i][k][0]-x)+(Math.random()<.5?-1:1)*(.5+Math.random()*.6),bl=R*(.03+Math.random()*.09);seg(ry[i][k],[ry[i][k][0]+Math.cos(ba)*bl,ry[i][k][1]+Math.sin(ba)*bl],.8,.8)}}}
  var gr=g.createRadialGradient(x,y,0,x,y,R*.09);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,R*.09,0,6.283);g.fill();
  g.beginPath();for(i=0;i<12;i++){var ra=i*.5236,rr=R*(.012+Math.random()*.014);g.lineTo(x+Math.cos(ra)*rr,y+Math.sin(ra)*rr)}g.closePath();g.fillStyle='#050505';g.fill();g.strokeStyle='#fff';g.lineWidth=1.6;g.stroke();
  if(wantBlood){for(i=0;i<9;i++){var bx=x+(Math.random()-.5)*R*.3,by=y+(Math.random()-.5)*R*.3,br=R*(.01+Math.random()*.03),bg=g.createRadialGradient(bx,by,0,bx,by,br);bg.addColorStop(0,'rgba(150,0,12,.85)');bg.addColorStop(1,'rgba(90,0,6,0)');g.fillStyle=bg;g.beginPath();g.arc(bx,by,br,0,6.283);g.fill()}
    for(i=0;i<4;i++){var dx=x+(Math.random()-.5)*R*.18,dd=R*(.08+Math.random()*.16);g.strokeStyle='rgba(120,0,10,.8)';g.lineWidth=2+Math.random()*3;g.beginPath();g.moveTo(dx,y);g.lineTo(dx+(Math.random()-.5)*6,y+dd);g.stroke()}
    blood(x,y)}
  d.body.appendChild(cn);setTimeout(function(){cn.remove()},6100);
}
function fire(px,py,auto){
  shot=performance.now();drift=Math.random()<.5?-1:1;
  restart($('mz'),'fire');restart($('sf'),'fire');
  body.classList.remove('shake');void body.offsetWidth;body.classList.add('shake');
  setTimeout(function(){body.classList.remove('shake')},420);
  for(var i=0;i<3;i++){var s=d.createElement('i');s.className='sm';s.style.left=(29+Math.random()*3)+'%';s.style.top=(14+Math.random()*3)+'%';
    s.style.setProperty('--x',(Math.random()*60-30)+'%');s.style.animationDelay=(i*.12)+'s';girl.appendChild(s);setTimeout(function(el){el.remove()},1900,s)}
  crack(px==null?innerWidth*(.28+Math.random()*.3):px,py==null?innerHeight*(.25+Math.random()*.4):py);
  bang(auto);if(!auto&&navigator.vibrate)navigator.vibrate(45);
  $('hint').classList.add('off');
}
/* Entrance: she lowers the gun, fires once on her own, then the page renders */
var introShot=false;
function shootIntro(){
  if(introShot)return;introShot=true;
  setTimeout(function(){
    fire(innerWidth*.36,innerHeight*.44,false);
    setTimeout(function(){body.classList.add('ui-on')},reduce?60:520);
  },reduce?0:170);
}
/* ---------- Touch: where she is tapped decides what she says ---------- */
function unlockAudio(){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{ac=ac||new AC();if(ac.state==='suspended')ac.resume()}catch(e){}}
function pt(e){var r=cv.getBoundingClientRect();return{x:Math.round((e.clientX-r.left)/r.width*FW),y:Math.round((e.clientY-r.top)/r.height*FH),r:r}}
function onHer(p){
  if(!mask||phase!=='idle')return false;
  if(p.x<0||p.y<0||p.x>=FW||p.y>=FH)return false;
  for(var j=-5;j<=5;j+=5)for(var i=-5;i<=5;i+=5){var px=p.x+i,py=p.y+j;if(px>=0&&py>=0&&px<FW&&py<FH&&mask[(py*FW+px)*4+3]>40)return true}
  return false;
}
/* frame coordinates: gun, hand and forearm sit left of x=152; head above y=118; shoulder line to y=150; chest, waist and hips below */
function zone(p){if(p.x<152)return'hand';if(p.x>=168&&p.x<=256&&p.y>=124&&p.y<=180)return'private';if(p.x>=150&&p.x<=266&&p.y>=296)return'private';if(p.y<118)return'head';if(p.y<150)return'shoulder';return'body'}
function empty(t){return!(t.closest&&t.closest('a,button,nav,.glass,.head,.mail,.spider'))}

/* manga balloon: oval with a tail for calm threats, spiky burst for shouting */
function balloon(W,H,shout,tx,ty){
  var cx=W/2,cy=H/2,rx=W/2-7,ry=H/2-7,i,o='';
  function f(n){return n.toFixed(1)}
  if(shout){
    var N=18,P=[];
    for(i=0;i<N*2;i++){var a=i*Math.PI/N-Math.PI/2,r=(i%2?.8:1)*(1+(((i*7)%5)-2)*.02);P.push(f(cx+Math.cos(a)*rx*r)+','+f(cy+Math.sin(a)*ry*r))}
    return'<svg viewBox="0 0 '+W+' '+H+'"><polygon points="'+P.join(' ')+'" fill="#fff" stroke="#000" stroke-width="4.5" stroke-linejoin="round"/></svg>';
  }
  var dx=tx-cx,dy=ty-cy,dist=Math.hypot(dx,dy)||1,ux=dx/dist,uy=dy/dist,f0=Math.atan2(uy*rx,ux*ry);
  function E(a,k){return[cx+(rx-k)*Math.cos(a),cy+(ry-k)*Math.sin(a)]}
  var b=E(f0,0),bl=Math.hypot(b[0]-cx,b[1]-cy),len=Math.max(28,Math.min(66,dist-bl-12)),
      tip=[b[0]+ux*len,b[1]+uy*len],p1=E(f0-.3,0),p2=E(f0+.3,0),q1=E(f0-.18,3),q2=E(f0+.18,3);
  o+='<path d="M'+f(p1[0])+' '+f(p1[1])+'L'+f(tip[0])+' '+f(tip[1])+'L'+f(p2[0])+' '+f(p2[1])+'Z" fill="#fff" stroke="#000" stroke-width="4.5" stroke-linejoin="round"/>';
  o+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="#fff" stroke="#000" stroke-width="4.5"/>';
  o+='<path d="M'+f(q1[0])+' '+f(q1[1])+'L'+f(q2[0])+' '+f(q2[1])+'L'+f(q2[0]+ux*6)+' '+f(q2[1]+uy*6)+'L'+f(q1[0]+ux*6)+' '+f(q1[1]+uy*6)+'Z" fill="#fff"/>';
  return'<svg viewBox="0 0 '+W+' '+H+'">'+o+'</svg>';
}
var bub=null;
function hush(){if(!bub)return;var b=bub;bub=null;b.classList.add('out');setTimeout(function(){b.remove()},280)}
function say(txt,kind,ax,ay){
  hush();
  var shout=kind==='shout',Lc=txt.replace(/<br>/g,' ').length,W=shout?310:Math.min(340,210+Lc*3),H=shout?150:(Lc>30?176:Lc>20?150:130),k=Math.min(1,(innerWidth-20)/W);
  if(innerWidth<600)k=Math.min(k,.86);
  var w=W*k,h=H*k,cx=ax-w*.62-26,cy=ay-h*.95-34;
  cx=Math.max(w/2+10,Math.min(innerWidth-w/2-10,cx));cy=Math.max(h/2+72,Math.min(innerHeight-h/2-12,cy));
  var el=d.createElement('div');el.className='bub '+kind;el.setAttribute('aria-hidden','true');
  el.style.cssText='left:'+cx.toFixed(1)+'px;top:'+cy.toFixed(1)+'px;width:'+W+'px;height:'+H+'px;margin:'+(-H/2)+'px 0 0 '+(-W/2)+'px;transform:scale('+k.toFixed(3)+')';
  el.innerHTML='<div class="bi">'+balloon(W,H,shout,(ax-cx)/k+W/2,(ay-cy)/k+H/2)+'<div class="t"><span>'+txt+'</span></div></div>';
  d.body.appendChild(el);bub=el;
}
var talking=false,last='';
var LN={head:['Careful. I bite back.','Eyes up here, handsome.','You have my attention. Don\'t waste it.','Cute. Now run along.','Staring is free. Mistakes aren\'t.'],
 shoulder:['Hands to yourself, stranger.','Touchy, aren\'t we?','That\'s a lot of nerve for a stranger.','I don\'t do clingy.','Try that again and see what happens.'],
 hand:['Mind the gun. Safety\'s off.','Want to hold it? You won\'t like it.','Curious? That\'s how people get hurt.','Careful, darling. It\'s loaded.'],
 body:['Closer than I like. Back off.','One more step and we talk differently.','You\'re testing my patience.','Wrong move, darling. Last warning.','Do I look like I need company?'],
 private:['BAD<br>TOUCH!','DON\'T<br>TOUCH ME!','BIG<br>MISTAKE!','HANDS<br>OFF!','THAT\'S<br>IT!']};
function pick(z){var a=LN[z],t;do{t=a[Math.floor(Math.random()*a.length)]}while(t===last&&a.length>1);last=t;return t}
function talk(z,cx,cy,p){
  talking=true;
  var r=p.r,ax=r.left+190/FW*r.width,ay=r.top+90/FH*r.height,bad=(z==='private');
  say(pick(z),bad?'shout':'say',ax,ay);
  aiming=!bad;$('hint').classList.add('off');
  if(bad){setTimeout(function(){aiming=false;wantBlood=true;fire(cx+(Math.random()*30-15),cy+(Math.random()*30-15));wantBlood=false;
    if(navigator.vibrate)navigator.vibrate([70,30,110]);setTimeout(function(){hush();talking=false},1800)},130)}   /* private-zone touch: she fires at once */
  else setTimeout(function(){aiming=false;hush();talking=false},2200);                                            /* normal touch: talks only, no shot */
}
d.addEventListener('click',function(e){
  if(!empty(e.target))return;
  unlockAudio();
  var p=pt(e);
  if(!onHer(p)||talking)return;
  talk(zone(p),e.clientX,e.clientY,p);
});
var mv=false;
d.addEventListener('mousemove',function(e){if(mv)return;mv=true;var t=e.target;requestAnimationFrame(function(){mv=false;d.documentElement.style.cursor=(empty(t)&&onHer(pt(e)))?'crosshair':''})},{passive:true});


/* ---------- Load gate: wallpaper + character first, then everything else ---------- */
function start(){
  if(body.classList.contains('go'))return;
  size();body.classList.remove('ld');body.classList.add('go');
  t0=performance.now()+180;phase=(noGL||reduce)?'idle':'intro';
  if(phase==='idle'){idle0=performance.now();shootIntro()}
  setTimeout(function(){body.classList.add('ui-on')},5200); /* safety net if animation frames are throttled */
}
function gate(){
  unlockAudio();
  if(ac&&ac.state==='running'){start();return}
  var l=$('load'),p=d.createElement('p');p.id='enter';p.textContent='Tap to enter';l.firstChild.appendChild(p);
  var go=function(){d.removeEventListener('pointerdown',go);d.removeEventListener('keydown',go);unlockAudio();try{play()}catch(e){}start()};
  d.addEventListener('pointerdown',go);d.addEventListener('keydown',go);
}
var okBg=new Promise(function(r){var i=new Image();i.onload=i.onerror=r;i.src=BG}),
    okAt=new Promise(function(r){atlasImg.onload=function(){r(true)};atlasImg.onerror=function(){r(false)};atlasImg.src=ATLAS}),
    okFt=Promise.race([d.fonts?d.fonts.ready:0,new Promise(function(r){setTimeout(r,2200)})]),
    min=new Promise(function(r){setTimeout(r,450)});
Promise.all([okBg,okAt,okFt,min]).then(function(v){
  if(v[1]){
    var c=d.createElement('canvas');c.width=FW;c.height=FH;var x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(atlasImg,PAD+(NF-1)%COLS*CW,PAD+Math.floor((NF-1)/COLS)*CH,FW,FH,0,0,FW,FH);
    try{mask=x.getImageData(0,0,FW,FH).data}catch(e){}
    if(initGL()){size();requestAnimationFrame(loop)}
    else{noGL=true;var cx=cv.getContext('2d');cv.width=FW;cv.height=FH;cx.drawImage(atlasImg,PAD+(NF-1)%COLS*CW,PAD+Math.floor((NF-1)/COLS)*CH,FW,FH,0,0,FW,FH)}
  }
  gate();
});
addEventListener('resize',size);


addEventListener('scroll',function(){body.classList.toggle('sc',scrollY>innerHeight*.5)},{passive:true});

/* ---------- Reveal, active category, music ---------- */
var rv=d.querySelectorAll('.rv');
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});
  rv.forEach(function(e){io.observe(e)});
  var links={};d.querySelectorAll('.nav a').forEach(function(a){links[a.getAttribute('href').slice(1)]=a});
  var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){Object.keys(links).forEach(function(k){links[k].classList.toggle('on',k===e.target.id)})}})},{rootMargin:'-45% 0px -50% 0px'});
  d.querySelectorAll('section[id],.sec[id]').forEach(function(s){so.observe(s)});
}else rv.forEach(function(e){e.classList.add('in')});


var au=$('au'),mi=$('mi');
function play(){au.volume=.5;au.play().then(function(){mi.className='fa-solid fa-volume-high'}).catch(function(){})}
var COV=["cover1.jpg","cover2.jpg","cover3.jpg","cover4.jpg","cover5.jpg","cover6.jpg","cover7.jpg","cover8.jpg","cover9.jpg"],mp=new Audio(),mx=0,mU={},mUser=false;mp.preload='auto';mp.volume=.6;
function mUrl(i){return 'music'+i+'.mp3'}
function fmt(t){t=Math.floor(t||0);return Math.floor(t/60)+':'+('0'+t%60).slice(-2)}
var ml=$('mlist');for(var q=0;q<9;q++)(function(q){var b=d.createElement('button');b.textContent='Music '+(q+1);b.onclick=function(){mSet(q,true)};ml.appendChild(b)})(q);
function mSet(i,go){mx=(i+9)%9;mp.src=mUrl(mx+1);$('mcov').src=COV[mx];$('mtit').textContent='MUSIC '+(mx+1);$('mst').textContent='Track '+(mx+1)+' / 9';
  [].forEach.call(ml.children,function(b,k){b.classList.toggle('on',k===mx)});$('mseek').value=0;$('mcur').textContent='0:00';$('mdur').textContent='0:00';
  if(go){mUser=true;au.pause();mp.play().catch(function(){})}}
function icons(){var on=!(mUser?mp.paused:au.paused);mi.className='fa-solid fa-volume-'+(on?'high':'xmark');$('mplay').innerHTML='<i class="fa-solid fa-'+(!mp.paused?'pause':'play')+'"></i>'}
mp.onplay=function(){mUser=true;au.pause();icons()};mp.onpause=icons;au.onplay=function(){if(!mp.paused)au.pause();icons()};au.onpause=icons;
mp.onended=function(){mSet(mx+1,true)};
mp.ontimeupdate=function(){if(mp.duration){$('mseek').value=mp.currentTime/mp.duration*1000;$('mcur').textContent=fmt(mp.currentTime);$('mdur').textContent=fmt(mp.duration)}};
mp.onloadedmetadata=function(){$('mdur').textContent=fmt(mp.duration)};
$('mseek').oninput=function(){if(mp.duration)mp.currentTime=this.value/1000*mp.duration};
$('mplay').onclick=function(){mUser=true;if(mp.paused){au.pause();mp.play().catch(function(){})}else mp.pause()};
$('mprev').onclick=function(){mSet(mx-1,true)};$('mnext').onclick=function(){mSet(mx+1,true)};
function vol(v){v=Math.max(0,Math.min(1,v));mp.volume=v;au.volume=v;$('mvol').value=Math.round(v*100)}
$('mvol').oninput=function(){vol(this.value/100)};$('mvd').onclick=function(){vol(mp.volume-.1)};$('mvu').onclick=function(){vol(mp.volume+.1)};
mSet(0,false);
$('mb').addEventListener('click',function(e){e.stopPropagation();var a=mUser?mp:au;if(a.paused){if(a===au)play();else mp.play().catch(function(){})}else a.pause()});
})();
