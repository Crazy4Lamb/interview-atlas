/* Self-contained reading pages, kept in this document for file:// compatibility. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let config, current, observer, lastTitle=document.title, pendingScroll=false, wideLayout;
  function date(d){return /^\d{4}-\d{2}-\d{2}$/.test(d)?`${d.slice(0,4)} 年 ${Number(d.slice(5,7))} 月 ${Number(d.slice(8,10))} 日`:d||'日期待核';}
  function paragraphs(value){return (Array.isArray(value)?value:[value]).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');}
  const cleanHeading=text=>String(text).replace(/^(?:访谈要点|演讲要点|编辑分析)[｜|：:]\s*/, '');
  function safeUrl(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:'#';}catch{return '#';}}
  function refreshProgress(){
    pendingScroll=false;if(!current)return;
    const body=$('readingBody'),start=body.offsetTop,end=body.offsetTop+body.offsetHeight-window.innerHeight*.65;
    const atBottom=window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-2;
    const value=atBottom?100:Math.min(100,Math.max(0,Math.round((window.scrollY-start)/Math.max(1,end-start)*100)));
    $('readingProgress').style.width=value+'%';
    $('readingPercent').textContent=value+'%';
  }
  function updateSaved(){
    if(!current)return;
    const saved=config.isSaved(current.id),button=$('readingSave');
    button.textContent=saved?'已收藏 ✓':'收藏本文 +';button.setAttribute('aria-pressed',String(saved));
  }
  function init(options){
    config=options;
    $('readingPage').addEventListener('click',event=>{
      const jump=event.target.closest('[data-section]');if(jump){$(jump.dataset.section)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
      if(event.target.closest('#readingSave')){config.toggleSaved(current.id);updateSaved();return;}
      if(event.target.closest('#readingFont')){
        const large=document.body.classList.toggle('large-reading-text');
        $('readingFont').setAttribute('aria-pressed',String(large));
        try{localStorage.setItem('interview-atlas-large-text',JSON.stringify(large));}catch{}
      }
    });
    try{document.body.classList.toggle('large-reading-text',JSON.parse(localStorage.getItem('interview-atlas-large-text'))===true);}catch{}
    window.addEventListener('scroll',()=>{if(current&&!pendingScroll){pendingScroll=true;requestAnimationFrame(refreshProgress);}},{passive:true});
    window.addEventListener('resize',()=>{if(current){const wide=window.innerWidth>760;if(wide!==wideLayout){const toc=document.querySelector('.reading-toc');if(toc)toc.open=wide;wideLayout=wide;}refreshProgress();}});
  }
  function open(id){
    const a=config.articles.find(item=>item.id===id),content=window.ARCHIVE_LONGREADS?.[id];
    if(!a||!content)return false;
    current=a;wideLayout=window.innerWidth>760;
    const person=config.people.find(p=>p.id===a.person);
    const sections=content.sections.map(section=>({...section,heading:cleanHeading(section.heading)}));
    const practice=(Array.isArray(content.practice)?content.practice:[content.practice]).filter(Boolean);
    const edition=a.contentStatus||'deep';
    const editionTitle={deep:'中文精读',reading:'中文导读',brief:'资料简介'}[edition]||'资料简介';
    const editorialNote=edition==='brief'?'本页整理已核实的发布信息与内容线索，尚未制作完整中文精读。':'依据公开资料整理；来源梳理与编辑分析分别标注，非逐字稿或完整翻译。';
    const materialLabel=a.type==='interview'&&(a.roles?.[a.person]||a.role)==='host'?'主持对谈':{interview:'嘉宾访谈',talk:'演讲 / 口述',essay:'原创文章',collection:'系列合集',summary:'文字总结',lesson:'音频课程',clip:'访谈片段'}[a.type]||'公开资料';
    const context=[materialLabel,a.type==='summary'&&a.author?'整理作者：'+a.author:'',a.series,a.episodeNumber?'第 '+a.episodeNumber+' 期':'',a.provenance,a.dateNote].filter(Boolean).join(' · ');
    const sourceLabel=a.type==='essay'?'文章梳理':a.type==='summary'?'文字总结梳理':a.type==='lesson'?'课程梳理':a.type==='talk'?'演讲梳理':edition==='brief'?'资料线索':'访谈梳理';
    const bodyText=sections.flatMap(s=>s.paragraphs).join('')+practice.join('')+content.takeaway;
    const charCount=bodyText.replace(/\s/g,'').length;
    const links=content.references?.length?content.references:[{title:a.source,url:a.url}];
    const toc=[...sections.map((s,i)=>({id:`reading-section-${i}`,title:s.heading})),...(practice.length?[{id:'reading-practice',title:'把思考带回日常'}]:[])];
    const readingPool=a.type==='lesson'&&a.series?config.articles.filter(item=>item.type==='lesson'&&item.series===a.series).sort((x,y)=>x.episodeNumber-y.episodeNumber):config.articles;
    const index=readingPool.findIndex(item=>item.id===a.id),next=readingPool[(index+1)%readingPool.length];
    $('readingPage').innerHTML=`<div class="reading-progress-track" aria-hidden="true"><div id="readingProgress"></div></div><header class="reading-header"><a href="#archive" class="reading-back"><span aria-hidden="true">←</span> 返回访谈档案</a><a class="reading-brand" href="#home">硅谷人物访谈录<span class="brand-dot">.</span></a><div class="reading-controls"><button id="readingFont" aria-label="切换大字号" aria-pressed="${document.body.classList.contains('large-reading-text')}">Aa</button><button id="readingSave" aria-pressed="false"></button></div></header><div class="reading-shell"><div class="reading-hero"><p class="eyebrow accent">THE READING ROOM / ${editionTitle}</p><h1 id="readingTitle" tabindex="-1">${esc(a.title)}</h1><p class="reading-original" lang="en">${esc(a.originalTitle)}</p><div class="reading-meta"><img src="${esc(person.image)}" alt="${esc(person.en)}肖像"><div><strong>${esc(person.name)}</strong><span>${esc(a.source)} · ${esc(date(a.date))}</span></div><span class="reading-duration">${edition==='brief'?'资料简介':'约 '+Math.max(1,Math.ceil(charCount/300))+' 分钟阅读'}</span></div><p class="reading-lead">${esc(a.summary)}</p><p class="reading-context">${esc(context)}</p><p class="reading-editor-note">${esc(editorialNote)}</p></div><div class="reading-layout"><aside class="reading-sidebar"><details class="reading-toc" ${window.innerWidth>760?'open':''}><summary>本文目录 <span aria-hidden="true">＋</span></summary><nav aria-label="文章目录">${toc.map((s,i)=>`<button data-section="${s.id}"><span>${String(i+1).padStart(2,'0')}</span>${esc(s.title)}</button>`).join('')}</nav></details><p class="reading-location">阅读进度 <span id="readingPercent">0%</span></p></aside><article id="readingBody" class="reading-body" aria-labelledby="readingTitle"><div class="reading-takeaway"><span class="eyebrow">读前一句话</span><p>${esc(content.takeaway)}</p></div>${sections.map((s,i)=>`<section class="reading-section" id="reading-section-${i}"><span class="reading-section-label">${s.kind==='analysis'?'编辑分析':s.heading.startsWith('延伸阅读')?'延伸阅读':sourceLabel} / ${String(i+1).padStart(2,'0')}</span><h2>${esc(s.heading)}</h2>${paragraphs(s.paragraphs)}</section>`).join('')}${practice.length?`<section class="reading-section reading-practice" id="reading-practice"><span class="reading-section-label">编辑建议 / PRACTICE</span><h2>把思考带回日常</h2>${paragraphs(practice)}</section>`:``}<div class="reading-endmark" aria-label="正文结束">◆</div><details class="reading-sources"><summary>来源与核对 <span>可选查看 ↗</span></summary><p>${edition==='brief'?'本页为资料简介，以下是已核实的节目发布页与档案入口。':'本页为独立编辑整理；以下链接供核对背景和原始表述，正文可在本站阅读。'}</p>${a.sourceNote?`<p>${esc(a.sourceNote)}</p>`:``}<ol>${links.map(link=>`<li><a href="${esc(safeUrl(link.url))}" target="_blank" rel="noopener noreferrer">${esc(link.title)} ↗</a></li>`).join('')}</ol></details><nav class="reading-next" aria-label="继续阅读"><span class="eyebrow accent">继续阅读</span><a href="#read/${encodeURIComponent(next.id)}">${esc(next.title)} <span aria-hidden="true">→</span></a><a class="reading-all" href="#archive">返回全部访谈</a></nav></article></div></div><footer class="reading-footer"><span>硅谷人物访谈录 · 独立整理，慢慢阅读。</span><a href="#archive">访谈档案 ↑</a></footer>`;
    $('readingPage').setAttribute('aria-label',editionTitle);$('readingPage').hidden=false;document.body.classList.add('reading-mode');
    document.title=a.title+' — 硅谷人物访谈录';updateSaved();
    observer?.disconnect();
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(!visible.length)return;document.querySelectorAll('[data-section]').forEach(button=>{const active=button.dataset.section===visible[0].target.id;button.classList.toggle('current',active);if(active)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');});},{rootMargin:'-15% 0px -55% 0px'});
      document.querySelectorAll('.reading-section').forEach(section=>observer.observe(section));
    }
    window.scrollTo({top:0,behavior:'instant'});$('readingTitle').focus({preventScroll:true});refreshProgress();
    return true;
  }
  function close(){
    if(!current)return;
    current=null;observer?.disconnect();$('readingPage').hidden=true;document.body.classList.remove('reading-mode');document.title=lastTitle;
  }
  window.ArchiveReader={init,open,close,updateSaved};
})();
