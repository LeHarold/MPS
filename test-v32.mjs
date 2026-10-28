import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const s=fs.readFileSync('dist/workspace.js','utf8');const c=vm.createContext({});vm.runInContext(s.slice(s.indexOf('function lowerLeftLabel('),s.indexOf('function addAreaName(')),c);
const rect=[{x:0,y:0},{x:300,y:0},{x:300,y:200},{x:0,y:200}];let p=c.lowerLeftLabel(rect,70,20);assert.equal(p.x,5);assert.equal(p.y,175);
const concave=[{x:0,y:0},{x:300,y:0},{x:300,y:200},{x:200,y:200},{x:200,y:100},{x:0,y:100}];p=c.lowerLeftLabel(concave,70,20);assert.equal(p.x,205);assert.equal(p.y,175);
assert.equal(c.lowerLeftLabel(rect,400,20),null);
vm.runInContext(s.slice(s.indexOf('function nameVisible('),s.indexOf('function layerStyle(')),c);assert.equal(c.nameVisible({names:true},'areaNames'),true);assert.equal(c.nameVisible({names:true,areaNames:false},'areaNames'),false);assert.equal(c.nameVisible({areaNames:true,pointNames:false},'pointNames'),false);
console.log('PASS independent name toggles, legacy preferences, lower-left label fitting for rectangle and concave polygon, no overflow for tiny areas');
