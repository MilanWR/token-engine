import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Token Engine API',
            version: '1.0.0',
            description: 'A Hedera-based API for managing consent NFTs, data capture NFTs, and incentive tokens',
            contact: {
                name: 'API Support',
                url: 'https://github.com/yourusername/token-engine-api'
            }
        },
        servers: [
            {
                url: 'https://orca-app-6wesd.ondigitalocean.app',
                description: 'Production server'
            },
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key'
                }
            }
        },
        security: [{
            ApiKeyAuth: []
        }]
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'] // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec; 