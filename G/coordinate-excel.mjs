export const HEADERS=['圖層','物件名稱','點名稱','緯度（度分秒）','經度（度分秒）','緯度（十進位）','經度（十進位）','高度（m）'];

export function inCoordinateBounds(point,bounds){
  if(point[0]<bounds.south||point[0]>bounds.north)return false;
  let east=bounds.east;while(east<bounds.west)east+=360;
  if(east-bounds.west>=360)return true;
  const lng=point[1]+360*Math.round(((bounds.west+east)/2-point[1])/360);
  return lng>=bounds.west&&lng<=east;
}

export function coordinateRows(project,bounds,{pointName,formatLatitude,formatLongitude}){
  const rows=[];
  for(const layer of project.layers){
    if(!layer.visible||(layer.opacity??1)<=0)continue;
    for(const object of layer.objects){
      if(object.visible===false||!object.showCoordinates||(object.opacity??1)<=0)continue;
      object.points.forEach((point,index)=>{
        if(!inCoordinateBounds(point,bounds))return;
        rows.push([layer.name,object.name,pointName(object,index),formatLatitude(point[0]),formatLongitude(point[1]),point[0],point[1],Number.isFinite(point[2])?point[2]:null]);
      });
    }
  }
  return rows;
}

const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';

/** Small offline OOXML writer, using the application's bundled ZIP implementation. */
export function coordinateWorkbookParts(rows){
  const cell=(value,column,row)=>{
    const ref=String.fromCharCode(65+column)+row;
    if(typeof value==='number'&&Number.isFinite(value))return `<c r="${ref}" s="${column===7?3:2}"><v>${value}</v></c>`;
    return `<c r="${ref}" t="inlineStr" s="${row===1?1:0}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  };
  const all=[HEADERS,...rows],last=all.length;
  const sheet=declaration+`<worksheet xmlns="${ns}"><dimension ref="A1:H${last}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="3" width="30" customWidth="1"/><col min="4" max="5" width="25" customWidth="1"/><col min="6" max="7" width="21" customWidth="1"/><col min="8" max="8" width="16" customWidth="1"/></cols><sheetData>`+all.map((values,i)=>`<row r="${i+1}"${i===0?' ht="26" customHeight="1"':''}>${values.map((v,c)=>cell(v,c,i+1)).join('')}</row>`).join('')+`</sheetData><autoFilter ref="A1:H${last}"/></worksheet>`;
  return {
    '[Content_Types].xml':declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels':declaration+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':declaration+`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="顯示座標物件" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels':declaration+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml':declaration+`<styleSheet xmlns="${ns}"><numFmts count="2"><numFmt numFmtId="164" formatCode="0.00000000"/><numFmt numFmtId="165" formatCode="0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF193F50"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    'xl/worksheets/sheet1.xml':sheet
  };
}

export async function coordinateWorkbook(rows,JSZip,report=()=>{}){
  const zip=new JSZip();for(const [path,content] of Object.entries(coordinateWorkbookParts(rows)))zip.file(path,content);
  return zip.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},meta=>report(meta.percent));
}
