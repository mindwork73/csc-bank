async function searchKeywords() {
  const url = 'https://docs.google.com/spreadsheets/d/1YJ-MZAwcRyaR4aragBIqFBQwrH4g4yoXpWtwK_NHSzs/htmlview';
  try {
    const res = await fetch(url);
    const html = await res.text();
    console.log('Includes "Заказы":', html.includes('Заказы'));
    console.log('Includes "Бухучет":', html.includes('Бухучет'));
    console.log('Includes "Бух учет":', html.includes('Бух учет'));
    console.log('Includes "Илья":', html.includes('Илья'));
    console.log('Includes "Миша":', html.includes('Миша'));
    console.log('Includes "Дедус":', html.includes('Дедус'));
    console.log('Includes "Общак":', html.includes('Общак'));

    // Let's print out all occurrences of sheets in json inside the html
    const jsonMatch = html.match(/"sheets"\s*:\s*\[([\s\S]*?)\]/);
    if (jsonMatch) {
      console.log('Found sheets payload:', jsonMatch[0]);
    } else {
      console.log('No sheets key in html');
      // Look for sheet buttons in the raw text
      const bMatches = html.match(/class="[^"]*btn[^"]*"[^>]*>([^<]+)/g);
      if (bMatches) {
        console.log('Buttons:', bMatches.slice(0, 10));
      }
    }
  } catch (err: any) {
    console.error(err);
  }
}
searchKeywords();
