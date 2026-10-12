import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {course} from './dist/course.js';
import {createLab,act,validate,truth,scale,canConnect,fillStep,acceptance,faults} from './dist/engine.js';
import {renderLab,rung} from './dist/labs.js';
const step=(s,k,v)=>act(s,k,v);
assert.equal(course.length,12);
for(const m of course){assert.equal(m.questions.length,3);for(const q of m.questions){assert(q.answer>=0&&q.answer<q.options.length);assert(q.hints.length>=2);assert(q.why.length>15);}}
for(let i=0;i<12;i++){const s=createLab(i);assert(!validate(s).ok,`Untouched lab ${i} must not pass`);assert(renderLab(s).includes('PLC TRAINING BENCH'));}
let s=createLab(0);step(s,'a');assert.equal(s.out,false);step(s,'scan');assert(s.out);step(s,'a');assert(s.out);step(s,'scan');assert(validate(s).ok);
s=createLab(1);s.map=['Input','Output','Input','Output','Input','Output'];assert(validate(s).ok);s.map[1]='Input';assert(!validate(s).ok);
s=createLab(2);step(s,'mode','AND');assert(validate(s).ok);step(s,'notA');assert(!validate(s).ok);assert(!truth(false,true,'AND'));assert(truth(false,true,'OR'));
s=createLab(3);step(s,'mode','AND');step(s,'start');step(s,'release');assert(s.run);step(s,'stop');assert(!s.run);step(s,'stop');step(s,'start');step(s,'release');step(s,'overload');assert(!s.run);step(s,'stop');step(s,'start');assert(!s.run);assert(validate(s).ok);
s=createLab(4);step(s,'preset',3);step(s,'enable');step(s,'advance');step(s,'advance');step(s,'enable');assert.equal(s.elapsed,0);assert(!s.done);step(s,'enable');for(let i=0;i<6;i++)step(s,'advance');assert(s.done);step(s,'enable');assert(validate(s).ok);
s=createLab(5);step(s,'countMode','edge');step(s,'a');step(s,'scan');step(s,'scan');assert.equal(s.count,1);for(let i=0;i<4;i++){step(s,'a');step(s,'a');}assert.equal(s.count,5);step(s,'countReset');assert.equal(s.count,0);assert(validate(s).ok);
s=createLab(6);step(s,'start');step(s,'scan');assert.equal(s.state,'Fill');step(s,'high');step(s,'scan');step(s,'scan');assert.equal(s.state,'Mix');step(s,'mixDone');step(s,'scan');step(s,'scan');assert.equal(s.state,'Drain');step(s,'low');step(s,'scan');step(s,'seqStop');assert(validate(s).ok);
s=createLab(7);step(s,'engHigh',200);for(const x of [0,500,1000]){step(s,'raw',x);step(s,'sample');}step(s,'valid');assert(validate(s).ok);assert.equal(scale(500,0,1000,0,200),100);assert.equal(scale(50,100,100,0,10),null);
s=createLab(8);step(s,'hmiStart');step(s,'fault');step(s,'ack');assert(s.fault&&s.latched&&!s.run);step(s,'hmiReset');assert(s.latched);step(s,'fault');step(s,'hmiReset');assert(!s.latched&&!s.run);assert(validate(s).ok);step(s,'comms');step(s,'hmiStart');assert(!s.run);
s=createLab(9);assert(!canConnect(s));step(s,'plcSubnet',1);assert(!canConnect(s));step(s,'plcHost',11);step(s,'connect');assert(s.connected);step(s,'backup');step(s,'plcHost',12);step(s,'restore');assert.equal(s.plcHost,11);assert(validate(s).ok);
s=createLab(10);for(let i=0;i<3;i++){for(let j=0;j<4;j++)step(s,'inspect',j);step(s,'diagnosis',faults[i].answer);const v=validate(s);assert.equal(v.ok,i===2);if(i<2)step(s,'nextFault');}
s=createLab(11);s.target=60;s.timeout=8;s.fresh=true;assert(acceptance(s).every(x=>x[1]));s.fresh=false;assert(acceptance(s).some(x=>!x[1]));s.fresh=true;step(s,'fillStart');for(let i=0;i<12;i++)step(s,'advance');assert.equal(s.fillState,'Complete');assert.equal(s.level,60);assert.equal(s.fillCount,1);assert(validate(s).ok);step(s,'restart');step(s,'advance');assert.equal(s.fillState,'Idle');step(s,'fillRelease');step(s,'fillReset');step(s,'fillStart');step(s,'fillRelease');step(s,'valid');assert.equal(s.fillState,'Fault');assert(!s.out);
for(const file of ['index.html','style.css','app.js','course.js','engine.js','labs.js'])assert(readFileSync('dist/'+file,'utf8').length>50);
assert(!readFileSync('dist/index.html','utf8').includes('http'));
console.log('Passed: 12 lab flows, 36 question structures, fault cases, timing/counter behavior, network restore, and capstone interruption/restart checks.');
