import fs from 'node:fs';let j=fs.readFileSync('dist/workspace.js','utf8');
j=j.replace("const step=pxPerDegree>=90?1/60", "const step=pxPerDegree>=7200?axisStep(span,Math.max(1,Math.floor(pixels/7))):pxPerDegree>=90?1/60");
j=j.replace("const minute=Math.round(v*60),degree=Math.abs(minute%60)===0,tick=", "const seconds=Math.round(v*3600),minute=Math.round(v*60),wholeMinute=seconds%60===0,degree=seconds%3600===0,tick=");
j=j.replace("minute%5===0?' five-minute-tick':''", "wholeMinute&&minute%5===0?' five-minute-tick':''");
j=j.replace("if(degree||pxPerDegree>=120&&(minute%5===0||pxPerDegree>=900)){const text=degree?axisFormat(v,lat,1):axisFormat(v,lat,1/60);", "const labelSeconds=Math.max(1,Math.round(axisStep(span,Math.max(1,Math.floor(pixels/(lat?40:110))))*3600));if(degree||wholeMinute&&pxPerDegree>=120&&(minute%5===0||pxPerDegree>=900)||step<1/60&&seconds%labelSeconds===0){const text=axisFormat(v,lat,degree?1:wholeMinute?1/60:step);");
j=j.replace("priority:degree?2:1", "priority:degree?3:wholeMinute?2:1");
fs.writeFileSync('dist/workspace.js',j);
