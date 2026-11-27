export function parseCoordinate(value, latitude) {
  const raw=value.trim().toUpperCase();
  if (!raw) throw new Error((latitude?'緯度':'經度')+'不可空白');
  const directions=raw.match(/[NSEW]/g)||[];
  if(directions.length>1 || directions.some(d=>!(latitude?'NS':'EW').includes(d))) throw new Error('座標方向錯誤：緯度用 N/S，經度用 E/W');
  if(directions.length && !/^[NSEW]?[^NSEW]+[NSEW]?$/.test(raw))throw new Error('方向字母須放在開頭或結尾');
  const text=raw.replace(/[NSEW]/g,'').trim();
  if(/[^0-9+\-.\s°º′’'″"度分秒:]/.test(text))throw new Error('座標格式無法辨識');
  const normalized=text.replace(/[°º′’'″"度分秒:]/g,' ').trim();
  const nums=normalized.split(/\s+/);
  if(nums.length>3||nums.some(n=>!/^[-+]?\d+(?:\.\d+)?$/.test(n)))throw new Error('請輸入十進位或度分秒座標');
  const values=nums.map(Number),negative=nums[0].startsWith('-');
  if(values.slice(1).some(v=>v<0||v>=60)||nums.slice(1).some(n=>/^[+-]/.test(n))||values.length>1&&!Number.isInteger(values[0])||values.length>2&&!Number.isInteger(values[1]))throw new Error('度分秒格式錯誤，分與秒須小於 60');
  if(directions.length&&/^[+-]/.test(nums[0]))throw new Error('方向字母與正負號請擇一使用');
  let result=Math.abs(values[0])+(values[1]||0)/60+(values[2]||0)/3600;
  if(result>(latitude?90:180))throw new Error(latitude?'緯度須在 ±90° 內':'經度須在 ±180° 內');
  if(negative||['S','W'].includes(directions[0]))result=-result;
  return result;
}
