// Public OAuth client ID. Codes only control UI visibility in this static build.
const CONFIG = {clientId: '453678468119-o464ltbg6l8d5ofk1vgjiao6p7t1ofe6.apps.googleusercontent.com', userCodes: []};
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const FILE = 'mps-google-workspace.json';

export function connectGoogleWorkspace({mount, capture, restore}) {
  const panel = document.createElement('fieldset');
  panel.innerHTML = '<legend>Google 雲端同步</legend><button type="button">使用 Google 帳戶登入</button><button type="button" hidden>登出</button><p role="status"></p>';
  mount.prepend(panel);
  const [login, logout] = panel.querySelectorAll('button');
  const status = panel.querySelector('[role=status]');
  if (!CONFIG.clientId) {
    login.disabled = true;
    status.textContent = '此分支尚未設定 Google OAuth 用戶端 ID。';
    return () => {};
  }
  let client, token, expiry, remote, lastSynced, timer, busy = false, generation = 0;
  const notify = text => status.textContent = text;
  const call = async (path, options = {}) => {
    if (!token || Date.now() >= expiry) throw Error('Google 登入已到期，請重新登入。');
    const response = await fetch('https://www.googleapis.com/' + path, {
      ...options, headers: {...options.headers, Authorization: 'Bearer ' + token}
    });
    if (!response.ok) throw Error('Google Drive 同步失敗（' + response.status + '）');
    return response.json();
  };
  const list = async () => {
    const params = new URLSearchParams({spaces:'appDataFolder',q:"name = '" + FILE + "' and trashed = false",fields:'files(id,modifiedTime)',orderBy:'modifiedTime desc',pageSize:'1'});
    return (await call('drive/v3/files?' + params)).files[0];
  };
  const sync = async () => {
    if (!token || busy) return;
    busy = true;
    const session = generation;
    try {
      const current = await list();
      if (session !== generation) return;
      const local = JSON.stringify(capture());
      if (current && (!remote || current.modifiedTime !== remote.modifiedTime)) {
        const snapshot = await call('drive/v3/files/' + current.id + '?alt=media');
        if (session !== generation) return;
        if ((lastSynced && local !== lastSynced) ||
            (!lastSynced && JSON.stringify(snapshot) !== local &&
              !confirm('此 Google 帳戶已有工作區。是否先保留本機復原版本，再載入雲端工作區？'))) {
          notify('本機與雲端都有變更，已暫停同步。');
          return;
        }
        await restore(snapshot);
        lastSynced = JSON.stringify(capture());
        remote = current;
      } else if (local !== lastSynced) {
        if(!lastSynced&&!current&&!confirm('此帳戶沒有雲端工作區。將目前工作區存入這個 Google 帳戶？')){
          token=null;logout.hidden=true;notify('已取消 Google Drive 初始化。');return;
        }
        const boundary = 'mps-' + crypto.randomUUID();
        const metadata = remote ? {} : {name:FILE, parents:['appDataFolder']};
        const body = '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+local+'\r\n--'+boundary+'--';
        const saved = await call('upload/drive/v3/files'+(remote?'/'+remote.id:'')+'?uploadType=multipart&fields=id,modifiedTime',{
          method:remote?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body
        });
        if (session !== generation) return;
        remote = saved;
        lastSynced = local;
      }
      notify('已同步至 Google Drive');
    } catch (error) { notify(error.message); }
    finally { busy = false; }
  };
  const schedule = () => { clearTimeout(timer); if (token) timer = setTimeout(sync, 1200); };
  login.disabled = true;
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => {
    client = google.accounts.oauth2.initTokenClient({
      client_id:CONFIG.clientId,scope:SCOPE,
      callback:response => {
        if (!response.access_token) { notify('無法登入 Google'); return; }
        generation++;
        token=response.access_token; expiry=Date.now()+Number(response.expires_in)*1000;
        remote=lastSynced=null; logout.hidden=false; sync();
      },
      error_callback:()=>notify('Google 登入未完成。')
    });
    login.disabled = false;
    if(!sessionStorage.getItem('mps-google-prompted')){
      sessionStorage.setItem('mps-google-prompted','1');
      const section=mount.closest('details');
      if(section)section.open=true;
      notify('登入後可在此帳戶的 Google Drive 同步工作區。');
    }
  };
  script.onerror = () => notify('無法載入 Google 登入。');
  document.head.append(script);
  login.onclick = () => client.requestAccessToken({prompt:'select_account'});
  logout.onclick = () => { generation++; token = remote = lastSynced = null; clearTimeout(timer); logout.hidden=true; notify('已停止雲端同步'); };
  window.addEventListener('focus',sync);
  window.addEventListener('online',sync);
  setInterval(()=>{if(!document.hidden)sync();},60000);
  return schedule;
}

export function validUserCode(code) {
  return CONFIG.userCodes.includes(code.trim());
}

