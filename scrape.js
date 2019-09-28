const axios = require('axios');
const cheerio = require('cheerio');

const scrape = async ()=>{
    const res = await axios.get("https://www.google.com/maps/search/swiss-qube");

    const html = res.data;
    const $ = cheerio.load(html);
    console.log(html)
}

scrape();