/* Local-first reading archive. No requests, tracking, or account required. */
(() => {
  'use strict';
  const icons = {
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10.5" cy="10.5" r="6.8"/><path d="m16 16 4.7 4.7"/></svg>',
    bookmark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3.5h12v17l-6-4-6 4z"/></svg>',
    moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.7 14.2A9 9 0 0 1 9.8 3.3a9 9 0 1 0 10.9 10.9Z"/></svg>',
    sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1m0-15.6-2.1 2.1M6.3 17.7l-2.1 2.1"/></svg>'
  };
  const people = window.ARCHIVE_PEOPLE;
  const articles = window.ARCHIVE_ARTICLES;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readStorage(key,fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}}
  let rawSaved=readStorage('interview-atlas-saved',[]);
  const saved=new Set(Array.isArray(rawSaved)?rawSaved.filter(id=>articles.some(a=>a.id===id)):[]);
  const freshState=()=>({person:'all',topic:'全部',search:'',view:'all',sort:'featured',format:'all',year:'all',edition:'all',limit:24});
  let state=freshState();
  let toastTimer;
  const profile = id => people.find(p=>p.id===id);
  const belongsTo=(a,id)=>(a.participants||[a.person]).includes(id);
  const topicPatterns={财富:/财富|复利|收入|财务|金钱|投资/,创业:/创业|企业|融资|商业|公司|经营/,个人成长:/成长|学习|技能|职业|生活|决策|幸福|习惯/,内容创作:/写作|创作|内容|表达|故事|品牌/,增长:/增长|营销|销售|获客|落地页|转化|留存/,效率:/效率|生产力|专注|注意力|时间管理|习惯/,加密货币:/加密|比特币|以太坊|区块链|TRON|Web3|NFT/i,科技:/科技|人工智能|未来|太空|火星|Tesla|SpaceX|\bAI\b/i};
  const matchesTopic=(a,topic)=>a.tags.includes(topic)||topicPatterns[topic]?.test([a.title,...a.tags].join(' '));
  const editionOf=a=>a.contentStatus||'deep';
  const editionLabel=a=>editionOf(a)==='brief'&&a.summaryScope==='official-description'?'节目摘要':({deep:'中文精读',reading:'中文导读',brief:'资料简介',reprint:'转载精读'}[editionOf(a)]||'资料简介');
  const formatOf=(a,id=state.person)=>{const role=a.roles?.[id]||(id==='all'||id===a.person?a.role:null);return a.type==='interview'&&role==='host'?'host':a.type||'interview';};
  const matchesFormat=(a,key)=>state.person==='all'&&a.type==='interview'&&['host','interview'].includes(key)?Object.values(a.roles||{}).includes(key==='host'?'host':'guest'):formatOf(a)===key;
  const formatLabel=a=>({interview:'嘉宾访谈',host:'主持对谈',talk:'演讲 / 口述',clip:'访谈片段',essay:'原创文章',collection:'系列合集',summary:'文字总结',lesson:'音频课程',event:'活动与会议',related:'相关报道',version:'来源版本',podcast:'播客资料'}[state.person==='all'&&a.type==='interview'&&['host','interview'].includes(state.format)?state.format:formatOf(a)]||'公开资料');
  const cardPersonLabel=a=>{const ids=state.person!=='all'?[state.person]:a.type==='interview'&&['host','interview'].includes(state.format)?(a.participants||[a.person]).filter(id=>a.roles?.[id]===(state.format==='host'?'host':'guest')):[a.person];return ids.map(id=>profile(id).name+(a.roles?.[id]==='host'?' · 主持':'')).join(' / ');};
  const dateLabel = d => /^\d{4}-\d{2}-\d{2}$/.test(d)?d.slice(0,7).replace('-','.'):d || '日期待核';
  const safeUrl = url => {try{const u=new URL(url);return u.protocol==='https:'?u.href:'#';}catch{return '#';}};
  const cover = (a,p) => p.image;
  function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2300);}
  function saveLocal(){try{localStorage.setItem('interview-atlas-saved',JSON.stringify([...saved]));}catch{notify('浏览器未允许存储，收藏仅在本次访问保留');}}
  function updateSaveCount(){$('savedCount').textContent=saved.size;}
  function toggleSaved(id){if(saved.has(id)){saved.delete(id);notify('已移出收藏');}else{saved.add(id);notify('已加入收藏，可在「我的收藏」查看');}saveLocal();updateSaveCount();renderArticles();window.ArchiveReader?.updateSaved();}
  function setNav(name){document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===name));}
  function renderPeople(){
    $('peopleGrid').innerHTML=people.map(p=>`<button class="person-card ${state.person===p.id?'selected':''}" data-person="${p.id}" aria-label="浏览${esc(p.name)}的访谈" aria-pressed="${state.person===p.id}"><div class="portrait"><img src="${esc(p.image)}" alt="${esc(p.en)}" loading="lazy"></div><strong>${esc(p.name)}</strong><span class="en-name">${esc(p.name===p.en?String(articles.filter(a=>belongsTo(a,p.id)).length).padStart(2,'0')+' 条公开资料':p.en)}</span><span class="person-area">${esc(p.area)}</span><span class="card-arrow" aria-hidden="true">↗</span></button>`).join('');
    $('personFilters').innerHTML=`<button class="filter-person ${state.person==='all'?'active':''}" data-person="all" aria-pressed="${state.person==='all'}"><span>全部人物</span><small>${String(articles.length).padStart(2,'0')}</small></button>`+people.map(p=>`<button class="filter-person ${state.person===p.id?'active':''}" data-person="${p.id}" aria-pressed="${state.person===p.id}"><span>${esc(p.name)}</span><small>${String(articles.filter(a=>belongsTo(a,p.id)).length).padStart(2,'0')}</small></button>`).join('');
  }
  function renderTopics(){
    const tags=['全部','财富','创业','个人成长','内容创作','增长','效率','加密货币','科技'].filter(t=>t==='全部'||articles.some(a=>(state.person==='all'||belongsTo(a,state.person))&&matchesTopic(a,t)));
    $('topicFilters').innerHTML=tags.map(t=>`<button class="topic ${state.topic===t?'active':''}" data-topic="${esc(t)}" aria-pressed="${state.topic===t}">${esc(t)}</button>`).join('');
  }
  function renderHero(){
    const a=articles.find(a=>a.person==='naval')||articles[0],p=profile(a.person);
    $('hero').innerHTML=`<div class="hero-copy"><div class="hero-kicker">编辑精选 · 从这场对话开始</div><h1>${esc(a.heroTitle||a.title).replace('：','：<br>')}</h1><p class="hero-desc">${esc(a.summary)}</p><p class="hero-meta"><strong>${esc(p.en)}</strong> <span> / </span> ${esc(a.source)} <span> / </span> ${esc(dateLabel(a.date))}</p><a class="primary-button" href="#read/${encodeURIComponent(a.id)}">阅读中文精读 <span aria-hidden="true">→</span></a></div>${window.ArchiveCovers.hero(a)}`;
  }
  function getFiltered(){
    const words=state.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const result=articles.filter(a=>{
      const p=profile(a.person);
      const text=[a.title,a.originalTitle,a.summary,a.source,a.series,a.guestName,a.provenance,p.name,p.en,...a.tags,...a.points,...(window.ARCHIVE_LONGREADS?.[a.id]?.sections.flatMap(s=>s.paragraphs)||[])].join(' ').toLocaleLowerCase();
      return (state.person==='all'||belongsTo(a,state.person))&&(state.topic==='全部'||matchesTopic(a,state.topic))&&(state.view!=='saved'||saved.has(a.id))&&(state.format==='all'||matchesFormat(a,state.format))&&(state.year==='all'||(a.date||'').slice(0,4)===state.year)&&(state.edition==='all'||editionOf(a)===state.edition)&&words.every(w=>text.includes(w));
    });
    if(state.sort==='newest')result.sort((a,b)=>!a.date?(!b.date?0:1):!b.date?-1:b.date.localeCompare(a.date));
    if(state.sort==='oldest')result.sort((a,b)=>!a.date?(!b.date?0:1):!b.date?-1:a.date.localeCompare(b.date));
    if(state.sort==='episode'){const numbered=a=>a.episodeNumber!==undefined&&a.episodeNumber!==null&&a.episodeNumber!==''&&Number.isFinite(Number(a.episodeNumber));result.sort((a,b)=>numbered(a)&&numbered(b)?(a.series||'').localeCompare(b.series||'')||Number(a.episodeNumber)-Number(b.episodeNumber):numbered(a)?-1:numbered(b)?1:0);}
    return result;
  }
  function renderArticles(){
    const result=getFiltered();
    $('articleGrid').innerHTML=result.slice(0,state.limit).map(a=>{
      const p=profile(a.person),isSaved=saved.has(a.id),index=articles.indexOf(a)+1;
      return `<article class="article-card">${window.ArchiveCovers.card(a,index,formatLabel(a))}<div class="article-meta"><span class="article-person">${esc(cardPersonLabel(a))}</span><span class="dot">/</span><time datetime="${esc(a.date||'')}">${esc(dateLabel(a.date))}</time><span class="dot">/</span><span>${esc(a.source)}</span></div><button class="save-button ${isSaved?'saved':''}" data-save="${esc(a.id)}" aria-label="${isSaved?'取消收藏':'收藏'}：${esc(a.title)}" aria-pressed="${isSaved}">${icons.bookmark}</button><h3 class="article-title"><a href="#read/${encodeURIComponent(a.id)}">${esc(a.title)}</a></h3><p class="article-summary">${esc(a.summary)}</p><div class="article-bottom"><span class="content-badge">${editionLabel(a)}</span><span class="article-tags">${a.tags.map(t=>esc(t)).join(' · ')}</span><a class="read-button" href="#read/${encodeURIComponent(a.id)}">${editionOf(a)==='brief'?(a.summaryScope==='official-description'?'阅读摘要':'查看简介'):editionOf(a)==='reprint'?'阅读精读':editionOf(a)==='deep'?'阅读精读':'阅读导读'} <span aria-hidden="true">→</span></a></div></article>`;
    }).join('');
    $('emptyState').hidden=result.length>0;
    $('loadMore').hidden=result.length<=state.limit;
    $('loadMore').textContent=`继续加载 · 还有 ${Math.max(0,result.length-state.limit)} 条`;
    $('shownCount').textContent=result.length?`已显示 ${Math.min(state.limit,result.length)} / ${result.length} 条`:'';
    $('libraryEnd').hidden=result.length===0;
    const label=state.view==='saved'?'我的收藏':state.person==='all'?'全部资料':profile(state.person).name+'的资料';
    $('resultLabel').textContent=label;
    $('resultCount').textContent=`/ ${String(result.length).padStart(2,'0')} 条`;
    $('archiveTitle').textContent=state.view==='saved'?'我的收藏':'访谈档案';
    $('clearFilters').hidden=state.person==='all'&&state.topic==='全部'&&!state.search&&state.view!=='saved'&&state.format==='all'&&state.year==='all'&&state.edition==='all';
    $('profileBanner').hidden=state.person==='all';
    if(state.person!=='all'){
      const p=profile(state.person);
      const list=articles.filter(a=>belongsTo(a,p.id));
      const counts=['interview','host','talk','clip','essay','collection','summary','lesson','event','related','version','podcast'].map(type=>({type,count:list.filter(a=>formatOf(a,p.id)===type).length})).filter(item=>item.count);
      const names={interview:'嘉宾访谈',host:'主持对谈',talk:'演讲·口述',clip:'片段',essay:'文章',collection:'合集',summary:'文字总结',lesson:'音频课程',event:'活动会议',related:'相关报道',version:'来源版本',podcast:'播客资料'};
      const countText=counts.map(item=>names[item.type]+' '+item.count).join(' · ');
      $('profileBanner').innerHTML=`<h3>${esc(p.name)} <span class="original-title">${esc(p.en)}</span></h3><p>${esc(p.bio)}</p><span class="profile-counts">已收录 ${list.length} 条 · ${esc(countText)}</span>`;
    }
  }
  function choosePerson(id){state.person=id;state.view='all';state.topic='全部';state.search='';state.limit=24;state.format='all';state.year='all';state.edition='all';$('searchInput').value='';syncSelects();renderAll();setNav('archive');if(location.hash!=='#archive')location.hash='archive';else $('archive').scrollIntoView({behavior:'smooth'});}
  function renderAll(){renderPeople();renderTopics();renderArticles();}
  function syncSelects(){['sort','format','year','edition'].forEach(key=>$(key==='sort'?'sortSelect':key+'Filter').value=state[key]);}
  function resetFilters(){state=freshState();$('searchInput').value='';syncSelects();renderAll();setNav('archive');}
  function openReader(id){
    if(!articles.some(article=>article.id===id))return;
    location.hash='read/'+encodeURIComponent(id);
  }
  function openAbout(){if(!$('aboutDialog').open)$('aboutDialog').showModal();}
  document.addEventListener('click',event=>{
    const read=event.target.closest('[data-read]');if(read){openReader(read.dataset.read);return;}
    const save=event.target.closest('[data-save]');if(save){toggleSaved(save.dataset.save);return;}
    const person=event.target.closest('[data-person]');if(person){choosePerson(person.dataset.person);return;}
    const topic=event.target.closest('[data-topic]');if(topic){state.topic=topic.dataset.topic;state.limit=24;renderTopics();renderArticles();[...document.querySelectorAll('[data-topic]')].find(button=>button.dataset.topic===state.topic)?.focus({preventScroll:true});return;}
    const nav=event.target.closest('[data-nav]');if(nav){
      const view=nav.dataset.nav;setNav(view);
      if(view==='archive')resetFilters();
      if(view==='saved'){resetFilters();state.view='saved';renderArticles();setNav('saved');requestAnimationFrame(()=>$('archive').scrollIntoView({behavior:'smooth'}));}
      else if(state.view==='saved'){state.view='all';renderArticles();setNav(view);}
    }
  });
  document.addEventListener('error',event=>{
    const image=event.target;
    if(image.tagName==='IMG'&&image.hasAttribute('data-cover-image')){image.parentElement.classList.add('cover-failed');image.parentElement.classList.remove('cover-photo');image.remove();return;}
    if(image.tagName==='IMG'&&image.dataset.fallback&&image.getAttribute('src')!==image.dataset.fallback){image.src=image.dataset.fallback;delete image.dataset.fallback;}
  },true);
  $('searchIcon').innerHTML=icons.search;
  $('searchInput').addEventListener('input',event=>{state.search=event.target.value;state.limit=24;renderArticles();});
  $('sortSelect').addEventListener('change',event=>{state.sort=event.target.value;state.limit=24;renderArticles();});
  ['format','year','edition'].forEach(key=>$(key+'Filter').addEventListener('change',event=>{state[key]=event.target.value;state.limit=24;renderArticles();}));
  $('loadMore').addEventListener('click',()=>{state.limit+=24;renderArticles();});
  const years=[...new Set(articles.map(a=>(a.date||'').slice(0,4)).filter(year=>/^\d{4}$/.test(year)))].sort().reverse();
  $('yearFilter').innerHTML='<option value="all">全部年份</option>'+years.map(year=>`<option value="${year}">${year} 年</option>`).join('');
  $('clearFilters').addEventListener('click',resetFilters);$('emptyReset').addEventListener('click',resetFilters);
  $('randomButton').addEventListener('click',()=>{const pool=getFiltered();if(!pool.length){notify('当前筛选下没有访谈，请先清除筛选');return;}openReader(pool[Math.floor(Math.random()*pool.length)].id);});
  $('closeAbout').addEventListener('click',()=>$('aboutDialog').close());
  ['aboutButton','footerAbout'].forEach(id=>$(id).addEventListener('click',openAbout));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
  function setTheme(dark){document.body.classList.toggle('dark',dark);$('themeButton').innerHTML=dark?icons.sun:icons.moon;$('themeButton').setAttribute('aria-label',dark?'切换浅色模式':'切换深色模式');try{localStorage.setItem('interview-atlas-theme',JSON.stringify(dark));}catch{}}
  setTheme(readStorage('interview-atlas-theme',false)===true);
  $('themeButton').addEventListener('click',()=>setTheme(!document.body.classList.contains('dark')));
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!document.body.classList.contains('reading-mode')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){event.preventDefault();$('searchInput').focus();$('archive').scrollIntoView({behavior:'smooth'});}});
  $('today').textContent=new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long',timeZone:'Asia/Shanghai'}).format(new Date());
  window.ArchiveReader.init({people,articles,isSaved:id=>saved.has(id),toggleSaved});
  window.ArchiveCatalog.init({people,articles});
  renderHero();renderAll();updateSaveCount();
  function applyHashRoute(){
    const match=location.hash.match(/^#read\/(.+)$/);
    if(match){
      let id;try{id=decodeURIComponent(match[1]);}catch{id='';}
      if(window.ArchiveReader.open(id))return;
      notify('未找到这篇文章');location.hash='archive';return;
    }
    const wasReading=document.body.classList.contains('reading-mode');
    window.ArchiveReader.close();
    if(wasReading)requestAnimationFrame(()=>$(location.hash==='#people'?'people':location.hash==='#home'?'home':location.hash==='#coverage'?'coverage':'archive').scrollIntoView({behavior:'instant'}));
    if(location.hash==='#saved'){
      if(state.view!=='saved')resetFilters();
      state.view='saved';renderArticles();setNav('saved');requestAnimationFrame(()=>$('archive').scrollIntoView());
    }else{
      if(state.view==='saved'){state.view='all';renderArticles();}
      setNav(location.hash==='#people'?'people':location.hash==='#archive'?'archive':location.hash==='#coverage'?'coverage':'home');
    }
  }
  window.addEventListener('hashchange',applyHashRoute);
  applyHashRoute();
})();
