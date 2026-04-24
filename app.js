// 通用的資料處理與解析
async function fetchCSV() {
    const response = await fetch('2016.csv');
    const data = await response.text();
    const rows = data.split('\n').slice(1); // 移除 Header
    
    return rows.map(row => {
        const cols = row.split(','); // 簡單處理，實際可能需處理引號內逗號
        return {
            region: cols[0],
            name: cols[1],
            party: cols[4],
            elected: cols[6] === '*',
            total: parseInt(cols[12]) || 0,
            personal: parseInt(cols[13]) || 0,
            corp: parseInt(cols[15]) || 0,
            party_don: parseInt(cols[17]) || 0
        };
    });
}

// 渲染結果列表
async function loadAndDisplayResults() {
    const allData = await fetchCSV();
    const params = new URLSearchParams(window.location.search);
    const filterParty = params.get('party');
    const filterRegion = params.get('region');

    let filtered = allData.filter(item => {
        let match = true;
        if (filterParty && item.party !== filterParty) match = false;
        if (filterRegion && !item.region.includes(filterRegion)) match = false;
        return match;
    });

    // 渲染 Summary
    const totalCash = filtered.reduce((sum, i) => sum + i.total, 0);
    document.getElementById('quick-summary').innerText = 
        `[統計報告] 檢索範圍內總計流通資金：$${totalCash.toLocaleString()} TWD | 樣本數：${filtered.length}`;

    // 渲染列表
    const container = document.getElementById('results-list');
    container.innerHTML = filtered.map(item => `
        <div class="result-item" onclick="location.href='2016_candidate.html?name=${item.name}'">
            <div>
                <h3 style="margin:0">${item.name} <small>${item.party}</small></h3>
                <p style="color:var(--text-grey); font-size:0.8rem">${item.region}</p>
            </div>
            <div style="text-align:right">
                <div style="color:var(--accent-red)">$${item.total.toLocaleString()}</div>
                <div style="font-size:0.7rem">${item.elected ? 'STATUS: ELECTED' : ''}</div>
            </div>
        </div>
    `).join('');
}

// 載入個人細節
async function loadCandidateDetail() {
    const allData = await fetchCSV();
    const name = new URLSearchParams(window.location.search).get('name');
    const data = allData.find(i => i.name === name);

    if (data) {
        document.getElementById('can-name').innerText = `SUBJECT: ${data.name}`;
        document.getElementById('can-party').innerText = `AFFILIATION: ${data.party}`;
        
        // 模擬捐款明細表格
        const body = document.getElementById('donation-body');
        body.innerHTML = `
            <tr><td>個人捐贈</td><td>$${data.personal.toLocaleString()}</td><td>${((data.personal/data.total)*100).toFixed(2)}%</td></tr>
            <tr><td>營利事業捐贈</td><td>$${data.corp.toLocaleString()}</td><td>${((data.corp/data.total)*100).toFixed(2)}%</td></tr>
            <tr><td>政黨捐贈</td><td>$${data.party_don.toLocaleString()}</td><td>${((data.party_don/data.total)*100).toFixed(2)}%</td></tr>
        `;
    }
}