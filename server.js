const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const MOYSKLAD_API_URL = 'https://online.moysklad.ru/api/remap/1.2';

app.use(express.json());
app.use(cors());

app.post('/api/getToken', async (req, res) => {
  const username = 'holst@whcombo';
  const password = '482615973';
  const basicAuth = `Basic ${btoa(`${username}:${password}`)}`;

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
  const imagesUrl = `${MOYSKLAD_API_URL}/entity/product/${productID}/images`;
  let image = null;

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
        image = imageData.data.rows[0].miniature.href;
      }
    }
    const product = {
      id: productData.data.id,
      name: productData.data.name,
      description: productData.data.description,
      image: image ? image : null
    };

    res.json(product);
  } catch (error) {
    res.status(error.response.status).json(error.response.data);
  }
});

app.listen(3001, () => {
  console.log('Proxy server is running on port 3001');
});
