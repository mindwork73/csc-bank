async function test() {
  const sheet1Url = 'https://docs.google.com/spreadsheets/d/1YJ-MZAwcRyaR4aragBIqFBQwrH4g4yoXpWtwK_NHSzs/edit?usp=sharing';
  const sheet2Url = 'https://docs.google.com/spreadsheets/d/15dV2ITE637HAtpG490XhGdj20TkB3DcNgC7zjgrYbjc/edit?usp=sharing';

  const discoverTabs = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      
      // Match the sheet names in Google Sheets JSON payload
      // "sheets": [ { "id": 0, "name": "..." } ]
      const regex = /"name"\s*:\s*"([^"]+)"/g;
      const discovered: string[] = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (!discovered.includes(match[1])) {
          discovered.push(match[1]);
        }
      }
      console.log(`Discovered names in ${name}:`, discovered);
    } catch (e: any) {
      console.error(`Error discovering tabs in ${name}:`, e.message);
    }
  };

  await discoverTabs(sheet1Url, 'Spreadsheet 1');
  await discoverTabs(sheet2Url, 'Spreadsheet 2');
}

test();
