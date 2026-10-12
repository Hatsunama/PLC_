export function createLab(i){return {i,a:false,b:false,out:false,seenOn:false,seenOff:false,scans:0,mode:'OR',notA:false,notB:false,map:Array(6).fill(''),start:false,stop:true,overload:true,run:false,motorChecks:[false,false,false,false,false],preset:2,elapsed:0,enable:false,done:false,timerDone:false,timerReset:false,countMode:'level',count:0,prev:false,heldChecks:0,maxCount:0,counterReset:false,state:'Idle',high:false,low:false,mixDone:false,visited:['Idle'],waited:[],cycleDone:false,seqStopped:false,raw:0,rawLow:0,rawHigh:1000,engLow:0,engHigh:100,valid:true,analogSamples:[],invalidSeen:false,fault:false,ack:false,latched:false,hmiStage:0,comms:true,pcSubnet:1,plcSubnet:2,pcHost:10,plcHost:10,connected:false,backup:null,changed:false,restored:false,faultCase:0,inspected:[],diagnosis:'',diagnosed:0,target:50,timeout:4,fresh:false,level:0,fillElapsed:0,fillCount:0,fillState:'Idle',armed:true,frozen:false,fillFault:'',fillReason:'',operated:false,report:null};}
export const truth=(a,b,mode,notA=false,notB=false)=>{a=notA?!a:a;b=notB?!b:b;return mode==='AND'?a&&b:a||b;};
export const scale=(v,lo,hi,elo,ehi)=>hi>lo?elo+(v-lo)/(hi-lo)*(ehi-elo):null;
export const canConnect=s=>s.pcSubnet===s.plcSubnet&&s.pcHost!==s.plcHost&&[s.pcHost,s.plcHost].every(x=>Number.isInteger(x)&&x>=1&&x<=254)&&[s.pcSubnet,s.plcSubnet].every(x=>Number.isInteger(x)&&x>=0&&x<=255);
export const faults=[
{title:'Sensor sees a box. Indicator is dark.',evidence:['Field condition: a box is present. Sensor indication is ON.','PLC input X0: OFF.','Logic: uses X0 with a true-test contact. Rung result: false.','Output command Y0: OFF. Indicator: OFF.'],answer:'Input signal path',hint:'Compare the field indication with the value that reached the PLC.'},
{title:'Input is confirmed on. Indicator is dark.',evidence:['Field condition: a box is present. Sensor indication is ON.','PLC input X0: ON.','Logic: uses an inverted X0 contact. Rung result: false.','Output command Y0: OFF. Indicator: OFF.'],answer:'Program condition',hint:'Trace the contact test using the observed input value.'},
{title:'The command is on. Indicator is dark.',evidence:['Field condition: a box is present. Sensor indication is ON.','PLC input X0: ON.','Logic: uses a true-test X0 contact. Rung result: true.','Output command Y0: ON. Simulated lamp supply: missing. Indicator: OFF.'],answer:'Output device path',hint:'Where does the observed behavior first stop matching the command?'}];
export function fillStep(s,dt=0){
 if(!s.start)s.armed=true;
 if(s.fillState==='Filling'){
  if(!s.stop){s.fillState='Idle';s.fillReason='Permission removed';s.armed=false;}
  else if(!s.valid){s.fillState='Fault';s.fillFault='Level signal invalid';s.armed=false;}
  else {s.fillElapsed+=dt;if(!s.frozen)s.level=Math.min(100,s.level+10*dt);if(s.level>=s.target){s.fillState='Complete';s.fillCount++;s.armed=false;s.fillReason='Target reached';}else if(s.fillElapsed>=s.timeout){s.fillState='Fault';s.fillFault='Fill timeout';s.armed=false;}}
 }
 if(s.fillState==='Idle'&&s.start&&s.stop&&s.valid&&(!s.fresh||s.armed)) {s.fillState='Filling';s.fillElapsed=0;s.fillReason='';s.armed=false;}
 s.out=s.fillState==='Filling'; return s;
}
export function acceptance(settings){
 const make=()=>Object.assign(createLab(11),{target:settings.target,timeout:settings.timeout,fresh:settings.fresh});
 const start=s=>{s.start=true;fillStep(s);s.start=false;fillStep(s);};
 let a=make();start(a);for(let k=0;k<20;k++)fillStep(a,.5);
 let b=make();start(b);b.stop=false;fillStep(b);const stops=b.fillState==='Idle'&&!b.out;
 let c=make();start(c);c.valid=false;fillStep(c);
 let d=make();d.frozen=true;start(d);for(let k=0;k<20;k++)fillStep(d,.5);
 let e=make();e.start=true;fillStep(e);e.stop=false;fillStep(e);const interrupted=e.fillState==='Idle';e.stop=true;fillStep(e);
 let f=make();f.start=true;fillStep(f);f.fillState='Idle';f.armed=false;f.out=false;fillStep(f);
 let g=make();g.start=true;fillStep(g);g.stop=false;fillStep(g);g.stop=true;fillStep(g);g.start=false;fillStep(g);g.start=true;fillStep(g);
 return [
 ['Normal fill stops at the specified 60% target',a.fillState==='Complete'&&a.level===60&&a.fillCount===1],
 ['Configured timeout matches the specified 8 seconds',settings.timeout===8],
 ['Removing the run permission turns filling off',stops],
 ['Invalid measurement produces a fault and stops filling',c.fillState==='Fault'&&!c.out],
 ['Frozen level produces a timeout',d.fillState==='Fault'&&d.fillFault==='Fill timeout'],
 ['Restoring permission with Start held does not restart',interrupted&&e.fillState==='Idle'],
 ['Controller restart with Start held remains idle',f.fillState==='Idle'],
 ['Release and a fresh press allow an authorized new start',g.fillState==='Filling']];
}
export function act(s,key,value){
 if(s.i===8&&!s.comms&&['hmiStart','hmiStop','ack','hmiReset'].includes(key))return s;
 const numberFields=['preset','raw','rawLow','rawHigh','engLow','engHigh','pcSubnet','plcSubnet','pcHost','plcHost','target','timeout'];
 if(numberFields.includes(key)){const v=Number(value);if(!Number.isFinite(v))return s;s[key]=v;s.report=null;}
 else if(['mode','countMode','diagnosis'].includes(key)){s[key]=value;s.report=null;}
 else if(key.startsWith('map'))s.map[Number(key.slice(3))]=value;
 else if(['a','b','notA','notB','enable','stop','overload','high','low','mixDone','valid','comms','fresh','frozen'].includes(key)){s[key]=!s[key];s.report=null;}
 if(s.i===0&&key==='scan'){s.scans++;s.out=s.a;s.seenOn ||= s.out;s.seenOff ||= !s.out;}
 if(s.i===2)s.out=truth(s.a,s.b,s.mode,s.notA,s.notB);
 if(s.i===3){
  if(key==='start')s.start=true;if(key==='release')s.start=false;
  const permit=s.mode==='AND'?s.stop&&s.overload:s.stop||s.overload;
  s.run=permit&&(s.start||s.run);s.out=s.run;
  const c=s.motorChecks;
  if(key==='start'&&s.run&&s.stop&&s.overload)c[0]=true;
  if(key==='release'&&s.run&&c[0])c[1]=true;
  if(key==='stop'&&!s.stop&&!s.run&&c[1])c[2]=true;
  if(key==='overload'&&!s.overload&&!s.run&&c[2])c[3]=true;
  if(key==='start'&&!s.stop&&!s.run&&c[3])c[4]=true;
 }
 if(s.i===4){
  if(key==='advance'&&s.enable)s.elapsed=Math.min(30,s.elapsed+.5);
  if(!s.enable){if(s.timerDone)s.timerReset=true;s.elapsed=0;}
  s.done=s.enable&&s.elapsed>=s.preset;s.out=s.done;if(s.done&&s.preset===3)s.timerDone=true;
 }
 if(s.i===5){
  if(key==='countReset'){s.counterReset=s.maxCount>=5;s.count=0;s.prev=s.a;}
  else if(key==='a'||key==='scan'){
   const before=s.count;if(s.a&&(s.countMode==='level'||!s.prev))s.count++;
   if(key==='scan'&&s.a&&before===s.count)s.heldChecks++;
   s.prev=s.a;s.scans++;s.maxCount=Math.max(s.maxCount,s.count);
  }
  if(key==='countMode'){s.count=0;s.prev=s.a;s.maxCount=0;s.heldChecks=0;s.counterReset=false;}
  s.out=s.count>=5;
 }
 if(s.i===6){
  if(key==='start'&&s.state==='Idle'){s.state='Fill';s.high=false;s.low=false;s.mixDone=false;}
  if(key==='scan'){
   const before=s.state;
   if(s.state==='Fill'&&s.high)s.state='Mix';else if(s.state==='Mix'&&s.mixDone)s.state='Drain';else if(s.state==='Drain'&&s.low){s.state='Idle';s.cycleDone=true;}
   if(before===s.state&&!s.waited.includes(before))s.waited.push(before);
  }
  if(key==='seqStop'){s.state='Idle';s.seqStopped=true;}
  if(!s.visited.includes(s.state))s.visited.push(s.state);
 }
 if(s.i===7){
  if(key==='sample'&&s.valid){if(!s.analogSamples.includes(s.raw))s.analogSamples.push(s.raw);}
  if(key==='valid'&&!s.valid)s.invalidSeen=true;
 }
 if(s.i===8){
  if(key==='hmiStart'&&!s.latched&&!s.fault&&s.comms){s.run=true;if(s.hmiStage===0)s.hmiStage=1;}
  if(key==='fault'){s.fault=!s.fault;if(s.fault){s.latched=true;s.ack=false;s.run=false;if(s.hmiStage===1)s.hmiStage=2;}}
  if(key==='ack'&&s.latched){s.ack=true;if(s.hmiStage===2)s.hmiStage=3;}
  if(key==='hmiReset'){
   if(s.fault){if(s.hmiStage===3)s.hmiStage=4;}
   else if(s.latched){s.latched=false;s.ack=false;if(s.hmiStage===4)s.hmiStage=5;}
  }
  if(key==='hmiStop')s.run=false;
 }
 if(s.i===9){
  if(['pcSubnet','plcSubnet','pcHost','plcHost'].includes(key)){s.connected=false;if(s.backup)s.changed=true;}
  if(key==='connect')s.connected=canConnect(s);
  if(key==='backup'&&s.connected)s.backup={pcSubnet:s.pcSubnet,plcSubnet:s.plcSubnet,pcHost:s.pcHost,plcHost:s.plcHost};
  if(key==='restore'&&s.backup){Object.assign(s,s.backup);s.connected=canConnect(s);if(s.changed)s.restored=true;}
 }
 if(s.i===10){if(key==='inspect'&&!s.inspected.includes(Number(value)))s.inspected.push(Number(value));if(key==='nextFault'&&s.diagnosed>s.faultCase&&s.faultCase<2){s.faultCase++;s.inspected=[];s.diagnosis='';}}
 if(s.i===11){
  if(key==='fillStart'){s.start=true;s.operated=true;}
  if(key==='fillRelease')s.start=false;
  if(key==='advance')fillStep(s,.5);
  else if(key==='restart'){s.fillState='Idle';s.out=false;s.armed=false;s.fillElapsed=0;s.fillFault='';s.fillReason='Controller restarted';}
  else if(key==='fillReset'&&!s.start&&s.valid&&s.stop){s.fillState='Idle';s.level=0;s.fillElapsed=0;s.fillFault='';s.fillReason='Reset complete';s.armed=true;}
  else fillStep(s,0);
 }
 return s;
}
export function validate(s){
 const result=(ok,text)=>({ok,text});
 switch(s.i){
 case 0:return result(s.seenOn&&s.seenOff,'Observe an ON result and an OFF result after executing scans. Changing the input alone is not a scan.');
 case 1:{const expected=['Input','Output','Input','Output','Input','Output'];const wrong=s.map.map((x,i)=>x!==expected[i]?i+1:null).filter(Boolean);return result(!wrong.length,wrong.length?'Revisit cards '+wrong.join(', ')+'. Trace the signal direction relative to the PLC.':'Every signal is classified.');}
 case 2:{for(const a of [false,true])for(const b of [false,true])if(truth(a,b,s.mode,s.notA,s.notB)!==(a&&b))return result(false,`Inspect the path when A is ${a?'on':'off'} and B is ${b?'on':'off'}. Does it satisfy “both”?`);return result(true,'All four combinations meet the requirement.');}
 case 3:return result(s.mode==='AND'&&s.motorChecks.every(Boolean),'Complete the five bench checks. If a request stays on when a permission is lost, inspect how the permissions are combined.');
 case 4:return result(s.preset===3&&s.timerDone&&s.timerReset,'Check the required delay, reach Done, and interrupt Enable. Observe what happens to accumulated time.');
 case 5:return result(s.countMode==='edge'&&s.heldChecks>=2&&s.maxCount>=5&&s.counterReset,'Verify a held signal across at least two extra scans, record five events, then reset. Keep the counting behavior consistent.');
 case 6:return result(s.cycleDone&&['Fill','Mix','Drain'].every(x=>s.waited.includes(x))&&s.seqStopped,'Wait at least one scan in each active state before its completion condition, finish a cycle, and test Stop.');
 case 7:return result(s.rawLow===0&&s.rawHigh===1000&&s.engLow===0&&s.engHigh===200&&s.analogSamples.includes(0)&&s.analogSamples.includes(1000)&&s.analogSamples.some(x=>x>0&&x<1000)&&s.invalidSeen,'Check all four range endpoints, record low, middle, and high samples, and test invalid data.');
 case 8:return result(s.hmiStage>=5&&!s.run&&!s.latched,'Follow the sequence: start, fault, acknowledge, attempt reset while the cause remains, remove cause, reset. Observe whether recovery starts the process.');
 case 9:return result(s.connected&&s.restored,'Establish a valid connection, save its configuration, change an address, then restore the saved configuration.');
 case 10:{if(s.inspected.length<4)return result(false,'Inspect all four stations before making the diagnosis.');if(s.diagnosis!==faults[s.faultCase].answer)return result(false,faults[s.faultCase].hint);s.diagnosed=Math.max(s.diagnosed,s.faultCase+1);return result(s.diagnosed===3,s.diagnosed<3?'Your evidence supports this diagnosis. Open the next case to continue.':'All three fault locations were supported by evidence.');}
 case 11:{s.report=acceptance(s);return result(s.operated&&s.report.every(x=>x[1]),s.operated?'Review the acceptance checks that still need attention. Revisit the related setting or restart policy.':'Operate the station yourself before completing the acceptance check.');}
 }
}
