const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Replace with your actual Foundit URL
    const url = 'https://www.foundit.sg/search/software-engineering-jobs';
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Scrape job data
    const jobs = await page.evaluate(() => {
        const jobCards = document.querySelectorAll('.job-tuple'); // You may need to update the selector
        const jobList = [];

        jobCards.forEach(card => {
            const titleElement = card.querySelector('h3 a');
            const title = titleElement?.innerText?.trim();
            const link = titleElement?.href;

            
            if (title && link) {
                jobList.push({ title, link });
            }
        });

        return jobList;
    });

    // Save to JSON file
    fs.writeFileSync('jobs.json', JSON.stringify(jobs, null, 2));
    console.log(`✅ Scraped ${jobs.length} jobs and saved to jobs.json`);

    await browser.close();
})();
