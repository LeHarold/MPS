using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
class OfflineMPS {
 static TcpListener listener; static string root=AppDomain.CurrentDomain.BaseDirectory; static int port;
 [STAThread] static void Main(string[] args) {
  try { for(port=5278;port<5300;port++){try{listener=new TcpListener(IPAddress.Loopback,port);listener.Start();break;}catch(SocketException){}}
   if(port==5300)throw new Exception("No available local port (5278-5299)");
   Thread thread=new Thread(delegate(){while(true){try{TcpClient c=listener.AcceptTcpClient();ThreadPool.QueueUserWorkItem(delegate(object client){Serve((TcpClient)client);},c);}catch{return;}}});thread.IsBackground=true;thread.Start();
   string url="http://127.0.0.1:"+port+"/";
   if(Array.IndexOf(args,"--no-browser")<0)Process.Start(new ProcessStartInfo(url){UseShellExecute=true});
   NotifyIcon tray=new NotifyIcon();tray.Icon=SystemIcons.Application;tray.Text="MPS offline (local only)";tray.Visible=true;
   ContextMenu menu=new ContextMenu();menu.MenuItems.Add("Open MPS",delegate{Process.Start(new ProcessStartInfo(url){UseShellExecute=true});});menu.MenuItems.Add("Exit MPS",delegate{listener.Stop();tray.Visible=false;Application.Exit();});tray.ContextMenu=menu;tray.DoubleClick+=delegate{Process.Start(new ProcessStartInfo(url){UseShellExecute=true});};Application.Run();tray.Dispose();
  }catch(Exception e){MessageBox.Show(e.Message,"MPS offline");}
 }
 static void Serve(TcpClient c){using(c){try{c.ReceiveTimeout=5000;c.SendTimeout=15000;NetworkStream stream=c.GetStream();StreamReader reader=new StreamReader(stream,Encoding.ASCII,false,8192,true);string first=reader.ReadLine();if(first==null)return;string line;while(!String.IsNullOrEmpty(line=reader.ReadLine())){}string[] parts=first.Split(' ');if(parts.Length<2)return;if(parts[0]!="GET"&&parts[0]!="HEAD"){Reply(stream,405,"text/plain",Encoding.UTF8.GetBytes("Method not allowed"),false);return;}string target=parts[1].Split('?')[0];target=Uri.UnescapeDataString(target).Replace('/',Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);if(target.IndexOf('\0')>=0||target.Contains(":")){Reply(stream,403,"text/plain",new byte[0],false);return;}string path=Path.GetFullPath(Path.Combine(root,target));if(!path.StartsWith(root,StringComparison.OrdinalIgnoreCase)){Reply(stream,403,"text/plain",new byte[0],false);return;}if(Directory.Exists(path))path=Path.Combine(path,"index.html");if(!File.Exists(path)){Reply(stream,404,"text/plain",Encoding.UTF8.GetBytes("Not found"),false);return;}string ext=Path.GetExtension(path).ToLowerInvariant(),mime="application/octet-stream";switch(ext){case ".html":mime="text/html; charset=utf-8";break;case ".js":case ".mjs":mime="text/javascript; charset=utf-8";break;case ".css":mime="text/css; charset=utf-8";break;case ".json":case ".webmanifest":mime="application/json; charset=utf-8";break;case ".svg":mime="image/svg+xml";break;case ".png":mime="image/png";break;case ".jpg":mime="image/jpeg";break;case ".ico":mime="image/x-icon";break;}Reply(stream,200,mime,File.ReadAllBytes(path),parts[0]=="HEAD");}catch{}}}
 static void Reply(NetworkStream s,int status,string mime,byte[] bytes,bool head){byte[] header=Encoding.ASCII.GetBytes("HTTP/1.1 "+status+" "+(status==200?"OK":"Error")+"\r\nContent-Type: "+mime+"\r\nContent-Length: "+bytes.Length+"\r\nCache-Control: no-cache\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\n\r\n");s.Write(header,0,header.Length);if(!head)s.Write(bytes,0,bytes.Length);}
}
