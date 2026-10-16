/* 网页原型：全部 mock 数据，无外部依赖。产品名「Assistant」为占位代号。 */
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var Q=new URLSearchParams(location.search);
var ASSIST=[
 {id:'product',name:'产品助手',color:'#FF6B4A',av:'assets/avatars/product.svg',role:'需求、PRD、验收'},
 {id:'dev',name:'开发助手',color:'#8B5CF6',av:'assets/avatars/dev.svg',role:'原型、代码、测试'},
 {id:'art',name:'美术助手',color:'#F59E0B',av:'assets/avatars/art.svg',role:'界面、图标、立绘'},
 {id:'pm',name:'项目经理',color:'#14B8A6',av:'assets/avatars/pm.svg',role:'进度、看板、催办'}];
var EXTRA_COLORS=['#3B82F6','#EC4899','#10B981','#64748B'];
var CAPS=[{k:'read',n:'读取文件'},{k:'write',n:'写入/修改文件'},{k:'del',n:'删除文件',noAuto:'删除不可撤销风险高，最高只能「需审批」'},
 {k:'send',n:'对外发送（邮件/消息）',noAuto:'对外发送无法撤回，最高只能「需审批」'},{k:'exec',n:'在本机执行命令',noAuto:'本机命令影响面不可控，最高只能「需审批」'}];
var TIERS=['只读','需审批','自动'];
var S={theme:Q.get('theme')||'light',chats:{},group:[],cards:{},seq:1,locked:{},
 perm:{},validity:'24 小时',dirs:['~/Projects/demo','~/Documents/方案'],
 tasks:[
  {id:1,name:'每天 9:00 汇总进度',who:'pm',cron:'每天 09:00',next:'明天 09:00',on:true,st:'正常'},
  {id:2,name:'每周一生成迭代周报',who:'product',cron:'每周一 10:00',next:'10月19日 10:00',on:true,st:'正常'},
  {id:3,name:'每晚清理 assets 临时文件',who:'dev',cron:'每天 23:30',next:'—',on:true,st:'等待审批',card:null},
  {id:4,name:'每周五导出切图包',who:'art',cron:'每周五 18:00',next:'—',on:false,st:'已停用'}]};
ASSIST.forEach(function(a){S.perm[a.id]={read:'自动',write:a.id==='dev'?'自动':'需审批',del:'需审批',send:a.id==='pm'?'需审批':'只读',exec:a.id==='dev'?'需审批':'只读'}});
function A(id){for(var i=0;i<ASSIST.length;i++)if(ASSIST[i].id===id)return ASSIST[i]}
function av(a,big){return a.av?'<img class="av'+(big?' big':'')+'" src="'+a.av+'" alt="">':'<span class="av'+(big?' big':'')+'" style="background:'+a.color+';display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:600">'+esc(a.name[0])+'</span>'}
var ICON={
 people:'<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.6c2.6.2 4.5 2.1 4.5 4.9"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
 doc:'<path d="M6.5 3h8l4 4v14h-12z"/><path d="M14.5 3v4h4M9 12h6M9 15.5h6"/>',
 moon:'<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>'};
function ic(n){return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+ICON[n]+'</svg>'}
function pending(f){return Object.keys(S.cards).filter(function(k){var c=S.cards[k];return c.state==='pending'&&(!f||f(c))}).length}
function tierOf(id){var p=S.perm[id],r='只读';['write','del','send','exec'].forEach(function(k){if(p[k]==='自动')r='自动';else if(p[k]==='需审批'&&r!=='自动')r='需审批'});return r}
function applyTheme(){document.documentElement.setAttribute('data-theme',S.theme)}

/* ---------- 审批卡 ---------- */
function newCard(o){var c={id:'c'+(S.seq++),state:'pending',created:'今天 '+new Date().toTimeString().slice(0,5)};for(var k in o)c[k]=o[k];S.cards[c.id]=c;return c.id}
var STATE={pending:['待审批','t-pending'],approved:['已批准','t-ok'],rejected:['已拒绝','t-rej'],expired:['已过期','t-grey'],other:['已在别的设备处理','t-grey']};
function cardHTML(id){var c=S.cards[id],a=A(c.who)||ASSIST[0],st=STATE[c.state],grey=(c.state==='expired'||c.state==='other');
 var h='<div class="card'+(grey?' grey':'')+'" style="--c:'+a.color+'" data-card="'+id+'"><h4><span>'+(c.danger?'⚠️ ':'')+'需要审批 · '+esc(c.op)+' <span class="sub">'+esc(a.name)+'</span></span><span class="tag '+st[1]+'">'+st[0]+'</span></h4>';
 if(grey)h+='<div class="sub">'+(c.state==='expired'?'超过有效期（'+S.validity+'）已自动失效，操作未执行。':'已在「我的 MacBook Pro」上处理（批准），此处只读。')+' 卡片已收起。</div>';
 h+='<div class="body"><div class="kv">';c.params.forEach(function(p){h+='<div class="k">'+esc(p[0])+'</div><div>'+esc(p[1])+'</div>'});h+='</div>';
 if(c.danger&&c.state==='pending')h+='<div class="warn">危险操作：不可撤销。批准仅对本次生效，'+S.validity+'后过期。</div>';
 if(c.state==='pending')h+='<div class="acts"><button data-act="reject">拒绝</button><button class="'+(c.danger?'amber':'pri')+'" data-act="approve">批准</button></div>';
 if(c.state==='approved')h+='<div class="bar t-ok">✓ 已批准，'+esc(c.doneText||'操作已执行（mock）')+'。可在审计日志中撤销/查看。</div>';
 if(c.state==='rejected')h+='<div class="bar t-rej">✕ 已拒绝 · 此操作已加锁：助手换说法或换工具也无法再执行。</div>';
 h+='</div></div>';
 h+='<div class="demo" data-card="'+id+'">演示控制：';['pending','approved','rejected','expired','other'].forEach(function(s){h+='<button data-demo="'+s+'"'+(c.state===s?' disabled':'')+'>'+STATE[s][0]+'</button>'});return h+'</div>'}
document.addEventListener('click',function(e){
 var b=e.target.closest('[data-act],[data-demo]');if(!b)return;var id=b.closest('[data-card]').getAttribute('data-card'),c=S.cards[id];
 var ns=b.getAttribute('data-demo')||(b.getAttribute('data-act')==='approve'?'approved':'rejected');setCard(id,ns,!b.getAttribute('data-demo'));});
function setCard(id,ns,real){var c=S.cards[id];c.state=ns;
 if(ns==='rejected')S.locked[c.lockKey]=true;
 if(c.task){var t=S.tasks.filter(function(x){return x.id===c.task})[0];if(ns==='approved'){t.st='正常';t.next='今天 23:30';}else if(ns==='pending'){t.st='等待审批';t.next='—'}else{t.st='已跳过本次';t.next='明天 23:30'}}
 if(real&&c.thread){var who=c.who;if(ns==='approved')push(c.thread,who,'已执行：'+c.op+'（mock）。如需恢复可在审计日志里撤销。');
  else push(c.thread,who,'收到，已取消「'+c.op+'」，并加锁：我不会换工具或换说法再执行。')}
 render()}

/* ---------- 消息与脚本回复 ---------- */
function thread(t){if(t==='group')return S.group;return S.chats[t]||(S.chats[t]=[])}
function push(t,who,text,opt){var m={who:who,text:'',full:text,err:opt&&opt.err};thread(t).push(m);stream(m);render();return m}
function stream(m){if(Q.get('nostream')){m.text=m.full;return}m.streaming=true;var i=0;var iv=setInterval(function(){i+=3;m.text=m.full.slice(0,i);if(i>=m.full.length){clearInterval(iv);m.streaming=false}renderFlow()},30)}
var SCRIPTS={product:'好的，我先按 RICE 给这几条需求排个序，草稿写进 PRD 第 3 节，写完通知你。',dev:'收到，我先在原型里搭好页面骨架，mock 数据先跑通流程，再对齐细化稿。',art:'收到，按 A 风格出图，助手专属色用 C，深色参考 B，做完发对比图。',pm:'收到，已记到看板，截止时间定在本周五，我会按天跟进。'};
function reply(t,who,text){
 var lk=t+':del';
 if(/出错|报错|错误/.test(text)){push(t,who,'调用中台失败（mock：HTTP 503 模型服务暂不可用）。',{err:true});return}
 if(/删/.test(text)){if(S.locked[lk]){push(t,who,'这个删除操作你已经拒绝过，已加锁。我不会换个工具或换种说法再去删；如需删除请到设置里解锁后重新发起。');return}
  push(t,who,'我找到了 1 个可能是未使用的演示视频，删除前需要你批准：');
  thread(t).push({card:newCard({who:who,thread:t,op:'删除文件',danger:true,lockKey:lk,params:[['操作','删除文件（移到废纸篓不可用，直接删除）'],['路径','/Users/demo/Projects/demo/assets/archive/old-demo.mp4'],['大小','1.2 GB'],['可撤销','否']]})});render();return}
 if(/发|邮件/.test(text)){push(t,who,'邮件草稿写好了，发出前需要你批准：');
  thread(t).push({card:newCard({who:who,thread:t,op:'对外发送邮件',danger:true,lockKey:t+':send',params:[['操作','发送邮件'],['收件人','zhang.wei@example.com'],['抄送','me@example.com'],['主题','第一阶段素材交付'],['附件','act1_assets.zip（48 MB）']]})});render();return}
 push(t,who,SCRIPTS[who]||'收到（mock 回复）。')}
function send(t,text){if(!text.trim())return;thread(t).push({who:'me',text:text,full:text});render();
 if(t==='group'){var targets=ASSIST.filter(function(a){return text.indexOf('@'+a.name)>=0});
  if(!targets.length){targets=[A('pm')];setTimeout(function(){push('group','pm','没有指定人，我来分派：这件事交给 @开发助手。其他人这次不用发言。');setTimeout(function(){reply('group','dev',text)},900)},400);return}
  targets.forEach(function(a,i){setTimeout(function(){reply('group',a.id,text)},500+i*1400)})}
 else setTimeout(function(){reply(t,t,text)},400)}
function seed(){
 S.chats.product=[{who:'me',text:'帮我清理 assets 目录里过期的演示视频。',full:''},{who:'product',text:'我找到了 1 个可能是未使用的演示视频，删除前需要你批准：',full:''}];
 S.chats.product.push({card:newCard({who:'product',thread:'product',op:'删除文件',danger:true,lockKey:'product:del',params:[['操作','删除文件'],['路径','/Users/demo/Projects/demo/assets/archive/old-demo.mp4'],['大小','1.2 GB'],['可撤销','否']]})});
 S.group=[{who:'me',text:'@开发助手 把原型构建一下，@美术助手 换上新图标。',full:''},{who:'dev',text:'构建要在本机执行命令，需要批准：',full:''}];
 S.group.push({card:newCard({who:'dev',thread:'group',op:'在本机执行命令',danger:true,lockKey:'group:exec',params:[['操作','执行命令'],['命令','npm run build'],['工作目录','~/Projects/demo/prototype'],['预计耗时','约 20 秒']]})});
 S.group.push({who:'art',text:'新图标已放到 assets/icon/，写在授权目录内，按设置是「需审批」，审批卡已发到我的单聊。',full:''});
 S.tasks[2].card=newCard({who:'dev',task:3,op:'删除临时文件',danger:true,lockKey:'task:3',params:[['操作','删除 37 个临时文件（定时任务，中台托管）'],['路径','~/Projects/demo/assets/tmp/*.psd.tmp'],['总大小','860 MB'],['任务','每晚清理 assets 临时文件 · 10月15日 23:30 触发'],['状态','中台已暂停于断点，批准后续跑']]});
 for(var k in S.chats)S.chats[k].forEach(function(m){if(m.full==='')m.full=m.text});S.group.forEach(function(m){if(m.full==='')m.full=m.text})}

/* ---------- 渲染 ---------- */
function route(){return (location.hash||'#chat/product').slice(1).split('/')}
function renderSide(){var r=route(),h='<div class="brand"><img src="assets/icon/appicon_placeholder_64.png" alt="">Assistant <span class="ph">代号·占位</span></div>';
 h+='<div class="sec"><span>助手</span><a href="#assistants" style="color:var(--blue);text-decoration:none">管理</a></div>';
 ASSIST.forEach(function(a){h+='<div class="item'+(r[0]==='chat'&&r[1]===a.id?' on':'')+'" style="border-left-color:'+a.color+'" data-go="#chat/'+a.id+'">'+av(a)+'<span class="grow">'+esc(a.name)+'</span></div>'});
 var pend=pending();
 h+='<div class="sec">群聊</div><div class="item'+(r[0]==='group'?' on':'')+'" data-go="#group"><img class="av" src="assets/avatars/group_128.png" alt=""><span class="grow">产品迭代（4 位助手）</span></div>';
 h+='<div class="sec">工作台</div>';
 var tp=pending(function(c){return c.task});[['#assistants','people','助手列表','assistants'],['#tasks','clock','定时任务','tasks'],['#settings','gear','设置与权限','settings'],['#notes','doc','原型说明','notes']].forEach(function(x){h+='<div class="item'+(r[0]===x[3]?' on':'')+'" data-go="'+x[0]+'">'+ic(x[1])+'<span class="grow">'+x[2]+'</span>'+(x[3]==='tasks'&&tp?'<span class="tag t-pending" id="taskBadge">'+tp+' 待审批</span>':'')+'</div>'});
 h+='<div class="foot"><div class="item" style="cursor:default"><img class="av" src="assets/avatars/user.svg" alt=""><span class="grow">当前用户<div class="sub" id="userPend">'+(pend?'待审批 '+pend+' 项':'无待审批')+'</div></span></div>';
 h+='<button id="theme" style="width:100%">'+(S.theme==='dark'?ic('sun')+' 切换浅色':ic('moon')+' 切换深色')+'</button></div>';
 $('#side').innerHTML=h}
function msgHTML(m){if(m.card)return cardHTML(m.card);if(m.who==='me')return '<div class="msg me"><div class="bub">'+esc(m.text)+'</div></div>';
 var a=A(m.who)||{name:'?',color:'#888'};
 return '<div class="msg">'+av(a)+'<div><div class="who" style="color:'+a.color+'">'+esc(a.name)+'</div><div class="bub'+(m.err?' err':'')+(m.streaming?' cursor':'')+'" style="--c:'+a.color+'">'+esc(m.text)+(m.err&&!m.streaming?'\n<button data-retry="1">重试</button>':'')+'</div></div></div>'}
function renderFlow(){var f=$('#flow');if(!f)return;var t=route()[0]==='group'?'group':route()[1];f.innerHTML=thread(t).map(msgHTML).join('');f.scrollTop=f.scrollHeight}
function chatPage(t){var isG=t==='group',a=isG?null:A(t);if(!isG&&!a){location.hash='#assistants';return ''}
 var h='<div class="hd">'+(isG?'<img class="av" src="assets/avatars/group_128.png">':'<span class="dot" style="background:'+a.color+'"></span>')+'<div><h2>'+(isG?'产品迭代':esc(a.name))+'</h2><div class="sub">'+(isG?ASSIST.map(function(x){return '<span style="color:'+x.color+'">● '+x.name+'</span>'}).join('  '):'在线 · '+esc(a.role))+'</div></div><span class="grow"></span><button id="five">审批卡五态演示</button></div>';
 h+='<div class="flow" id="flow"></div><div class="composer"><div class="chips">';
 var sug=isG?['@产品助手 @美术助手 确认下图标方向','把发布说明整理好（不@人）','@开发助手 删掉旧的演示视频']:['帮我删除旧的演示视频','把素材包发邮件给合作方','模拟一次出错','今天进度怎么样？'];
 sug.forEach(function(s){h+='<button class="chip" data-sug="'+esc(s)+'">'+esc(s)+'</button>'});
 return h+'</div><div style="display:flex;gap:8px;width:100%"><input id="inp" placeholder="'+(isG?'输入消息，用 @名字 指派…':'输入消息…')+'"><button class="pri" id="snd">发送</button></div></div>'}
function assistantsPage(){var h='<div class="hd"><h2>助手</h2><span class="grow"></span><label class="sub" style="margin-right:10px"><input type="checkbox" id="devT"'+(S.dev?' checked':'')+'> 开发者信息</label><button class="pri" id="newA">＋ 新建助手</button></div><div class="page"><div class="grid">';
 var TT={'只读':'t-grey','需审批':'t-pending','自动':'t-ok'};
 ASSIST.forEach(function(a){var n=S.tasks.filter(function(t){return t.who===a.id}).length,tr=tierOf(a.id),pa=pending(function(c){return c.who===a.id});
  h+='<div class="acard" style="--c:'+a.color+'"><div style="display:flex;gap:10px;align-items:center">'+av(a,1)+'<div class="grow"><b>'+esc(a.name)+'</b><div class="sub">'+esc(a.role)+'</div></div><span class="tag '+TT[tr]+'" title="最高可用档位">'+tr+'</span></div>'+
  '<div class="sub" style="display:flex;justify-content:space-between;margin:10px 0"><span><span style="color:'+a.color+'">●</span> 在线 · '+(pa?pa+' 项待审批':'空闲')+'</span><span>'+ic('clock')+' 定时任务 · '+n+'</span></div>'+
  (S.dev?'<div class="sub" style="margin-bottom:8px">[dev] 专属色 '+a.color+'</div>':'')+
  '<div class="chips"><button data-go="#chat/'+a.id+'">'+ic('chat')+' 对话</button><button data-goset="'+a.id+'">'+ic('gear')+' 设置</button><button data-ren="'+a.id+'">重命名</button><button data-del="'+a.id+'" style="color:var(--reject)">删除</button></div></div>'});
 h+='</div><h3 style="margin:22px 0 10px;font-size:16px">群聊</h3><div class="acard" style="--c:var(--blue);display:flex;align-items:center;gap:12px;cursor:pointer" data-go="#group"><img class="av big" src="assets/avatars/group_128.png" alt=""><div class="grow"><b>产品迭代</b> <span class="sub">'+ic('people')+' '+ASSIST.length+'</span><div class="sub">产品团队日常迭代讨论与决策 · '+(pending(function(c){return c.thread==='group'})?pending(function(c){return c.thread==='group'})+' 项待审批':'无待审批')+'</div></div>'+ASSIST.map(function(a){return av(a)}).join('')+'<span class="sub">'+ASSIST.length+' 成员</span></div>';
 return h+'</div>'}
function tasksPage(){var h='<div class="hd"><h2>定时任务</h2><span class="sub">中台托管执行（假设）· 遇到需审批操作暂停于断点</span></div><div class="page"><table><tr><th>任务</th><th>负责助手</th><th>周期</th><th>下次执行</th><th>状态</th><th>启用</th></tr>';
 S.tasks.forEach(function(t){var a=A(t.who);var tg=t.st==='等待审批'?'t-pending':t.st==='正常'?'t-ok':t.st==='已停用'?'t-grey':'t-rej';
  h+='<tr><td><b>'+esc(t.name)+'</b></td><td><span style="color:'+a.color+'">● '+a.name+'</span></td><td>'+t.cron+'</td><td>'+t.next+'</td><td><span class="tag '+tg+'">'+(t.st==='等待审批'?'⏸ 等待审批而暂停':t.st)+'</span></td><td><button class="sw'+(t.on?' on':'')+'" data-tog="'+t.id+'" aria-label="开关"></button></td></tr>'});
 h+='</table>';var p=S.tasks[2];h+='<h3 style="margin:20px 0 8px;font-size:15px">「'+p.name+'」的审批单</h3><div style="display:flex;flex-direction:column;gap:8px">'+cardHTML(p.card)+'</div></div>';return h}
function settingsPage(){var cur=S.setA||'dev',h='<div class="hd"><h2>设置与权限</h2></div><div class="page">';
 h+='<div class="box"><h3>按助手分级权限</h3><div class="chips" style="margin-bottom:12px">';ASSIST.forEach(function(a){h+='<button data-seta="'+a.id+'"'+(a.id===cur?' class="pri"':'')+'><span style="color:'+(a.id===cur?'#fff':a.color)+'">●</span> '+a.name+'</button>'});
 h+='</div><table><tr><th>能力</th><th>档位（只读 / 需审批 / 自动）</th><th>说明</th></tr>';
 CAPS.forEach(function(c){var v=S.perm[cur][c.k];h+='<tr><td>'+c.n+'</td><td><div class="seg">';
  TIERS.forEach(function(t){var lock=c.noAuto&&t==='自动';h+='<button'+(v===t?' class="on"':'')+(lock?' class="lock" disabled title="'+c.noAuto+'"':' data-tier="'+c.k+'|'+t+'"')+'>'+t+(lock?' 🔒':'')+'</button>'});
  h+='</div></td><td class="sub">'+(c.noAuto?'🔒 '+c.noAuto:(c.k==='read'?'仅限授权目录':'授权目录内可撤销'))+'</td></tr>'});
 h+='</table><p class="note">「只读」= 该能力不可用；「需审批」= 每次弹审批卡；「自动」= 直接执行并记审计日志。</p></div>';
 h+='<div class="box"><h3>审批单有效期</h3><select id="valid">'+['1 小时','8 小时','24 小时','72 小时'].map(function(x){return '<option'+(x===S.validity?' selected':'')+'>'+x+'</option>'}).join('')+'</select> <span class="sub">默认 24 小时；每张审批单只能用一次，过期自动失效。</span></div>';
 h+='<div class="box"><h3>授权目录</h3>'+S.dirs.map(function(d,i){return '<div style="display:flex;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)"><span class="grow">📁 '+esc(d)+'</span><button data-rmdir="'+i+'">移除</button></div>'}).join('')+'<div style="margin-top:8px;display:flex;gap:8px"><input id="dir" placeholder="~/新目录"><button id="adddir">添加</button></div></div>';
 h+='<div class="box"><h3>外观</h3><button id="theme2">'+(S.theme==='dark'?'切换到浅色':'切换到深色')+'</button></div></div>';return h}
function notesPage(){return '<div class="hd"><h2>原型说明</h2></div><div class="page"><div class="box note"><ul>'+
 ['全部数据为 mock：没有真实模型、中台、本机文件读写或邮件发送。回复是脚本化的，按关键词触发（删 → 删除审批卡；发/邮件 → 发送审批卡；出错 → 报错与重试）。',
  '产品名「Assistant」是占位代号，候选「同舟」等尚未拍板；图标和头像均为美术占位版。',
  '假设：模型走中台统一接入；定时任务、群聊进 MVP；定时任务由中台托管，遇需审批操作暂停于断点、批准后续跑。',
  '审批卡下方的「演示控制」只为评审演示五种状态，正式产品没有。「已在别的设备处理」的设备名为 mock。',
  '群聊：用 @名字 指派，被点名的助手按顺序回复；不 @ 时由项目经理分派，其他助手不发言。',
  '删除、对外发送、执行命令三项不能设为「自动」（产品安全底线，见 PRD）。',
  '拒绝后同一线程的同类操作加锁，原型中重新提出会被助手拒绝执行。',
  '未覆盖：记忆、撤销/审计日志页面、系统通知、真实流式输出、窗口拖拽等 Mac 原生交互。'].map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></div></div>'}
function render(){applyTheme();renderSide();var r=route(),m=$('#main'),h;
 if(r[0]==='chat'||r[0]==='group'){var t=r[0]==='group'?'group':r[1];if(m.getAttribute('data-p')!==t){m.innerHTML=chatPage(t);m.setAttribute('data-p',t)}var hd=m.querySelector('.hd');renderFlow();return}
 h=r[0]==='assistants'?assistantsPage():r[0]==='tasks'?tasksPage():r[0]==='settings'?settingsPage():notesPage();m.innerHTML=h;m.setAttribute('data-p',r[0])}
function modal(html){$('#modal').innerHTML='<div class="dlg">'+html+'</div>'}
document.addEventListener('click',function(e){var b;
 if((b=e.target.closest('[data-go]'))){location.hash=b.getAttribute('data-go');return}
 if(e.target.id==='theme'||e.target.id==='theme2'){S.theme=S.theme==='dark'?'light':'dark';render();return}
 if((b=e.target.closest('[data-sug]'))){var t=route()[0]==='group'?'group':route()[1];send(t,b.getAttribute('data-sug'));return}
 if(e.target.id==='snd'){var t2=route()[0]==='group'?'group':route()[1];send(t2,$('#inp').value);$('#inp').value='';return}
 if(e.target.closest('[data-retry]')){var t3=route()[1];var th=thread(t3);th.pop();push(t3,t3,'重试成功：中台已恢复，'+(SCRIPTS[t3]||''));return}
 if(e.target.id==='five'){var t4=route()[0]==='group'?'group':route()[1],w=t4==='group'?'dev':t4;['pending','approved','rejected','expired','other'].forEach(function(s,i){var id=newCard({who:w,thread:t4,op:i%2?'对外发送邮件':'删除文件',danger:true,lockKey:'demo'+i,params:i%2?[['操作','发送邮件'],['收件人','zhang.wei@example.com'],['主题','素材交付']]:[['操作','删除文件'],['路径','/Users/demo/Projects/demo/assets/archive/old-demo.mp4'],['大小','1.2 GB']]});S.cards[id].state=s;thread(t4).push({card:id})});render();return}
 if((b=e.target.closest('[data-tog]'))){var tk=S.tasks.filter(function(x){return x.id==b.getAttribute('data-tog')})[0];tk.on=!tk.on;if(tk.st!=='等待审批'){tk.st=tk.on?'正常':'已停用';tk.next=tk.on?'明天 '+tk.cron.slice(-5):'—'}render();return}
 if((b=e.target.closest('[data-goset]'))){S.setA=b.getAttribute('data-goset');location.hash='#settings';return}
 if((b=e.target.closest('[data-seta]'))){S.setA=b.getAttribute('data-seta');render();return}
 if((b=e.target.closest('[data-tier]'))){var p=b.getAttribute('data-tier').split('|');S.perm[S.setA||'dev'][p[0]]=p[1];render();return}
 if((b=e.target.closest('[data-rmdir]'))){S.dirs.splice(+b.getAttribute('data-rmdir'),1);render();return}
 if(e.target.id==='adddir'){var v=$('#dir').value.trim();if(v){S.dirs.push(v);render()}return}
 if(e.target.id==='newA'){modal('<h3>新建助手</h3><input id="nm" placeholder="助手名称" style="width:100%"><div class="acts"><button data-close>取消</button><button class="pri" id="okNew">创建</button></div>');return}
 if(e.target.id==='okNew'){var n=$('#nm').value.trim()||'新助手';var id='a'+S.seq++;ASSIST.push({id:id,name:n,color:EXTRA_COLORS[(ASSIST.length-4)%4],role:'自定义助手'});S.perm[id]={read:'自动',write:'需审批',del:'需审批',send:'只读',exec:'只读'};$('#modal').innerHTML='';render();return}
 if((b=e.target.closest('[data-ren]'))){var a=A(b.getAttribute('data-ren'));modal('<h3>重命名</h3><input id="nm" value="'+esc(a.name)+'" style="width:100%"><div class="acts"><button data-close>取消</button><button class="pri" data-okren="'+a.id+'">保存</button></div>');return}
 if((b=e.target.closest('[data-okren]'))){A(b.getAttribute('data-okren')).name=$('#nm').value.trim()||'未命名';$('#modal').innerHTML='';render();return}
 if((b=e.target.closest('[data-del]'))){var d=A(b.getAttribute('data-del'));modal('<h3>删除「'+esc(d.name)+'」？</h3><p class="sub">该助手的对话与权限设置会一并删除，此操作不可撤销。</p><div class="acts"><button data-close>取消</button><button class="amber" data-okdel="'+d.id+'">确认删除</button></div>');return}
 if((b=e.target.closest('[data-okdel]'))){var di=b.getAttribute('data-okdel');ASSIST.splice(ASSIST.indexOf(A(di)),1);$('#modal').innerHTML='';render();return}
 if(e.target.closest('[data-close]')){$('#modal').innerHTML='';return}
});
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='inp')$('#snd').click()});
document.addEventListener('change',function(e){if(e.target.id==='devT'){S.dev=e.target.checked;render();return}if(e.target.id==='valid'){S.validity=e.target.value;render()}});
window.addEventListener('hashchange',render);
seed();render();
/* 截图/自动化钩子：?run=xxx */
window.__proto={S:S,send:send,setCard:setCard};
})();
