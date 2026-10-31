const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function actionDescription(before,after,hint=''){
 if(same(before,after))return null;
 if(hint)return hint;
 const old=new Map((before.layers||[]).map(l=>[l.id,l])),next=new Map((after.layers||[]).map(l=>[l.id,l]));
 for(const [id,l] of next)if(!old.has(id))return '新增圖層：'+l.name;
 for(const [id,l] of old)if(!next.has(id))return '刪除圖層：'+l.name;
 for(const [id,l] of next){const prev=old.get(id),objects=new Map(prev.objects.map(o=>[o.id,o])),now=new Map(l.objects.map(o=>[o.id,o]));
  for(const [key,o] of now)if(!objects.has(key))return '新增物件：'+o.name;
  for(const [key,o] of objects)if(!now.has(key))return '刪除物件：'+o.name;
  for(const [key,o] of now){const p=objects.get(key);if(same(p,o))continue;
   if(!same(p.points,o.points))return (p.points.length!==o.points.length?'調整座標點：':'移動／修訂座標：')+o.name;
   const properties={color:'顏色',opacity:'透明度',visible:'顯示',name:'名稱',showCoordinates:'經緯度顯示',distanceLabelPosition:'距離標籤位置',distanceLabelHidden:'距離顯示',intervalMarks:'線段記號',pointProperties:'各點屬性',pointScale:'點大小'};
   const fields=Object.entries(properties).filter(([k])=>!same(p[k],o[k])).map(([,v])=>v);return '修改'+(fields.join('、')||'物件')+'：'+o.name;
  }
  if(!same(prev,l))return '修改圖層：'+l.name;
 }
 const a=before.settings||{},b=after.settings||{};
 const names={labelPositions:'名稱／座標位置',printLabelPositions:'列印標籤位置',labelRotations:'標籤旋轉',printLabelRotations:'列印標籤旋轉',distanceLabels:'航點距離標籤',scalePosition:'比例尺位置'};
 for(const [key,name] of Object.entries(names))if(!same(a[key],b[key]))return '調整'+name;
 if(!same(before.instruments,after.instruments))return '調整尺規工具';
 const fields=Object.keys({...a,...b}).filter(k=>!same(a[k],b[k]));
 return fields.length?'修改設定（'+fields.map(k=>({unit:'地圖單位',format:'座標格式',basemap:'底圖',grid:'網格',color:'標繪顏色',selectedRoutes:'航路',referenceVisibility:'參考圖層'}[k]||k)).join('、')+'）':'修訂專案';
}
