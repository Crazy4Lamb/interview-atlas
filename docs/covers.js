/* Episode artwork, with locally rendered editorial cards for records without artwork. */
(() => {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const symbols={
    wealth:'<path d="M24 114V70m28 44V50m28 64V28m28 86V8"/><path d="m18 48 27-16 26 2 43-25"/><circle cx="114" cy="9" r="5"/>',
    create:'<path d="m28 102 11-30 54-54 20 20-54 54-31 10Z"/><path d="m39 72 20 20M82 29l20 20M28 102l14-5"/><path d="M18 122h104"/>',
    growth:'<path d="M13 22h114L85 67v39l-30 16V67L13 22Z"/><circle cx="35" cy="10" r="4"/><circle cx="103" cy="10" r="4"/><path d="M71 6v9"/>',
    life:'<path d="M70 32c-16-16-38-19-57-10v88c19-9 41-6 57 10 16-16 38-19 57-10V22c-19-9-41-6-57 10Z"/><path d="M70 32v88M26 42c10-3 20-1 30 5m-30 16c10-3 20-1 30 5m-30 16c10-3 20-1 30 5"/>',
    future:'<circle cx="70" cy="70" r="16"/><ellipse cx="70" cy="70" rx="61" ry="25" transform="rotate(-35 70 70)"/><ellipse cx="70" cy="70" rx="61" ry="25" transform="rotate(35 70 70)"/><circle cx="110" cy="28" r="5"/><path d="M70 4v13m0 106v13"/>',
    ideas:'<circle cx="70" cy="47" r="33"/><path d="M45 69c2 10 7 13 9 27h32c2-14 7-17 9-27M55 109h30m-26 13h22M70 1v-1M17 44H5m130 0h-12M28 8l9 10m75-10-9 10"/>'
  };
  const themes={wealth:{zh:'财富与选择',en:'WEALTH & CHOICES'},create:{zh:'创作与表达',en:'CREATE & WRITE'},growth:{zh:'商业与增长',en:'BUSINESS & GROWTH'},life:{zh:'学习与生活',en:'LEARNING & LIFE'},future:{zh:'科技与未来',en:'TECH & TOMORROW'},ideas:{zh:'思想与判断',en:'IDEAS & PERSPECTIVES'}};
  function theme(a){
    const t=[a.title,...a.tags].join(' ');
    if(/人工智能|科技|未来|SpaceX|Tesla|太空|火星|Neuralink|AI/.test(t))return 'future';
    if(/写作|创作|表达|品牌|内容|讲故事/.test(t))return 'create';
    if(/增长|营销|获客|产品|商业|企业|创业|销售|定价/.test(t))return 'growth';
    if(/财富|金钱|投资|加密|区块链|稳定币|支付|TRON/.test(t))return 'wealth';
    if(/学习|幸福|生活|技能|恐惧|效率|阅读|家庭|身心/.test(t))return 'life';
    return 'ideas';
  }
  function hash(text){let result=0;for(const c of text)result=(result*31+c.charCodeAt(0))>>>0;return result;}
  function poster(a){
    const key=theme(a),variant=hash(a.id)%4,year=(a.date||'').slice(0,4)||'IDEAS';
    return `<div class="editorial-cover theme-${key} layout-${variant}" aria-hidden="true"><span class="poster-grid"></span><span class="poster-caption">THE CONVERSATION ARCHIVE</span><span class="poster-year">${esc(year)}</span><svg class="poster-symbol" viewBox="0 0 140 140" fill="none" stroke="currentColor" stroke-width="1.5">${symbols[key]}</svg><span class="poster-topic-en">${themes[key].en}</span><span class="poster-title">${esc(a.tags.slice(0,2).join('，')||themes[key].zh)}</span><span class="poster-program">${esc(a.source)}</span><span class="poster-mark">${['＋','&','◯','↗'][variant]}</span></div>`;
  }
  function asset(a){return window.ARCHIVE_COVERS?.[a.id];}
  function media(a,{hero=false}={}){
    const artwork=asset(a);
    return poster(a)+(artwork?`<img src="${esc(artwork.file)}" alt="${esc(a.source+' · '+a.title+' 节目配图')}" ${hero?'fetchpriority="high"':'loading="lazy"'} decoding="async" data-cover-image>`:'');
  }
  function card(a,index,format){
    const artwork=asset(a),key=theme(a);
    return `<a class="article-cover ${artwork?'cover-photo':'cover-designed'} theme-${key}" data-article="${esc(a.id)}" href="#read/${encodeURIComponent(a.id)}" aria-label="阅读${esc(a.title)}">${media(a)}<span class="cover-index">${esc(format)} / ${String(index).padStart(3,'0')}</span>${artwork?`<span class="cover-program">${esc(a.source)}</span>`:''}<span class="cover-open" aria-hidden="true">→</span></a>`;
  }
  function hero(a){
    const artwork=asset(a),key=theme(a);
    return `<div class="hero-visual hero-artwork theme-${key} ${artwork?'hero-photo':'hero-designed'}" data-cover-kind="${artwork?'episode':'poster'}">${media(a,{hero:true})}<span class="image-number">EDITOR'S PICK / 001</span><span class="hero-artwork-label">${esc(a.source)} <span>公开对话</span></span></div>`;
  }
  window.ArchiveCovers={card,hero,theme,asset};
})();
