import{C as M,B as J,e as K,b as Q,c as X,p as Y,f as aa,h as ta,j as ea,d as o,k as T,r as sa}from"./chart-DZpacLFV.js";M.register(J,K,Q,X,Y,aa);function na(d,f,l,$){const E=ta(f),{categories:b,totalWifey:m,totalHubby:x,winner:c,tiebreaker:k,margin:D}=E,I=c==="draw"?"Draw":c==="wifey"?"Wifey":"Hubby",N=c==="draw"?"winner--draw":c==="wifey"?"winner--wifey":"winner--hubby",P=c==="draw"||k?"0":String(Math.abs(D)),R=l!=null&&l.prev?`<a href="${l.prev}" class="analysis-nav-btn" title="Previous game">&#8249;</a>`:'<span class="analysis-nav-btn analysis-nav-btn--disabled">&#8249;</span>',_=l!=null&&l.next?`<a href="${l.next}" class="analysis-nav-btn" title="Next game">&#8250;</a>`:'<span class="analysis-nav-btn analysis-nav-btn--disabled">&#8250;</span>',W=c==="draw"?"winner--draw":c==="wifey"?"winner--wifey":"winner--hubby",V=c==="draw"?"row--draw":c==="wifey"?"row--wifey":"row--hubby",G=c==="draw"?"Draw":c==="wifey"?"Wifey":"Hubby";let w={},h={};if($&&$.length>0){const a=ea(f,$);w=a.wifeyByCategory,h=a.hubbyByCategory}else b.forEach(a=>{w[a.category]=a.wifey,h[a.category]=a.hubby});const O=b.map(a=>{const t=a.winner==="draw"?"winner--draw":a.winner==="wifey"?"winner--wifey":"winner--hubby",e=a.winner==="draw"?"row--draw":a.winner==="wifey"?"row--wifey":"row--hubby",r=a.winner==="draw"?"Draw":a.winner==="wifey"?"Wifey":"Hubby",i=w[a.category]??0,s=h[a.category]??0,n=a.wifey-i,y=a.hubby-s,g=n>=0?`+${n.toFixed(1)}`:n.toFixed(1),v=y>=0?`+${y.toFixed(1)}`:y.toFixed(1);return`
        <tr class=${e}>
          <td>${a.category}</td>
          <td class="col-right col-wifey">${a.wifey}<br><span class="category-diff">(${g})</span></td>
          <td class="col-right col-hubby">${a.hubby}<br><span class="category-diff">(${v})</span></td>
          <td class="col-right ${t}">${r}</td>
          <td class="col-right ${t}">${a.margin}</td>
        </tr>`}).join("")+(()=>{const a=b.reduce((n,y)=>n+(w[y.category]??0),0),t=b.reduce((n,y)=>n+(h[y.category]??0),0),e=m-a,r=x-t,i=e>=0?`+${e.toFixed(1)}`:e.toFixed(1),s=r>=0?`+${r.toFixed(1)}`:r.toFixed(1);return`<tr class=table-row--total ${V}>
        <td><strong><i>TOTAL</i></strong></td>
        <td class="col-right col-wifey">${m}<br><span class="category-diff">(${i})</span></td>
        <td class="col-right col-hubby">${x}<br><span class="category-diff">(${s})</span></td>
        <td class="col-right ${W}">${G}</td>
        <td class="col-right ${W}">${Math.abs(D)}</td>
      </tr>`})();d.innerHTML=`
    <div class="analysis-header">
      <div class="analysis-game-nav">
        ${R}
        <h2>Game #${f.game_id}</h2>
        ${_}
      </div>
      <div class="analysis-result">
      <span class="${N}">${I}</span>
      ${k?'<span class="analysis-tiebreaker">(tiebreaker)</span>':""}
      ${c!=="draw"?`<span class="analysis-margin">by ${P}</span>`:""}
      </div>
      <div class="analysis-totals">
        <span class="col-wifey">Wifey </span><span>${m}</span>
        <span class="analysis-totals-sep">·</span>
        <span class="col-hubby">Hubby </span><span>${x}</span>
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
        <tbody>${O}</tbody>
      </table>
    </div>

    <div class="analysis-chart-wrap">
      <canvas id="analysis-chart-${f.game_id}"></canvas>
    </div>`;const U=d.querySelector(".analysis-chart-wrap");U.style.height=`${b.length*60+60}px`;const B=document.getElementById(`analysis-chart-${f.game_id}`);if(!B)return;const j=b.map(a=>a.wifey),q=b.map(a=>a.hubby),z={id:"dataLabels",afterDatasetsDraw(a){const{ctx:t}=a;for(let e=0;e<2;e++){const r=a.data.datasets[e];if(!r)continue;a.getDatasetMeta(e).data.forEach((s,n)=>{const y=r.data[n],g=s;t.save(),t.fillStyle=o.chartText,t.font="11px system-ui, -apple-system, sans-serif",t.textAlign="left",t.textBaseline="middle",t.fillText(String(y),g.base+4,g.y),t.restore()})}}},Z={id:"averageLines",afterDatasetsDraw(a){const{ctx:t,scales:e}=a;if(!e.x)return;const r=e.x;[0,1].forEach(i=>{const s=a.getDatasetMeta(i);!s.data||s.hidden||s.data.forEach((n,y)=>{var A;const g=(A=b[y])==null?void 0:A.category;if(!g)return;const v=i===0?w[g]??0:h[g]??0,F=r.getPixelForValue(v),S=n,L=12;t.save(),t.strokeStyle="#000000",t.lineWidth=2,t.setLineDash([4,3]),t.beginPath(),t.moveTo(F,S.y-L),t.lineTo(F,S.y+L),t.stroke(),t.restore()})})}};new M(B,{type:"bar",plugins:[z,Z],data:{labels:b.map(a=>a.category),datasets:[{label:"Wifey",data:j,backgroundColor:o.wifeyFill,borderColor:o.wifey,borderWidth:2,borderRadius:3},{label:"Hubby",data:q,backgroundColor:o.hubbyFill,borderColor:o.hubby,borderWidth:2,borderRadius:3}]},options:{indexAxis:"y",responsive:!0,maintainAspectRatio:!1,scales:{x:{beginAtZero:!0,grid:{color:o.chartGrid},ticks:{color:o.chartText,font:{size:11}}},y:{grid:{display:!1},ticks:{color:o.chartText,font:{size:11}}}},plugins:{legend:{labels:{color:o.chartText}},tooltip:{backgroundColor:o.tooltipBg,titleColor:o.tooltipTitle,bodyColor:o.tooltipBody,borderColor:o.tooltipBorder,borderWidth:1,callbacks:{afterLabel(a){var r;const t=(r=b[a.dataIndex])==null?void 0:r.category,e=a.parsed.x;if(!t||e===null||e===void 0)return"";if(a.datasetIndex===0){const i=w[t]??0,s=(e-i).toFixed(1),n=parseFloat(s)>=0?"+":"";return`Average: ${i.toFixed(1)}
Difference: ${n}${s}`}else if(a.datasetIndex===1){const i=h[t]??0,s=(e-i).toFixed(1),n=parseFloat(s)>=0?"+":"";return`Average: ${i.toFixed(1)}
Difference: ${n}${s}`}return""}}}}}})}const u=sa,ra=document.querySelectorAll("a.back-link");ra.forEach(d=>{d.href=T()});const ia=new URLSearchParams(location.search),H=ia.get("game"),C=H!==null?parseInt(H,10):NaN,p=document.getElementById("analysis-root");if(!p)throw new Error("Missing #analysis-root");if(isNaN(C))p.innerHTML=`<p id="not-found">No game specified. <a href="${T()}" class="back-link">← Back</a></p>`;else{const d=u.findIndex(l=>l.game_id===C),f=d!==-1?u[d]:void 0;if(!f)p.innerHTML=`<p id="not-found">Game #${C} not found. <a href="${T()}" class="back-link">← Back</a></p>`;else{const l={prev:d>0?`?game=${u[d-1].game_id}`:null,next:d<u.length-1?`?game=${u[d+1].game_id}`:null};na(p,f,l,u)}}
