import fs from 'fs';
import { chromium } from 'playwright';
import ora from 'ora';
let nbjobs = 0;
let jobListings = [];

async function welcometothejungle() {
    let jobCount = 0;
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' });
    const page = await context.newPage();
    await page.goto('https://www.welcometothejungle.com/fr/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Bcontract_type%5D%5B%5D=internship&refinementList%5Bcontract_type%5D%5B%5D=apprenticeship&refinementList%5Bprofession.category_reference%5D%5B%5D=tech-engineering-3NjUy&query=&page=1&aroundLatLng=45.64997%2C0.15345&aroundRadius=20&aroundQuery=Angoul%C3%AAme%2C%20Charente%2C%20Nouvelle-Aquitaine%2C%20France');
    await page.waitForSelector('[data-testid="jobs-search-results-count"]');
    const resultCount = await page.$eval('[data-testid="jobs-search-results-count"]', el => el.textContent);
    if (resultCount === '0 jobs') {
        console.log('No jobs found');
        await browser.close();
        return;
    }
    jobCount += parseInt(resultCount.match(/\d+/)[0]);
    const listings = await page.$$('li[data-testid="search-results-list-item-wrapper"]');
    for (const listing of listings) {
        const data = await listing.evaluate(node => ({
            title: node.querySelector('h4')?.textContent || '',
            company: node.querySelector('img')?.alt || '',
            location: node.querySelector('.sc-cKccrX.fgMjGS')?.textContent || '',
            link: node.querySelector('a')?.href || '',
            type: node.querySelector('.sc-bXCLTC.eFiCOk')?.textContent || '',
        }));
        jobListings.push(data);
    }
    await browser.close();
    return jobCount;
}

async function hellowork() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' });
    const page = await context.newPage();
    await page.goto('https://www.hellowork.com/fr-fr/emploi/recherche.html?k=&k_autocomplete=&l=Angoul%C3%AAme+16000&l_autocomplete=http%3A%2F%2Fwww.rj.com%2Fcommun%2Flocalite%2Fcommune%2F16015&st=relevance&c=Stage&c=Alternance&cod=all&ray=20&d=all&s=Inform_SSII');

    const jobCount = await page.$eval('.tw-typo-l-bold.sm\\:tw-typo-xl-bold', el => parseInt(el.textContent.match(/\d+/)[0]));
    if (jobCount === 0) {
        console.log('No jobs found');
        await browser.close();
        return;
    }
    nbjobs += jobCount;

    const jobs = await page.evaluate(() => {
        const elements = document.querySelectorAll('[aria-label="liste des offres"] li');
        return Array.from(elements).map(node => ({
            title: node.querySelector('.tw-typo-l.sm\\:small-group\\:tw-typo-l.sm\\:tw-typo-xl')?.textContent?.trim() || '',
            company: node.querySelector('.tw-typo-s.tw-inline')?.textContent?.trim() || '',
            location: node.querySelector('div[data-cy="localisationCard"]')?.textContent?.trim() || '',
            link: node.querySelector('a')?.href || '',
            type: node.querySelector('div[data-cy="contractCard"]')?.textContent?.trim() || '',
        }));
    });
    jobListings.push(...jobs);
    await browser.close();
    return jobCount;
}

async function indeed() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' });
    const page = await context.newPage();

    await page.goto('https://fr.indeed.com/jobs?q=&l=Angoul%C3%AAme+%2816%29&sc=0kf%3Aattr%28CPAHG%7CVDTG7%252COR%29cmpsec%28NKR5F%29%3B&from=searchOnDesktopSerp&vjk=7e68cbd250d77b37')
    const jobCount = await page.$eval('.jobsearch-JobCountAndSortPane-jobCount', el => parseInt(el.textContent.match(/\d+/)[0]));
    if (jobCount === 0) {
        console.log('No jobs found');
        await browser.close();
        return;
    }
    nbjobs += jobCount;
    console.log(jobCount);
    await browser.close();
    return jobCount;
}

async function generateJSONdb() {
    if (!jobListings.length) {
        console.log('No jobs to add to db');
        return;
    }
    if (fs.existsSync('jobs.json')) {
        fs.unlinkSync('jobs.json');
    }
    fs.writeFileSync('jobs.json', JSON.stringify(jobListings, null, 2));
}

async function main() {
    const spinner = ora('Starting...').start();

    spinner.text = 'Getting jobs from welcometothejungle...';
    const wttjJobs = await welcometothejungle();
    spinner.succeed(`Found ${wttjJobs} jobs`);

    spinner.start('Getting jobs from hellowork...');
    const hwJobs = await hellowork();
    spinner.succeed(`Found ${hwJobs} jobs`);

    spinner.start('Getting jobs from meteojob...');
    const mjJobs = await meteojob();
    spinner.succeed(`Found ${mjJobs} jobs`);

    spinner.start('Getting jobs from indeed...');
    const indeedJobs = await indeed();
    spinner.succeed(`Found ${indeedJobs} jobs`);

    spinner.start('Generating JSON database...');
    await generateJSONdb();
    spinner.succeed('Database generated');

    spinner.succeed(`All done! Found a total of ${nbjobs} jobs ;)`);
}

main().catch(console.error);
