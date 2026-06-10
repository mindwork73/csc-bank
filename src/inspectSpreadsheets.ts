async function test() {
  const fetchJson = async (url: string, sheetName?: string) => {
    let target = url.replace('/edit?usp=sharing', '');
    target = target.replace('/edit', '');
    const gvizUrl = `${target}/gviz/tq?tqx=out:json` + (sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '');
    
    try {
      const res = await fetch(gvizUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let text = await res.text();
      // gviz returns google.visualization.Query.setResponse({...});
      // We extract the JSON inside {...}
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        if (parsed.table) {
          const cols = parsed.table.cols.map((c: any) => c.label || c.id || '');
          const rows = (parsed.table.rows || []).slice(0, 3).map((r: any) => r.c.map((cell: any) => cell ? cell.v : ''));
          console.log(`\nSheet name: [${sheetName || 'default'}]`);
          console.log(`Cols:`, cols);
          console.log(`Rows match preview (first 3):`, rows);
        } else {
          console.log(`No table found in response:`, Object.keys(parsed));
        }
      } else {
        console.log(`Match failed for JSON pattern`);
      }
    } catch (err: any) {
      console.error(`Error:`, err.message);
    }
  };

  const sheet1Url = 'https://docs.google.com/spreadsheets/d/1YJ-MZAwcRyaR4aragBIqFBQwrH4g4yoXpWtwK_NHSzs';
  const sheet2Url = 'https://docs.google.com/spreadsheets/d/15dV2ITE637HAtpG490XhGdj20TkB3DcNgC7zjgrYbjc';

  console.log('-- Spreadsheet 1 --');
  await fetchJson(sheet1Url, 'Заказы');
  await fetchJson(sheet1Url, 'Бухучет');
  
  console.log('-- Spreadsheet 2 --');
  await fetchJson(sheet2Url, 'Not paid parcels');
}

test();
