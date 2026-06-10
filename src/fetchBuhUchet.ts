import { getGoogleSheetsCSVUrl } from './dataStore';

async function test() {
  const url = 'https://docs.google.com/spreadsheets/d/1YJ-MZAwcRyaR4aragBIqFBQwrH4g4yoXpWtwK_NHSzs';
  const csvUrl = getGoogleSheetsCSVUrl(url, 'Новый Бух. учёт');
  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const lines = text.split('\n');
    console.log('Tab [Новый Бух. учёт] fetch success!');
    console.log('Headers:', lines[0]);
    console.log('Row 1:', lines[1]);
    console.log('Row 2:', lines[2]);
    console.log('Row 3:', lines[3]);
    console.log('Row 4:', lines[4]);
  } catch (err: any) {
    console.error('Error fetching tab [Новый Бух. учёт]:', err.message);
  }
}
test();
