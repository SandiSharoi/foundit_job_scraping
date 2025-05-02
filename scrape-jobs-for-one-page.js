const puppeteer = require('puppeteer'); // Import Puppeteer for browser automation
const fs = require('fs'); // Import fs to write JSON file

(async () => { //Starts an Immediately Invoked Async Function Expression (IIFE) so you can use await inside.
    console.log('🚀 Launching browser...');
    
    //Launches a new browser instance:
    const browser = await puppeteer.launch({
        headless: false, // Show browser for debugging; use true to hide
        defaultViewport: null // Use full screen browser viewport
    });

    const page = await browser.newPage(); // Open a new tab

    //Stores the URL you want to scrape into a variable.
    const url = 'https://www.foundit.sg/srp/results?sort=1&limit=15&query=%22%22&quickApplyJobs=true&searchId=57abc79d-ba59-493c-87dd-2ae61cf20355&industries=information+technology%2Csoftware%2Csoftware+engineering%2Cit+management';

    console.log('🌐 Navigating to URL...');
    //Navigates to the target URL and waits until the DOM is fully loaded.
    await page.goto(url, {
        waitUntil: 'domcontentloaded', // Wait for page DOM to load
        timeout: 0 // No timeout limit
    });

    console.log('⏳ Waiting for job cards to load...');
    //Waits up to 60 seconds for the job card containers to appear in the DOM.
    await page.waitForSelector('.srpResultCardContainer', { timeout: 60000 });

    console.log('🔍 Scraping job data...');
    //Executes the function inside the page (in the browser context) to extract DOM content.
    const jobs = await page.evaluate(() => {
        
        //Selects all job cards and initializes an array to store job info.
        const cards = document.querySelectorAll('.srpResultCardContainer'); // Select all job cards
        const jobList = [];

        //Loops through each job card.
        cards.forEach(card => {
            // Extract job title, trimming whitespace and defaulting to an empty string if not found.
            const title = card.querySelector('.jobTitle')?.innerText?.trim() || '';

            // Extract company name from a <p> tag inside .companyName.
            const company = card.querySelector('.companyName p')?.innerText?.trim() || '';

            // Extract job location
            const location = card.querySelector('.cardBody .details.location')?.innerText?.trim() || '';

            //Initializes placeholders for experience and salary.
            let experience = '';
            let salary = '';

            // Get both experience and salary from similar structure under the .experienceSalary section.
            const rows = card.querySelectorAll('.experienceSalary .bodyRow');

            //Checks the contents of each .bodyRow to identify if it's for experience (by looking for "year") or salary (by looking for "$" or "SGD").
            rows.forEach(row => {
                const text = row.querySelector('.details')?.innerText?.trim() || '';

                // Detect experience text
                if (/year/i.test(text)) {
                    experience = text;
                }
                // Detect salary text
                else if (/(\$|SGD)/i.test(text)) {
                    salary = text;
                }
            });

            // Only add job if title is found
            if (title) {
                jobList.push({ title, company, location, experience, salary });
            }
        });

        //Ends the loop and returns the full array of job listings.
        return jobList;
    });

    console.log(`✅ Scraped ${jobs.length} job(s). Saving to jobs.json...`);
    //Writes the job data to a JSON file named jobs.json with nice indentation.
    fs.writeFileSync('jobs.json', JSON.stringify(jobs, null, 2)); // Save as pretty JSON

    console.log('📁 Done. Output saved in jobs.json');
    //Closes the browser and ends the script.
    await browser.close(); // Close the browser
})();
