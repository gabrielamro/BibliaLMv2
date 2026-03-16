import{aD as _,u as I,r as d,j as e,L as v,aF as O,B as $,z as q,aq as N,ax as T,C as V,aC as B}from"./react-vendor-DUmbrcQs.js";import{u as R,d as u}from"./index-CZnxriqp.js";import{n as F}from"./geminiService-DkzBEZSj.js";import{S as G}from"./SEO-CWnK7ALj.js";import"./vendor-BmtEpC__.js";import"./firebase-DwVzyH9Z.js";const X=()=>{const{moduleId:b}=_(),p=I(),{currentUser:i,recordActivity:D,showNotification:g}=R(),[t,y]=d.useState(null),[n,m]=d.useState(null),[z,S]=d.useState(!0),[E,h]=d.useState(!1),[f,k]=d.useState(""),[j,w]=d.useState(!1),[x,c]=d.useState("");d.useEffect(()=>{(async()=>{if(!(!b||!i))try{const s=(await u.getAll(i.uid,"study_modules")).find(l=>l.id===b);if(s){y(s);const l=s.days.find(o=>o.day===s.currentDay)||s.days[0];m(l),c(l.fullContent||""),l.fullContent||C(s,l)}}catch(r){console.error(r)}finally{S(!1)}})()},[b,i]);const C=async(a,r)=>{h(!0);try{const s=await F(a.theme,r.title,r.baseVerses);if(s){const l=a.days.map(o=>o.day===r.day?{...o,fullContent:s}:o);await u.update(i.uid,"study_modules",a.id,{days:l}),m({...r,fullContent:s}),c(s)}}catch{g("Erro ao carregar conteúdo.","error")}finally{h(!1)}},A=async()=>{if(!t||!n||!i)return;const a=t.days.map(r=>r.day===n.day?{...r,fullContent:x}:r);try{await u.update(i.uid,"study_modules",t.id,{days:a}),y({...t,days:a}),m({...n,fullContent:x}),w(!1),g("Conteúdo atualizado!","success")}catch{g("Erro ao salvar edição.","error")}},L=()=>{!n||!t||p("/criar-estudo",{state:{prefill:{title:n.title,mainVerse:n.baseVerses[0],textAnalysis:n.fullContent||x,theme:t.theme,source:"modulo"}}})},M=async()=>{if(!t||!n||!i)return;const a=t.currentDay===t.durationDays,r=t.currentDay+1,s=t.days.map(o=>o.day===t.currentDay?{...o,isCompleted:!0}:o),l={days:s};a?l.status="completed":l.currentDay=r;try{if(await u.update(i.uid,"study_modules",t.id,l),await D("reading_chapter",`Completou dia ${t.currentDay} de: ${t.title}`),f&&await u.add(i.uid,"notes",{bookId:"modulo",chapter:t.currentDay,content:f,title:`Reflexão: ${t.title}`}),a)g("Módulo concluído com sucesso!","success"),p("/estudo/tematico");else{window.scrollTo(0,0);const o=s.find(P=>P.day===r);y({...t,currentDay:r,days:s}),m(o),k(""),c(""),o.fullContent?c(o.fullContent||""):C(t,o)}}catch(o){console.error(o)}};return z||!t||!n?e.jsx("div",{className:"h-screen flex items-center justify-center",children:e.jsx(v,{className:"animate-spin text-bible-gold",size:40})}):e.jsxs("div",{className:"h-full bg-bible-paper dark:bg-bible-darkPaper overflow-y-auto",children:[e.jsx(G,{title:`${t.title} - Dia ${t.currentDay}`}),e.jsx("style",{children:`
            .editor-content h2 {
                font-family: 'Lora', serif;
                font-size: 1.5rem;
                line-height: 2rem;
                font-weight: 700;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                color: #c5a059;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 0.25em;
            }
            .dark .editor-content h2 { 
                border-bottom-color: #374151;
            }

            .editor-content h3 {
                font-family: 'Lora', serif;
                font-size: 1.25rem;
                font-weight: 700;
                margin-top: 1.25em;
                margin-bottom: 0.5em;
                color: #4b5563;
            }
            .dark .editor-content h3 { color: #d1d5db; }

            .editor-content blockquote {
                border-left: 4px solid #c5a059;
                padding-left: 1em;
                color: #666;
                font-style: italic;
                margin: 1.5em 0;
                background-color: rgba(197, 160, 89, 0.1);
                padding: 1em;
                border-radius: 0 0.5em 0.5em 0;
            }
            .dark .editor-content blockquote { color: #9ca3af; }

            .editor-content p {
                margin-bottom: 1em;
                line-height: 1.8;
            }
            
            .editor-content ul {
                list-style-type: disc;
                padding-left: 1.5em;
                margin-bottom: 1em;
            }
            
            .editor-content li {
                margin-bottom: 0.5em;
            }
            
            .editor-content b, .editor-content strong {
                font-weight: 700;
                color: #2d2a26;
            }
            .dark .editor-content b, .dark .editor-content strong {
                color: #e5e7eb;
            }
        `}),e.jsx("div",{className:"max-w-4xl mx-auto px-4 pt-8 pb-32",children:e.jsxs("div",{className:"space-y-12",children:[e.jsxs("header",{className:"text-center space-y-4",children:[e.jsxs("div",{className:"inline-flex items-center gap-2 bg-bible-gold/10 text-bible-gold px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",children:[e.jsx(O,{size:14})," Dia ",t.currentDay," de ",t.durationDays]}),e.jsx("h1",{className:"text-3xl md:text-5xl font-serif font-black text-gray-900 dark:text-white leading-tight",children:n.title}),e.jsxs("p",{className:"text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto italic",children:['"',n.shortDescription,'"']})]}),e.jsxs("section",{className:"bg-gray-50 dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-inner",children:[e.jsxs("h3",{className:"text-xs font-black text-bible-gold uppercase tracking-[0.2em] mb-6 flex items-center gap-2",children:[e.jsx($,{size:16})," Alicerce Bíblico"]}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:n.baseVerses.map(a=>e.jsxs("div",{className:"bg-white dark:bg-bible-darkPaper p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-800 flex items-center justify-between group cursor-pointer hover:border-bible-gold transition-all",onClick:()=>p("/biblia",{state:{search:a}}),children:[e.jsx("span",{className:"font-bold text-gray-800 dark:text-gray-200",children:a}),e.jsx(q,{className:"text-gray-300 group-hover:text-bible-gold",size:18})]},a))})]}),e.jsxs("article",{className:"prose dark:prose-invert prose-lg max-w-none space-y-8 relative group/article",children:[e.jsx("div",{className:"absolute -top-10 right-0 flex gap-2 opacity-0 group-hover/article:opacity-100 transition-opacity",children:j?e.jsxs("button",{onClick:A,className:"flex items-center gap-2 text-xs font-bold text-green-600 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-green-200",children:[e.jsx(T,{size:14})," Salvar Alterações"]}):e.jsxs("button",{onClick:()=>w(!0),className:"flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-bible-gold bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700",children:[e.jsx(N,{size:14})," Editar Texto"]})}),E?e.jsxs("div",{className:"py-20 flex flex-col items-center gap-4 text-center",children:[e.jsx(v,{className:"animate-spin text-bible-gold",size:48}),e.jsx("p",{className:"text-bible-gold font-serif italic animate-pulse",children:"O Obreiro IA está preparando seu estudo profundo..."})]}):j?e.jsx("textarea",{value:x,onChange:a=>c(a.target.value),className:"w-full h-[600px] p-6 bg-white dark:bg-gray-900 border border-bible-gold rounded-2xl outline-none text-lg leading-relaxed font-sans resize-none shadow-inner"}):e.jsx("div",{className:"editor-content whitespace-pre-wrap leading-loose text-gray-800 dark:text-gray-300 font-sans",dangerouslySetInnerHTML:{__html:n.fullContent||""}})]}),e.jsxs("section",{className:"bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl",children:[e.jsxs("h3",{className:"text-lg font-serif font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2",children:[e.jsx(N,{size:20,className:"text-purple-500"})," O que Deus falou com você?"]}),e.jsx("textarea",{value:f,onChange:a=>k(a.target.value),placeholder:"Anote suas impressões ou uma oração pessoal...",className:"w-full h-40 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 ring-purple-500/20 text-base"})]}),e.jsxs("div",{className:"flex flex-col gap-4 pt-8",children:[e.jsxs("button",{onClick:M,className:"w-full py-5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3",children:["Concluir Estudo de Hoje ",e.jsx(V,{size:24})]}),e.jsxs("button",{onClick:L,className:"w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-bible-gold hover:text-white transition-all text-xs",children:[e.jsx(B,{size:18})," Aproveitar estudo de hoje"]})]})]})})]})};export{X as default};
