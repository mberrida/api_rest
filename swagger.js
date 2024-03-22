const swagger = require('./swagger').default;
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Votre API UberEats',
        version: '1.0.0',
        description: 'Documentation de votre API UberEats',
      },
      servers: [
        {
          url: 'http://localhost:3000',
        },
      ],
    },
    apis: ['./test.js'],
  };
  
  const specs = swaggerJsdoc(options);

  module.exports = { specs, swaggerUi };