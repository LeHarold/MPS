import fs from 'node:fs';let s=fs.readFileSync('dist/workspace.js','utf8');
s=s.replaceAll('Math.max(.35,','Math.max(.2,');
s=s.replace("[...unique.values()],24,size.x*2)","[...unique.values()],24,Math.min(size.x*2,1440))");
s=s.replace("$('point-from').value='';$('point-before').value='';", "$('point-from').value=found.object.fromPoint||'';$('point-before').value=found.object.beforeNM??'';");
s=s.replace("f.object.pointKind=$('point-kind').value;const before=", "f.object.pointKind=$('point-kind').value;f.object.fromPoint=name;const before=");
s=s.replace("const points=[clone(start),clone(f.object.points[0])];f.layer.objects.push({id:uid(),type:'line'", "f.object.beforeNM=before===''?null:Number(before);const points=[clone(start),clone(f.object.points[0])];f.layer.objects=f.layer.objects.filter(o=>o.connectionTo!==f.object.id);f.layer.objects.push({id:uid(),connectionTo:f.object.id,type:'line'");
fs.writeFileSync('dist/workspace.js',s);
