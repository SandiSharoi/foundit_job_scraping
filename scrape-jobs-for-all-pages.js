const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: false, // Set to true if you don't want the browser to open
    defaultViewport: null
  });

  const page = await browser.newPage();

  // Base URL without the `start` parameter, which we'll dynamically update per page
  const baseUrl = 'https://www.foundit.sg/srp/results?sort=1&limit=15&query=%22%22&quickApplyJobs=true&industries=information+technology%2Csoftware%2Csoftware+engineering%2Cit+management';

  let start = 0; // Pagination offset: 0, 15, 30, ...
  const limit = 15; // Items per page
  const allJobs = []; // Store jobs from all pages

  while (true) {
    const url = `${baseUrl}&start=${start}`;
    console.log(`🌐 Navigating to page starting at ${start}...`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });

    // Wait for job cards or detect if no jobs are returned
    try {
      await page.waitForSelector('.srpResultCardContainer', { timeout: 15000 });
    } catch (err) {
      console.log(`❌ No job cards found on page starting at ${start}. Ending scraping.`);
      break;
    }

    console.log('🔍 Scraping job data...');
    const jobs = await page.evaluate(() => {
      const cards = document.querySelectorAll('.srpResultCardContainer');
      const jobList = [];

      cards.forEach(card => {
        const title = card.querySelector('.jobTitle')?.innerText?.trim() || '';
        const company = card.querySelector('.companyName p')?.innerText?.trim() || '';
        const location = card.querySelector('.cardBody .details.location')?.innerText?.trim() || '';

        let experience = '';
        let salary = '';
        const rows = card.querySelectorAll('.experienceSalary .bodyRow');

        rows.forEach(row => {
          const text = row.querySelector('.details')?.innerText?.trim() || '';
          if (/year/i.test(text)) experience = text;
          else if (/(\$|SGD)/i.test(text)) salary = text;
        });

        if (title) {
          jobList.push({ title, company, location, experience, salary });
        }
      });

      return jobList;
    });

    console.log(`✅ Page ${start / limit + 1}: Scraped ${jobs.length} job(s).`);
    
    if (jobs.length === 0) {
      console.log('🚫 No jobs found. Ending scraping.');
      break;
    }

    allJobs.push(...jobs); // Add to master list
    start += limit; // Move to next page
  }

  console.log(`💾 Saving total ${allJobs.length} jobs to jobs.json...`);
  fs.writeFileSync('all-jobs.json', JSON.stringify(allJobs, null, 2));

  console.log('✅ Done. Output saved in all-jobs.json');
  await browser.close();
})();
