const endpoint='https://mps-pairing.trihpii11.workers.dev';
const MAX_LICENSE_BYTES = 5 * 1024 * 1024;
export function parseLicenseText(text) {
  let envelope;
  try { envelope = JSON.parse(text.replace(/^\uFEFF/, '').trim()); }
  catch { throw Error('授權檔無法解析，請選擇原始 .mpslic 或 .json 檔'); }
  if (envelope?.format !== 'MPS-LICENSE-1') throw Error('這不是 MPS 加密授權檔');
  return envelope;
}

export async function readLicenseFile(file) {
  if (file.size > MAX_LICENSE_BYTES) throw Error('授權檔超過 5 MB');
  let bytes;
  try { bytes = new Uint8Array(await file.arrayBuffer()); }
  catch { throw Error('無法讀取授權檔，請確認檔案已下載到裝置'); }
  const encoding = bytes[0] === 255 && bytes[1] === 254 ? 'utf-16le'
    : bytes[0] === 254 && bytes[1] === 255 ? 'utf-16be' : 'utf-8';
  const envelope = parseLicenseText(new TextDecoder(encoding).decode(bytes));
  return {name: file.name, envelope, text: JSON.stringify(envelope)};
}

export async function receiveLicense(code){const normalized=code.replace(/[\s-]/g,'').toUpperCase();if(!/^[A-HJ-NP-Z2-9]{10}$/.test(normalized))throw Error('請輸入 10 碼授權檔配對碼');const response=await fetch(endpoint+'/licenses/'+normalized,{method:'POST',signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error(await response.text());const result=await response.json(),envelope=parseLicenseText(result.text);return{envelope,name:result.name}}
export function setupLicenseSharing({mount,canShare,getProof,getCurrentFile}){if(!canShare())return;const section=document.createElement('details');section.id='license-share-panel';section.innerHTML='<summary>分享授權檔（lince02）</summary><div class="section-body"><label>選擇加密授權檔（選填）<input type="file" accept=".mpslic,.json"></label><p id="license-share-note">未選擇檔案時，分享目前使用的加密授權檔。解鎖密碼不會傳送；接收者仍須輸入密碼。配對碼限用一次，10 分鐘到期。</p><button type="button">產生授權檔配對碼</button><output style="display:block;font:20px monospace"></output><p id="license-share-status" role="status"></p></div>';mount.append(section);const button=section.querySelector('button'),status=section.querySelector('[role=status]');button.onclick=async()=>{button.disabled=true;try{if(!canShare())throw Error('僅 lince02 可分享授權檔');const file=section.querySelector('input').files[0];const {name,text}=file?await readLicenseFile(file):getCurrentFile();status.textContent='傳送中 25%';const response=await fetch(endpoint+'/licenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,text,proof:getProof()}),signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error(await response.text());const result=await response.json();section.querySelector('output').textContent=result.code;status.textContent='100% · 配對碼有效至 '+new Date(result.expiresAt).toLocaleTimeString()}catch(e){status.textContent=e.message}finally{button.disabled=false}}}
