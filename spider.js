(function(){
  'use strict';
  var D=document,B=D.body;
  function $(s){return D.querySelector(s);}
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var spider=$('#spider'),thread=$('#thread'),sv=$('#spiderv'),handle=$('#handle');
  if(reduce){spider.style.display='none';return;}
  var url='spider.webm';

  // Safari can't decode VP9 alpha: hide the black box with a screen blend instead
  var ua=navigator.userAgent;
  if(/^((?!chrome|android|crios|fxios).)*safari/i.test(ua)||/iPad|iPhone|iPod/.test(ua))spider.classList.add('blend');

  var W,H,vw,vh;
  function size(){
    vw=innerWidth;vh=innerHeight;
    W=Math.min(400,vw*0.78);H=W*360/640;
    sv.style.width=W+'px';sv.style.height=H+'px';
    handle.style.width=W*0.5+'px';handle.style.height=H*0.78+'px';
    handle.style.left=(-W*0.25)+'px';
  }
  size();addEventListener('resize',size);

  var REST=34,x=-W*0.4,vx=0,d=REST+70,vd=0,tx=x,td=d,ang=0;
  var dragging=false,tapping=false,live=false,t0=0,lastInput=-1e9;
  function clampX(v){var m=W*0.22;return Math.max(m,Math.min(vw-m,v));}

  // she appears once the page has finished entering: the spider swings in from the LEFT edge
  function enter(){
    if(live)return;live=true;t0=performance.now();
    sv.src=url;var p=sv.play();if(p&&p.catch)p.catch(function(){});
    spider.classList.add('in');
  }
  if(B.classList.contains('ui-on'))setTimeout(enter,500);
  else new MutationObserver(function(m,o){if(B.classList.contains('ui-on')){o.disconnect();setTimeout(enter,700);}}).observe(B,{attributes:true,attributeFilter:['class']});
  setTimeout(enter,9000); // safety net

  // autoplay can be blocked: start on first gesture
  ['pointerdown','touchstart','keydown'].forEach(function(t){
    addEventListener(t,function(){if(live){var p=sv.play();if(p&&p.catch)p.catch(function(){});}},{once:true,passive:true});
  });

  // pull the spider (mouse + touch)
  var dx0=0,dy0=0,pt0=0;
  handle.addEventListener('pointerdown',function(e){
    if(tapping)return;
    dragging=true;handle.classList.add('dragging');dx0=e.clientX;dy0=e.clientY;pt0=performance.now();
    handle.setPointerCapture(e.pointerId);e.preventDefault();
  });
  handle.addEventListener('pointermove',function(e){
    if(!dragging)return;
    lastInput=performance.now();
    tx=clampX(e.clientX);
    td=Math.max(0,Math.min(vh*0.85,e.clientY-H*0.55));
  });
  function forward(px,py){ // a quick tap on the spider passes through to whatever is underneath
    handle.style.pointerEvents='none';
    var t=D.elementFromPoint(px,py);
    handle.style.pointerEvents='';
    var a=t&&t.closest&&t.closest('a');
    if(a)a.click();
  }
  function release(e){
    if(!dragging)return;
    dragging=false;handle.classList.remove('dragging');
    try{handle.releasePointerCapture(e.pointerId);}catch(_){}
    lastInput=performance.now();
    td=REST+40; // snaps back up with a bounce
    if(e.type==='pointerup'&&Math.hypot(e.clientX-dx0,e.clientY-dy0)<6&&performance.now()-pt0<400)forward(e.clientX,e.clientY);
  }
  handle.addEventListener('pointerup',release);
  handle.addEventListener('pointercancel',release);

  /* ---- the spider taps the social / game / email link you clicked, then it opens ---- */
  function ripple(a,px,py){
    var i=D.createElement('i');i.className='ripple';i.style.left=px+'px';i.style.top=py+'px';
    a.appendChild(i);setTimeout(function(){i.remove();},750);
  }
  function hit(a,px,py){
    a.classList.add('poke');setTimeout(function(){a.classList.remove('poke');},170);
    ripple(a,px,py);
    if(navigator.vibrate)try{navigator.vibrate(12);}catch(_){}
  }
  function go(a){
    var href=a.href;
    if(a.target==='_blank'){
      var w=null;try{w=window.open('','_blank');}catch(_){}
      if(w){try{w.opener=null;}catch(_){}w.location.href=href;}
      else location.href=href;
    }else location.href=href;
  }
  function poke(a){
    tapping=true;handle.style.pointerEvents='none';
    var r=a.getBoundingClientRect();
    var land=Math.max(0,r.top+r.height*0.3-H*0.86); // feet land on the top of the button
    tx=Math.max(W*0.14,Math.min(vw-W*0.14,r.left+r.width/2));
    td=Math.max(0,land-90);                          // swing in from above
    var px=Math.max(0,Math.min(r.width,tx-r.left)),py=r.height*0.3;
    setTimeout(function(){td=land+7;hit(a,px,py);},540);   // tap
    setTimeout(function(){td=land-28;},650);                // lift
    setTimeout(function(){td=land+9;hit(a,px,py);},750);    // tap again
    setTimeout(function(){go(a);},840);                     // open
    setTimeout(function(){td=REST+40;},1000);               // climb back up
    setTimeout(function(){tapping=false;handle.style.pointerEvents='';lastInput=performance.now();},1550);
  }
  D.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a.tile,a.card,.mail a');
    if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    if(!live)return;      // spider not here yet: normal link behaviour
    e.preventDefault();
    if(tapping)return;
    poke(a);
  });

  var last=performance.now();
  function frame(now){
    var dt=Math.min(0.033,(now-last)/1000);last=now;
    if(live&&!dragging&&!tapping&&now-lastInput>2500){
      if(now-t0<2600){ // first seconds: glide in from the left and hang near the left edge
        tx=vw*0.2;td=REST+70+14*Math.sin(now*0.003);
      }else{           // then wander on its own when nobody is interacting
        // on wide screens she owns the right side, so the spider keeps to the left of her
        tx=vw>760?clampX(vw*(0.3+0.22*Math.sin(now*0.00045)+0.06*Math.sin(now*0.0011))):clampX(vw*(0.5+0.36*Math.sin(now*0.00045)+0.1*Math.sin(now*0.0011)));
        td=REST+55+55*Math.sin(now*0.0007+1.3)+Math.max(0,60*Math.sin(now*0.00021));
      }
    }
    var kx=dragging?90:(tapping?110:26),cx=dragging?16:(tapping?14:6.5);   // spring + damping
    var kd=dragging?110:(tapping?240:20),cd=dragging?18:(tapping?20:3.2);  // vertical is bouncier (thread elasticity)
    vx+=((tx-x)*kx-vx*cx)*dt;x+=vx*dt;
    vd+=((td-d)*kd-vd*cd)*dt;d+=vd*dt;
    if(d<0){d=0;vd=Math.abs(vd)*0.3;}
    var targetAng=Math.max(-28,Math.min(28,-vx*0.035));  // lean into the direction of travel
    ang+=(targetAng-ang)*Math.min(1,dt*9);
    spider.style.transform='translate('+x.toFixed(1)+'px,0) rotate('+ang.toFixed(2)+'deg)';
    thread.style.height=Math.max(0,d)+'px';
    sv.style.top=d+'px';
    handle.style.top=(d+H*0.2)+'px';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
