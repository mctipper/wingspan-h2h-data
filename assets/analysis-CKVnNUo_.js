import{C as I,B as ea,e as sa,b as na,c as ra,p as ia,f as oa,h as la,j as ca,d as o,k as T,r as da}from"./chart-BeZ7dKYv.js";I.register(ea,sa,na,ra,ia,oa);function ya(y,f,l,x){const N=la(f),{categories:c,totalWifey:m,totalHubby:$,winner:d,tiebreaker:k,margin:D}=N,P=d==="draw"?"Draw":d==="wifey"?"Wifey":"Hubby",R=d==="draw"?"winner--draw":d==="wifey"?"winner--wifey":"winner--hubby",_=d==="draw"||k?"0":String(Math.abs(D)),V=l!=null&&l.prev?`<a href="${l.prev}" class="analysis-nav-btn" title="Previous game">&#8249;</a>`:'<span class="analysis-nav-btn analysis-nav-btn--disabled">&#8249;</span>',G=l!=null&&l.next?`<a href="${l.next}" class="analysis-nav-btn" title="Next game">&#8250;</a>`:'<span class="analysis-nav-btn analysis-nav-btn--disabled">&#8250;</span>',W=d==="draw"?"winner--draw":d==="wifey"?"winner--wifey":"winner--hubby",O=d==="draw"?"row--draw":d==="wifey"?"row--wifey":"row--hubby",U=d==="draw"?"Draw":d==="wifey"?"Wifey":"Hubby";let h={},w={};if(x&&x.length>0){const a=ca(f,x);h=a.wifeyByCategory,w=a.hubbyByCategory}else c.forEach(a=>{h[a.category]=a.wifey,w[a.category]=a.hubby});const j=c.map(a=>{const t=a.winner==="draw"?"winner--draw":a.winner==="wifey"?"winner--wifey":"winner--hubby",e=a.winner==="draw"?"row--draw":a.winner==="wifey"?"row--wifey":"row--hubby",r=a.winner==="draw"?"Draw":a.winner==="wifey"?"Wifey":"Hubby",i=h[a.category]??0,s=w[a.category]??0,n=a.wifey-i,b=a.hubby-s,g=n>=0?`+${n.toFixed(1)}`:n.toFixed(1),v=b>=0?`+${b.toFixed(1)}`:b.toFixed(1);return`
        <tr class=${e}>
          <td>${a.category}</td>
          <td class="col-right col-wifey">${a.wifey}<br><span class="category-diff">(${g})</span></td>
          <td class="col-right col-hubby">${a.hubby}<br><span class="category-diff">(${v})</span></td>
          <td class="col-right ${t}">${r}</td>
          <td class="col-right ${t}">${a.margin}</td>
        </tr>`}).join("")+(()=>{const a=c.reduce((n,b)=>n+(h[b.category]??0),0),t=c.reduce((n,b)=>n+(w[b.category]??0),0),e=m-a,r=$-t,i=e>=0?`+${e.toFixed(1)}`:e.toFixed(1),s=r>=0?`+${r.toFixed(1)}`:r.toFixed(1);return`<tr class=table-row--total ${O}>
        <td><strong><i>TOTAL</i></strong></td>
        <td class="col-right col-wifey">${m}<br><span class="category-diff">(${i})</span></td>
        <td class="col-right col-hubby">${$}<br><span class="category-diff">(${s})</span></td>
        <td class="col-right ${W}">${U}</td>
        <td class="col-right ${W}">${Math.abs(D)}</td>
      </tr>`})();y.innerHTML=`
    <div class="analysis-header">
      <div class="analysis-game-nav">
        ${V}
        <h2>Game #${f.game_id}</h2>
        ${G}
      </div>
      <div class="analysis-result">
      <span class="${R}">${P}</span>
      ${k?'<span class="analysis-tiebreaker">(tiebreaker)</span>':""}
      ${d!=="draw"?`<span class="analysis-margin">by ${_}</span>`:""}
      </div>
      <div class="analysis-totals">
        <span class="col-wifey">Wifey </span><span>${m}</span>
        <span class="analysis-totals-sep">·</span>
        <span class="col-hubby">Hubby </span><span>${$}</span>
      </div>
    </div>

    <div class="analysis-table-wrap">
      <table class="analysis-table">
        <thead>
          <tr>
            <th>Category</th>
            <th class="col-right col-wifey">Wifey</th>
            <th class="col-right col-hubby">Hubby</th>
            <th class="col-right">Winner</th>
            <th class="col-right">Margin</th>
          </tr>
        </thead>
        <tbody>${j}</tbody>
      </table>
    </div>

    <div class="analysis-chart-wrap">
      <canvas id="analysis-chart-${f.game_id}"></canvas>
    </div>`;const q=y.querySelector(".analysis-chart-wrap");q.style.height=`${c.length*60+60}px`;const A=document.getElementById(`analysis-chart-${f.game_id}`);if(!A)return;const M=c.map(a=>a.wifey),B=c.map(a=>a.hubby),z={id:"dataLabels",afterDatasetsDraw(a){const{ctx:t}=a;for(let e=0;e<2;e++){const r=a.data.datasets[e];if(!r)continue;a.getDatasetMeta(e).data.forEach((s,n)=>{const b=r.data[n],g=s;t.save(),t.fillStyle=o.chartText,t.font="11px system-ui, -apple-system, sans-serif",t.textAlign="left",t.textBaseline="middle",t.fillText(String(b),g.base+4,g.y),t.restore()})}}},Z={id:"averageLines",afterDatasetsDraw(a){const{ctx:t,scales:e}=a;if(!e.x)return;const r=e.x;[0,1].forEach(i=>{const s=a.getDatasetMeta(i);!s.data||s.hidden||s.data.forEach((n,b)=>{var H;const g=(H=c[b])==null?void 0:H.category;if(!g)return;const v=i===0?h[g]??0:w[g]??0,F=r.getPixelForValue(v),S=n,L=12;t.save(),t.strokeStyle="#000000",t.lineWidth=2,t.setLineDash([4,3]),t.beginPath(),t.moveTo(F,S.y-L),t.lineTo(F,S.y+L),t.stroke(),t.restore()})})}},J=c.map(a=>h[a.category]??0),K=c.map(a=>w[a.category]??0),Q=Math.max(...M,...B),X=Math.max(...J,...K),Y=60,aa=Math.max(Q,X),ta=Math.max(Y,Math.ceil(aa*1.05));new I(A,{type:"bar",plugins:[z,Z],data:{labels:c.map(a=>a.category),datasets:[{label:"Wifey",data:M,backgroundColor:o.wifeyFill,borderColor:o.wifey,borderWidth:2,borderRadius:3},{label:"Hubby",data:B,backgroundColor:o.hubbyFill,borderColor:o.hubby,borderWidth:2,borderRadius:3}]},options:{indexAxis:"y",responsive:!0,maintainAspectRatio:!1,scales:{x:{beginAtZero:!0,max:ta,grid:{color:o.chartGrid},ticks:{color:o.chartText,font:{size:11}}},y:{grid:{display:!1},ticks:{color:o.chartText,font:{size:11}}}},plugins:{legend:{labels:{color:o.chartText}},tooltip:{backgroundColor:o.tooltipBg,titleColor:o.tooltipTitle,bodyColor:o.tooltipBody,borderColor:o.tooltipBorder,borderWidth:1,callbacks:{afterLabel(a){var r;const t=(r=c[a.dataIndex])==null?void 0:r.category,e=a.parsed.x;if(!t||e===null||e===void 0)return"";if(a.datasetIndex===0){const i=h[t]??0,s=(e-i).toFixed(1),n=parseFloat(s)>=0?"+":"";return`Average: ${i.toFixed(1)}
Difference: ${n}${s}`}else if(a.datasetIndex===1){const i=w[t]??0,s=(e-i).toFixed(1),n=parseFloat(s)>=0?"+":"";return`Average: ${i.toFixed(1)}
Difference: ${n}${s}`}return""}}}}}})}const u=da,ba=document.querySelectorAll("a.back-link");ba.forEach(y=>{y.href=T()});const fa=new URLSearchParams(location.search),E=fa.get("game"),C=E!==null?parseInt(E,10):NaN,p=document.getElementById("analysis-root");if(!p)throw new Error("Missing #analysis-root");if(isNaN(C))p.innerHTML=`<p id="not-found">No game specified. <a href="${T()}" class="back-link">← Back</a></p>`;else{const y=u.findIndex(l=>l.game_id===C),f=y!==-1?u[y]:void 0;if(!f)p.innerHTML=`<p id="not-found">Game #${C} not found. <a href="${T()}" class="back-link">← Back</a></p>`;else{const l={prev:y>0?`?game=${u[y-1].game_id}`:null,next:y<u.length-1?`?game=${u[y+1].game_id}`:null};ya(p,f,l,u)}}
