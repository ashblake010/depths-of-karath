// ── UI Module ──────────────────────────────────────────────────────────────
const UI={
  overlay:null,

  init(onInput){
    UI.overlay=document.getElementById('overlay');
    UI._buildControls(onInput);
  },

  _buildControls(onInput){
    const ov=UI.overlay;
    ov.innerHTML='';

    // HUD buttons (shown during dungeon & combat)
    // D-pad (dungeon only - toggled by showDpad)
    const dpad=document.createElement('div');
    dpad.id='dpad'; dpad.style.cssText=`
      position:absolute; bottom:20px; left:16px;
      display:grid; grid-template-columns:48px 48px 48px;
      grid-template-rows:48px 48px 48px; gap:4px; touch-action:none;`;
    const dirs=[
      ['',    '',  ''],
      ['⬆',  '⬛', ''],
      ['⬅',  '⬛', '⮕'],
      ['',    '⬇', ''],
    ];
    const dpadBtns=[
      {id:'up',   txt:'▲', row:0,col:1},
      {id:'left',  txt:'◀', row:1,col:0},
      {id:'right', txt:'▶', row:1,col:2},
      {id:'down',  txt:'▼', row:2,col:1},
    ];
    dpadBtns.forEach(b=>{
      const btn=document.createElement('button');
      btn.id='btn-'+b.id; btn.textContent=b.txt;
      btn.style.cssText=`
        grid-row:${b.row+1}; grid-column:${b.col+1};
        background:#1a0030; border:1px solid #5020a0; color:#c8a;
        font-size:20px; border-radius:8px; cursor:pointer;
        -webkit-tap-highlight-color:transparent; user-select:none; touch-action:none;`;
      btn.addEventListener('touchstart',e=>{e.preventDefault();onInput(b.id);},{passive:false});
      btn.addEventListener('mousedown',()=>onInput(b.id));
      dpad.appendChild(btn);
    });
    ov.appendChild(dpad);

    // Action buttons (dungeon)
    const actions=document.createElement('div');
    actions.id='action-btns'; actions.style.cssText=`
      position:absolute; bottom:20px; right:16px;
      display:flex; flex-direction:column; gap:8px;`;
    [{id:'skill',txt:'SKILL',color:'#a04020'},{id:'inv',txt:'BAG',color:'#204080'}].forEach(b=>{
      const btn=document.createElement('button');
      btn.id='btn-'+b.id; btn.textContent=b.txt;
      btn.style.cssText=`
        width:64px; height:48px; background:${b.color}88; border:1px solid ${b.color};
        color:#fff; font-size:12px; border-radius:8px; cursor:pointer;
        -webkit-tap-highlight-color:transparent; user-select:none;`;
      btn.addEventListener('touchstart',e=>{e.preventDefault();onInput(b.id);},{passive:false});
      btn.addEventListener('mousedown',()=>onInput(b.id));
      actions.appendChild(btn);
    });
    ov.appendChild(actions);

    // Combat buttons (hidden by default)
    const cbDiv=document.createElement('div');
    cbDiv.id='combat-btns'; cbDiv.style.cssText=`
      position:absolute; bottom:20px; left:0; right:0;
      display:none; justify-content:center; gap:10px; flex-wrap:wrap;`;
    [{id:'attack',txt:'ATTACK',color:'#a02020'},
     {id:'cskill',txt:'SKILL', color:'#804020'},
     {id:'citem', txt:'ITEM',  color:'#206040'},
     {id:'flee',  txt:'FLEE',  color:'#404040'}].forEach(b=>{
      const btn=document.createElement('button');
      btn.id='btn-'+b.id; btn.textContent=b.txt;
      btn.style.cssText=`
        width:72px; height:46px; background:${b.color}aa; border:1px solid ${b.color};
        color:#fff; font-size:13px; font-weight:bold; border-radius:8px; cursor:pointer;
        -webkit-tap-highlight-color:transparent; user-select:none;`;
      btn.addEventListener('touchstart',e=>{e.preventDefault();onInput(b.id);},{passive:false});
      btn.addEventListener('mousedown',()=>onInput(b.id));
      cbDiv.appendChild(btn);
    });
    ov.appendChild(cbDiv);
  },

  setMode(mode){ // 'dungeon' | 'combat' | 'menu' | 'none'
    const dpad=document.getElementById('dpad');
    const actions=document.getElementById('action-btns');
    const combat=document.getElementById('combat-btns');
    if(dpad)    dpad.style.display=      mode==='dungeon'?'grid':'none';
    if(actions) actions.style.display=   mode==='dungeon'?'flex':'none';
    if(combat)  combat.style.display=    mode==='combat'?'flex':'none';
  },

  // Tap detection on canvas for menu screens
  addCanvasTap(canvas,cb){
    const handler=e=>{
      e.preventDefault();
      const r=canvas.getBoundingClientRect();
      const src=e.touches?e.touches[0]:e;
      const scaleX=canvas.width/r.width, scaleY=canvas.height/r.height;
      const x=(src.clientX-r.left)*scaleX;
      const y=(src.clientY-r.top)*scaleY;
      cb(x,y);
    };
    canvas.addEventListener('touchstart',handler,{passive:false});
    canvas.addEventListener('mousedown',handler);
    canvas._tapHandler=handler;
  },

  removeCanvasTap(canvas){
    if(canvas._tapHandler){
      canvas.removeEventListener('touchstart',canvas._tapHandler);
      canvas.removeEventListener('mousedown',canvas._tapHandler);
      canvas._tapHandler=null;
    }
  },

  notify(gs,text,duration=90){
    gs.notification={text,timer:duration};
  },
};
