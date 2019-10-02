import express from 'express';
import cors from 'cors';
import {fetchGoogleReviews} from "./lib/webScrapper";
import './lib/cron';

const app = express();
app.use(cors());


app.get(`/scrape`, async (req, res, next) => {
    //to get the live count anytime we need.
    console.log(`Scrapping your domain....`);
    const data  = await fetchGoogleReviews("e-developers world")
    console.log("data "+data)
    res.json({data})
    process.exit()
  });

  var server = app.listen( process.env.PORT || 3000, function(){
    console.log('Listening on port ' + server.address().port);
  });