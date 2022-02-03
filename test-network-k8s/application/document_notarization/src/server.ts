import App from './app';
import { cleanUp } from './services/jobs.service';

const app = new App();

app.listen();

process.on('uncaughtException', async function (exception) {
  console.log(exception);
  await cleanUp();
});
