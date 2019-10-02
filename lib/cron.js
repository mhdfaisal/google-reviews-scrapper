import cron from 'node-cron';
import { runCron } from './webScrapper';

cron.schedule(`*/3 * * * *`, () => {
  console.log(`⏲️ RUNNING THE CRON`);
  runCron();
});