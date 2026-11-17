(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  function init({people,articles}){
    const related=(a,id)=>(a.participants||[a.person]).includes(id);
    const format=(a,id)=>a.type==='interview'&&(a.roles?.[id]||(id===a.person?a.role:null))==='host'?'host':a.type;
    const readable=a=>a.contentStatus!=='brief';
    const deep=articles.filter(a=>a.contentStatus==='deep').length;
    const notes=articles.filter(a=>a.contentStatus==='reading').length;
    const brief=articles.filter(a=>a.contentStatus==='brief').length;
    const years=articles.map(a=>Number((a.date||'').slice(0,4))).filter(y=>y>1900&&y<2100);
    $('archiveSummary').textContent=`${people.length} 位人物 / ${articles.length} 条去重资料 / ${deep+notes} 篇站内精读与导读`;
    $('catalogCounters').innerHTML=`<div><strong>${articles.length}</strong><span>去重资料</span></div><div><strong>${deep+notes}</strong><span>站内精读与导读</span></div><div><strong>${brief}</strong><span>已收录简介</span></div><div><strong>${Math.min(...years)}—${Math.max(...years)}</strong><span>已知日期范围</span></div>`;
    $('coverageRows').innerHTML=people.map(p=>{
      const list=articles.filter(a=>related(a,p.id));
      const count=key=>list.filter(a=>format(a,p.id)===key).length;
      const long=list.filter(readable).length;
      return `<tr><th scope="row"><button data-person="${p.id}">${esc(p.name)} ↗</button></th><td>${count('interview')}</td><td>${count('host')}</td><td>${count('talk')}</td><td>${count('clip')}</td><td>${list.filter(a=>['essay','collection'].includes(a.type)).length}</td><td>${count('summary')}</td><td>${count('lesson')}</td><td>${long}</td><td><strong>${list.length}</strong></td></tr>`;
    }).join('');
    const coverage=window.ARCHIVE_COVERAGE;
    if(coverage?.sources?.length){$('coverageSources').innerHTML=coverage.sources.map(source=>`<li><strong>${esc(source.person)}</strong><span>${esc(source.note)}</span>${source.links.map(link=>`<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.title)} ↗</a>`).join('')}</li>`).join('');}
    $('coverageDate').textContent=coverage?.checkedAt||'2026-11-16';
  }
  window.ArchiveCatalog={init};
})();
