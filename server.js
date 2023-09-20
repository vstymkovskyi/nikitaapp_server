const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require("path");

const app = express();

const MOYSKLAD_API_URL = 'https://online.moysklad.ru/api/remap/1.2';
const imagesDirPath = "./images";

const username = 'holst@whcombo';
const password = '482615973';
const basicAuth = `Basic ${btoa(`${username}:${password}`)}`;

async function downloadImage(url, accessToken, filename) {
  const response = await axios.get(url, {
    headers: {
      'Authorization': basicAuth,
      'Accept-Encoding': 'gzip'
    },
  });

  // const image = response;
  console.log(response);

  fs.writeFile(filename, response.data, (err) => {
    if (err) {
      console.error(err);
      throw err;
    }
    console.log('Image downloaded successfully!');
  });
}

function createImagesFolder() {
  // Create the directory if it does not exist
  if (!fs.existsSync(imagesDirPath)) {
    fs.mkdirSync(imagesDirPath);
  }
}


app.use(express.json());
app.use(cors());

app.post('/api/getToken', async (req, res) => {
  try {
    const response = await axios.post(`${MOYSKLAD_API_URL}/security/token`, req.body, {
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response.status).json(error.response.data);
  }
});

app.post('/api/getProducts', async (req, res) => {
  const accessToken = req.body.accessToken;

  try {
    const productData = await axios.get(`${MOYSKLAD_API_URL}/entity/product?limit=5`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json(productData.data.rows);
  } catch (error) {
    res.status(error.response.status).json(error.response.data);
  }
});

app.post('/api/getProduct', async (req, res) => {
  const productID = req.body.productID;
  const accessToken = req.body.accessToken;
  // const productID = '0001333b-208d-11ed-0a80-039f002c3693';
  const url = `${MOYSKLAD_API_URL}/entity/product/${productID}`;
  const imagesUrl = `${MOYSKLAD_API_URL}/entity/product/${productID}/images?limit=1`;
  const serverUrl = req.protocol + '://' + req.get('host');
  let imagePath = null;

  try {
    const productData = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (productData) {
      const imageData = await axios.get(imagesUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (imageData?.data.rows) {
        const imageObj = imageData.data.rows[0];
        let downloadImageUrl = imageObj.meta.downloadHref;

        const imageDir = `${imagesDirPath}/${productID}`;
        // Create the directory if it does not exist
        if (!fs.existsSync(imageDir)) {
          fs.mkdirSync(imageDir);
        }
        imagePath = path.join(imageDir, imageObj.filename);

        await downloadImage(downloadImageUrl, accessToken, imagePath);
      }
    }
    const product = {
      id: productData.data.id,
      name: productData.data.name,
      description: productData.data.description,
      image: imagePath ? `${serverUrl}/${imagePath}` : null
    };

    res.json(product);
  } catch (error) {
    console.error(error);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(404).json({error: 'error'});
  }
});

app.listen(3001, () => {
  console.log('Proxy server is running on port 3001');
  createImagesFolder();
});
