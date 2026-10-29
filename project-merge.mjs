const forbidden=new Set(['__proto__','prototype','constructor']);
const copy=x=>structuredClone(x);
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value)}
const same=(a,b)=>canonical(a)===canonical(b);
const without=(object,keys)=>Object.fromEntries(Object.entries(object).filter(([key])=>!keys.includes(key)&&!forbidden.has(key)));
function leaves(value,path=[],out=[]){if(path.some(k=>forbidden.has(k)))return out;if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length){for(const[key,v]of Object.entries(value))leaves(v,[...path,key],out)}else out.push({path,value});return out}
function read(root,path){let value=root;for(const key of path){if(!value||typeof value!=='object'||!Object.hasOwn(value,key))return{exists:false};value=value[key]}return{exists:true,value}}
function write(root,path,value){if(!path.length||path.some(k=>forbidden.has(k)))throw Error('不支援的設定路徑');let node=root;for(const key of path.slice(0,-1)){if(!node[key]||typeof node[key]!=='object'||Array.isArray(node[key]))node[key]={};node=node[key]}node[path.at(-1)]=copy(value)}
export function planProjectImport(current,incoming){const items=[],all=current.layers.flatMap(l=>l.objects),byId=new Map(all.map(o=>[o.id,o])),signature=o=>o.type+'|'+o.name+'|'+canonical(o.points),bySignature=new Map(all.map(o=>[signature(o),o]));const add=item=>items.push({id:'import-'+items.length,...item});
 for(const source of incoming.layers){const target=current.layers.find(l=>l.id===source.id)||current.layers.find(l=>l.name===source.name),profile=without(source,['id','objects']),oldProfile=target?without(target,['id','objects']):undefined;
  add({kind:'layer',status:!target?'new':same(profile,oldProfile)?'same':'different',label:source.name+'｜圖層設定',layerId:source.id,targetLayerId:target?.id,current:oldProfile,incoming:profile});
  const localSignatures=new Map((target?.objects||[]).map(o=>[signature(o),o])),localNames=new Map((target?.objects||[]).map(o=>[o.type+'|'+o.name,o]));for(const object of source.objects){const existing=byId.get(object.id)||localSignatures.get(signature(object))||localNames.get(object.type+'|'+object.name)||bySignature.get(signature(object)),value=without(object,['id']),old=existing?without(existing,['id']):undefined;
   add({kind:'object',status:!existing?'new':same(old,value)?'same':'different',label:source.name+' / '+object.name,layerId:source.id,targetLayerId:target?.id,objectId:object.id,existingObjectId:existing?.id,current:old,incoming:value});
  }
 }
 for(const root of ['settings','instruments'])for(const field of leaves(incoming[root]||{})){if(!field.path.length)continue;const path=[root,...field.path],old=read(current,path);add({kind:'setting',status:!old.exists?'new':same(old.value,field.value)?'same':'different',label:path.join(' › '),path,current:old.value,incoming:field.value})}
 if(items.length>60000)throw Error('匯入項目過多，請拆分專案');return items;
}
export function mergeProjectItems(current,incoming,selected,makeId){const result=copy(current),plan=planProjectImport(current,incoming),chosen=new Set(selected),ids=new Set(result.layers.flatMap(l=>[l.id,...l.objects.map(o=>o.id)])),destinations=new Map(),objectIdMap=new Map(),addedObjects=[],stats={layers:0,layerSettings:0,objects:0,copies:0,settings:0};
 const unique=()=>{let id;do{id=makeId()}while(ids.has(id));ids.add(id);return id};
 for(const source of incoming.layers){const profile=plan.find(i=>i.kind==='layer'&&i.layerId===source.id),objects=plan.filter(i=>i.kind==='object'&&i.layerId===source.id&&chosen.has(i.id));if(!chosen.has(profile.id)&&!objects.length)continue;let target=result.layers.find(l=>l.id===profile.targetLayerId);
  if(!target){const id=ids.has(source.id)?unique():source.id;ids.add(id);target={id,name:source.name,visible:true,objects:[]};result.layers.push(target);stats.layers++}if(chosen.has(profile.id)){Object.assign(target,copy(profile.incoming));stats.layerSettings++}destinations.set(source.id,target);const sourceObjects=new Map(source.objects.map(o=>[o.id,o]));
  for(const item of objects){const object=copy(sourceObjects.get(item.objectId));if(item.existingObjectId||ids.has(object.id)){object.id=unique();object.name+=' 副本';stats.copies++}else ids.add(object.id);objectIdMap.set(item.objectId,object.id);addedObjects.push(object);target.objects.push(object);stats.objects++}
 }
 for(const object of addedObjects)for(const props of object.pointProperties||[]){if(props?.mom&&objectIdMap.has(props.mom.objectId))props.mom.objectId=objectIdMap.get(props.mom.objectId)}
 for(const item of plan)if(item.kind==='setting'&&chosen.has(item.id)){write(result,item.path,item.incoming);stats.settings++}
 return{project:result,stats};
}
