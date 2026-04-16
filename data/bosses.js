const BOSSES_DATA=[
  {id:'colossus',name:'Bone Colossus',floor:5,hp:220,atk:20,def:8,xp:200,sprite:'colossus',
   skills:[
     {name:'Slam',     prob:0.4, dmgMult:1.5, ignoreArmor:false, hits:1,   effect:null},
     {name:'Stomp',    prob:0.3, dmgMult:1.2, ignoreArmor:true,  hits:1,   effect:null},
     {name:'Bone Volley',prob:0.3,dmgMult:0.4,ignoreArmor:false, hits:3,   effect:null}
   ]},
  {id:'karath',name:'Karath the Undying',floor:10,hp:480,atk:30,def:14,xp:500,sprite:'karath',
   phase2Threshold:0.5,
   skills:[
     {name:'Strike',   prob:0.4, dmgMult:1.3, ignoreArmor:false, hits:1,   effect:null,    phase2:false},
     {name:'Soul Drain',prob:0.35,dmgMult:1.0,ignoreArmor:false, hits:1,   effect:'drain', phase2:false},
     {name:'Dark Nova', prob:0.25,dmgMult:2.0,ignoreArmor:true,  hits:1,   effect:'curse', phase2:true}
   ]}
];
