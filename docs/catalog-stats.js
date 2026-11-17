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
    const reprints=articles.filter(a=>a.contentStatus==='reprint').length;
    const brief=articles.filter(a=>a.contentStatus==='brief').length;
    const years=articles.map(a=>Number((a.date||'').slice(0,4))).filter(y=>y>1900&&y<2100);
    $('archiveSummary').textContent=`${people.length} 位人物 / ${articles.length} 条来源资料 / ${deep+notes+reprints} 篇站内精读与导读`;
    $('catalogCounters').innerHTML=`<div><strong>${articles.length}</strong><span>来源资料</span></div><div><strong>${deep+notes+reprints}</strong><span>站内精读与导读</span></div><div><strong>${brief}</strong><span>简要资料</span></div><div><strong>${Math.min(...years)}—${Math.max(...years)}</strong><span>索引日期范围</span></div>`;
    $('coverageRows').innerHTML=people.map(p=>{
      const list=articles.filter(a=>related(a,p.id));
      const count=key=>list.filter(a=>format(a,p.id)===key).length;
      const long=list.filter(readable).length;
      return `<tr><th scope="row"><button data-person="${p.id}">${esc(p.name)} ↗</button></th><td><strong>${list.length}</strong></td><td>${count('interview')}</td><td>${count('host')}</td><td>${count('talk')}</td><td>${count('clip')}</td><td>${list.filter(a=>['essay','collection'].includes(a.type)).length}</td><td>${count('summary')}</td><td>${count('lesson')}</td><td>${count('event')}</td><td>${count('related')+count('version')+count('podcast')}</td><td>${long}</td></tr>`;
    }).join('');
    const coverage=window.ARCHIVE_COVERAGE;
    if(coverage?.sources?.length){$('coverageSources').innerHTML=coverage.sources.map(source=>`<li><strong>${esc(source.person)}</strong><span>${esc(source.note)}</span>${source.links.map(link=>`<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.title)} ↗</a>`).join('')}</li>`).join('');}
    $('coverageDate').textContent=coverage?.checkedAt||'2026-11-16';
    const comparison=window.ELON_REFERENCE_COVERAGE;
    if(comparison&&$('elonReferenceCheck'))$('elonReferenceCheck').innerHTML=`<div><span class="eyebrow accent">ELON / REFERENCE COVERAGE</span><strong>${comparison.coveredReferenceItems} / ${comparison.referenceItems}</strong><span>参考站目录已逐项对照</span></div><div><p>对照 <a href="https://elon.qiaomu.ai/" target="_blank" rel="noopener noreferrer">elon.qiaomu.ai</a> 的完整视频索引，${comparison.importedChineseReadings} 篇中文精读按原站要求署名转载，正文可在本站阅读。</p><p>来源条目包含访谈、演讲、活动、片段与同场版本，不能等同于独立访谈场次。</p><a href="elon-reference-coverage.json" target="_blank" rel="noopener noreferrer">查看逐项对照目录 ↗</a></div>`;
    const expansion=window.OTHER_ARCHIVES_COVERAGE;
    if(expansion&&$('otherArchiveCheck'))$('otherArchiveCheck').innerHTML=`<span class="eyebrow accent">SIX VOICES / ARCHIVE REVIEW</span><h3>另外六人的目录补查</h3><p>逐项核对官方节目目录、RSS与公开受访来源。总数含文章、节目分段和个人口述，嘉宾受访与主持节目分别显示；可在资料形式中继续筛选。</p><div class="table-scroll"><table><thead><tr><th>人物</th><th>上轮</th><th>现在</th><th>新增</th><th>嘉宾受访</th><th>主持对谈</th><th>演讲 / 口述</th></tr></thead><tbody>${expansion.people.map(p=>`<tr><th><button data-person="${p.id}">${esc(p.name)} ↗</button></th><td>${p.previous}</td><td>${p.total}</td><td>+${p.added}</td><td>${p.types.interview||0}</td><td>${p.types.host||0}</td><td>${p.types.talk||0}</td></tr>`).join('')}</tbody></table></div><a href="other-archives-coverage.json" target="_blank" rel="noopener noreferrer">查看本轮原始目录、归并记录与核对范围 ↗</a>`;
  }
  window.ArchiveCatalog={init};
})();
