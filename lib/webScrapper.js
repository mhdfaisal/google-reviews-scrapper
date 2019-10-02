const puppeteer = require("puppeteer");
const axios = require("axios");
import { domains } from "./util/domains";
export async function fetchGoogleReviews(domain) {
  const URL = `https://google.com/maps/search/${domain}`;
  let result = [];
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage({ timeout: 0 });
    await page.setViewport({ width: 320, height: 600 });
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 9_0_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13A404 Safari/601.1"
    );

    await page.on("console", msg => console.log("PAGE LOG:", msg.text()));

    await page.goto(URL, { waitUntil: "networkidle0", timeout: 0 });

    //new code start

    await page.addScriptTag({
      url: "https://code.jquery.com/jquery-3.2.1.min.js"
    });

    //no thanks click
    await clickOnNoThanks(page);

    //arrow expander click
    await clickOnArrowExpander(page);

    //wait for total reviews
    await page.waitForSelector(
      "div.ml-panes-entity-ratings-histogram-summary-reviews-number"
    );

    //see more button click
    let trc = await page.evaluate(async () => {
      return Number(
        document
          .querySelector(
            ".ml-panes-entity-ratings-histogram-summary-reviews-number"
          )
          .textContent.split(" ")[0]
      );
    });
    console.log(`Total reviews count for domain ${domain}: ${trc}`);
    if (trc > 8) {
      await clickOnSeeMoreBtn(page);
      await page.waitFor(3000);
      await page.waitForSelector(
        ".visible > .ml-reviews-page > .ml-reviews-page-white-background"
      );
      await autoScroll(page);
    }

    await page.waitForSelector("div.ml-reviews-page-user-review-container");

    await page.waitFor(3000);

    result = await page.evaluate(async () => {
      try {
        var data = [];
        $("div.ml-reviews-page-user-review-container").each(function() {
          const name = $(this)
            .find(".ml-reviews-page-user-review-name")
            .text();
          const date = $(this)
            .find(".ml-reviews-page-user-review-publish-date")
            .text();
          const ratings = $(this)
            .find(".ml-rating-stars-container")
            .attr("aria-label");
          let text = $(this)
            .find(".ml-reviews-page-user-review-text")
            .text()
            .toString();
          text =
            text.lastIndexOf("(Original)\n") !== -1
              ? text.substring(
                  text.lastIndexOf("(Original)\n") + 11,
                  text.length
                )
              : text;

          data.push({
            name: name,
            date: date,
            ratings: ratings,
            text: text
          });
        });
        return data;
      } catch (err) {
        return err.toString();
      }
    });

    await browser.close();
    // console.log("local res", result);
    // process.exit();
  } catch (err) {
    console.error(err);
    return await err;
    // process.exit();
  }
  return (await result.length) > 8 ? result.slice(8, result.length) : result;
}

async function clickOnNoThanks(page) {
  await page.waitForSelector(
    ".ml-promotion-action-row-right > .ml-promotion-action-container > .ml-promotion-no-button > span > span"
  );

  await page.click(
    ".ml-promotion-action-row-right > .ml-promotion-action-container > .ml-promotion-no-button > span > span"
  );

  // console.log("Clicked on no thanks");
}

async function clickOnArrowExpander(page) {
  await page.waitForSelector(".ml-panes-entity-toggle");
  await page.waitFor(3000);
  await page.click("button.ml-panes-entity-expander");
  // console.log("clicked on arrow expander");
}

async function clickOnSeeMoreBtn(page) {
  await page.waitFor(3000);
  await page.waitForSelector(
    ".ml-panes-entity-white-background > div > span > .ml-panes-entity-reviews-container > .ml-panes-entity-more-reviews"
  );
  await page.waitFor(3000);
  await page.click(
    ".ml-panes-entity-white-background > div > span > .ml-panes-entity-reviews-container > .ml-panes-entity-more-reviews"
  );
  // console.log("clicked on see more button");
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    const scrollable_section = ".ml-reviews-page-white-background";
    const scrollableSection = document.querySelector(scrollable_section);

    await new Promise((resolve, reject) => {
      // console.log("Collecting reviews .....");
      let cnt = 1;
      var timer = setInterval(() => {
        // console.log("executing");
        let trc = Number(
          document
            .querySelector(
              ".ml-panes-entity-ratings-histogram-summary-reviews-number"
            )
            .textContent.split(" ")[0]
        );
        // console.log("Total reviews count" + " " + trc);

        let loadMoreLoader = document.querySelector(
          ".ml-reviews-page-white-background div.ml-reviews-page-user-review-loading"
        ).style.display;

        let totalReviewCount = trc > 8 ? Math.floor(trc / 8) : trc;

        let x = document.querySelector(
          ".ml-reviews-page-white-background div:nth-child(2)"
        ).lastElementChild.offsetTop;
        // console.log("hot reloading for more reviews");
        scrollableSection.scrollTop = x;
        cnt++;
        if (cnt > totalReviewCount && loadMoreLoader !== "") {
          clearInterval(timer);
          // console.log("Finishing reviews collection");
          resolve();
        }
      }, 3000);
    });
  });
}

export async function runCron() {
  console.log(`Scrapping data for domains....`);
  // console.log(domains[0]) promises
  let count =0;
  domains.forEach(domain => {
    (async (domain) => {
      const data = await fetchGoogleReviews(domain);
      count++;
      const postResult = await postDataToEndpoint(data);
      console.log(postResult+" for "+domain)
      if(count > domains.length-1){
        done();
      }
    })(domain);
  });
  // res.json({ data });
  // process.exit();
}

async function done(){
  console.log("Scraping done successfully!");
  process.exit()
}

async function postDataToEndpoint(data){
  try{
    // console.log(data)
    const res = await axios.post("https://jsonplaceholder.typicode.com/posts",{
      data:data
    })
    console.log(res.status)
    return "data posted successfully"
  }
  catch(err){
    return err.message
  }
}