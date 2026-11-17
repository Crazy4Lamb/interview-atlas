/* Load one local, attributed reading at a time; works over HTTP and file://. */
(() => {
  'use strict';
  window.ARCHIVE_REPRINTS=window.ARCHIVE_REPRINTS||Object.create(null);
  const pending=new Map(),attempts=new Map();
  const valid=value=>value&&Array.isArray(value.sections)&&value.sections.length>0&&value.sections.every(section=>section&&typeof section.heading==='string'&&Array.isArray(section.paragraphs)&&section.paragraphs.every(p=>typeof p==='string'));
  function get(id){const content=window.ARCHIVE_REPRINTS[id];return valid(content)?content:null;}
  function load(article){
    const cached=get(article.id);if(cached)return Promise.resolve(cached);
    if(pending.has(article.id))return pending.get(article.id);
    const file=article.reprint?.file;
    if(typeof file!=='string'||!/^readings\/[A-Za-z0-9_-]+\.js$/.test(file))return Promise.reject(new Error('Invalid local reading path'));
    const attempt=(attempts.get(article.id)||0)+1;attempts.set(article.id,attempt);
    const url=new URL(file,document.baseURI);
    if(attempt>1)url.searchParams.set('retry',String(attempt));
    const promise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');let finished=false;
      const finish=error=>{
        if(finished)return;finished=true;clearTimeout(timer);
        script.onload=null;script.onerror=null;script.remove();
        const content=get(article.id);
        if(error)reject(error);else if(content)resolve(content);else reject(new Error('Reading script did not register valid content'));
      };
      const timer=setTimeout(()=>finish(new Error('Reading load timed out')),20000);
      script.async=true;script.src=url.href;script.dataset.reprintId=article.id;
      script.onload=()=>finish();script.onerror=()=>finish(new Error('Reading script could not be loaded'));
      try{document.head.appendChild(script);}catch(error){finish(error);}
    });
    pending.set(article.id,promise);
    promise.then(()=>{if(pending.get(article.id)===promise)pending.delete(article.id);},()=>{if(pending.get(article.id)===promise)pending.delete(article.id);});
    return promise;
  }
  window.ArchiveReprints={get,load};
})();
