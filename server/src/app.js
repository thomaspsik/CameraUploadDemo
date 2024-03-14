import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import testRoute from './api/routes/test.js';

const dirname = path.resolve();

const app = express();

app.use(cors());

app.use(express.static(path.join(dirname, '/public')));
app.use(express.json());

app.use('/test', testRoute);

// route without router
app.post('/upload-image', (req, res) => {
  // length of content that should be saved
  // console.log(req.body.image.length);
  let filename = 'upload';
  // if no filename was specified use "upload" as filename
  if (req.body.filename) {
    filename = req.body.filename;
  }
  // CAREFULL - the image could be something else than a jpg (eg png) !!!
  const finalFilename = `${filename}.jpg`;

  // CAREFULL - writting images to public means that *any* client can access the image!!!
  fs.writeFileSync(`./public/${finalFilename}`, Buffer.from(req.body.image, 'base64'));
  res.send(`file [${finalFilename}] written.`);
});

const PORT = 3000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
