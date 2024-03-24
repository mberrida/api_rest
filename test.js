require('dotenv').config()
const express = require('express');
const { specs, swaggerUi } = require('./swagger');
const app = express();
const { make_CRUD, crud } = require('./_abstract_CRUD')
const { column, column_link, dao } = require('./_abstract_DAO')
const { graphqlHTTP } = require('express-graphql');
const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql');
const jwt = require('jsonwebtoken');


const secretKey = process.env.JWT_SECRET;


const ROLE_RESTAURANT = "restaurant"
const ROLE_COSTUMER = "costumer"
const ROLE_DELEVERY_MAN = "deleveryman"


async function main(){

    let user_DAO = await dao({
        table_name: 'User',
        identifier_column: 'id',
        columns: [
            column('id', 'integer'),//45
            column('email', 'text'),
            column('role', 'text'),// -> [resta, cost]
            column('name', 'text'), // Robert LE POTO
            column('postal_address', 'text'),
            column('phone_number', 'text'),
            column('password', 'text'),
        ]
    }).build_table_before()

    // /user/4 -> {email....,......} ->

    let restaurant_DAO = await dao({
        table_name: 'Restaurant',
        identifier_column: 'id',
        columns: [
            column('id', 'integer'),
            column_link('user', 'int', user_DAO),
            //column('name', 'text'), // Macdo
            //column('postal_address', 'text') // Vannes, 56
        ]
    }).build_table_before()

//
    let customer_DAO = await dao({
        table_name: "Customer",
        identifier_column: 'id',
        columns:[
            column('id','integer'),  // serial is auto increment integer
            column_link('user','int', user_DAO),
            //column('name', 'varchar(255)'),
            //column('phone_number', 'varchar(16) unique'),
           //column('postal_adress', 'text'),
        ],
    }).build_table_before()

    let deliveryman_DAO = await dao({
        table_name: "Deliveryman",
        identifier_column: 'id',
        columns:[
            column('id','integer'),
            column_link('user','int', user_DAO),
        ]
    }).build_table_before()

    let delivery_DAO = await dao({
        table_name:'Delivery',
        identifier_column:'id',
        columns:[
            column('id','integer'),
            column_link('customer','int', customer_DAO),
            column_link('deliveryman','int', deliveryman_DAO),
            column_link('restaurant', 'int', restaurant_DAO),
        ],
    }).build_table_before()

   

    let couvert_DAO = await dao({
        table_name: 'Couvert',
        identifier_column: 'id',
        columns: [
            column('id', 'integer'),
            column('type', 'text'),
            column_link('restaurant', 'int', restaurant_DAO)
        ]
    }).build_table_before()

    
    let menus_DAO = await dao({
        table_name: 'Menus',
        identifier_column: 'id',
        columns: [
            column('id', 'integer'),
            column_link('restaurant', 'int', restaurant_DAO),
        ]
    }).build_table_before()    


    let dishes_DAO = await dao({
        table_name: 'Dishes',
        identifier_column: 'id',
        columns: [
            column('id', 'integer'),
            column('name', 'text'),
            column_link('restaurant', 'integer', restaurant_DAO),
            column_link('menu', 'integer', menus_DAO),
            column('prix', 'integer')
        ]
    }).build_table_before()

    let orderitem_DAO  = await dao({
        table_name:"OrderItem",
        identifier_column:false,
        columns:[
            column_link('delivery', 'int', delivery_DAO),
            column_link('dishes','int', dishes_DAO),
            column_link('menus','int',menus_DAO),
            column('amount','integer'),
            column('price','integer')
        ]
    }).build_table_before()



    // Middleware pour vérifier le rôle de l'utilisateur
const checkUserRole = (roles) => {
    return (req, res, next) => {
        const bearer_token = req.headers['Authorization']; 

        let [token_type, token] = bearer_token.split(' ')

        if(token_type !== "Bearer")return res.status(403);//check if the token is a Bearer token type

        let user_data = jwt.decode(token)

        if (roles.includes(user_data.role)) {
            
            next();
        } else {
            
            res.status(403).json({ message: "Permission denied. Insufficient role." });
        }
    };
};


/**
 * @swagger
 * /restaurants/{id}:
 *   put:
 *     description: Met à jour un restaurant existant dans la base de données
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID du restaurant à mettre à jour
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               postal_address:
 *                 type: string
 *               // Ajoutez d'autres propriétés du restaurant à mettre à jour ici
 *     responses:
 *       200:
 *         description: Restaurant mis à jour avec succès
 *       400:
 *         description: Données du restaurant manquantes ou incorrectes
 *       404:
 *         description: Restaurant non trouvé
 *       500:
 *         description: Erreur interne du serveur lors de la mise à jour du restaurant
 */
    crud(app, customer_DAO, {
        put: {
            middlewares: [checkUserRole([ROLE_COSTUMER])]
        },
        get: {
            middlewares: [checkUserRole([ROLE_COSTUMER])]
        },
        delete: {
            middlewares: [checkUserRole([ROLE_COSTUMER])]
        }
    })
    crud(app, restaurant_DAO, {
        delete: {
            middlewares: [checkUserRole([ROLE_RESTAURANT])]
        },
        put: {
            middlewares: [checkUserRole([ROLE_RESTAURANT])]
        }
    })
    crud(app, menus_DAO, {
        post: {
            middlewares: [
                checkUserRole([ROLE_RESTAURANT])
            ]
        },
        put: {
            middlewares: [
                checkUserRole([ROLE_RESTAURANT])
            ]
        },
        delete: {
            middlewares: [
                checkUserRole([ROLE_RESTAURANT])
            ]
        }
    })
    crud(app, deliveryman_DAO, {
        get: {
            middlewares: [checkUserRole([ROLE_DELEVERY_MAN])]
        },
        delete: {
            middlewares: [checkUserRole([ROLE_DELEVERY_MAN])]
        },
        put: {
            middlewares: [checkUserRole([ROLE_DELEVERY_MAN])]
        }
    })
    crud(app, delivery_DAO, {
        get: {
            middlewares: [checkUserRole([ROLE_COSTUMER])]
        },
        post: {
            middlewares: [checkUserRole([ROLE_COSTUMER])]
        },
        delete: {
            middlewares: [checkUserRole([ROLE_COSTUMER, ROLE_RESTAURANT])]
        }
    })
    crud(app, user_DAO)

    /*app.post('/inscription',async (req, res) => {

        let { user_data, restaurant_data, customer_data, delivery_data} = req.body

        let {error, inserted} = await user_DAO.add(user_data)

        if(error)return res.sendStatus(401);

        if(restaurant_data){

            restaurant_data['user'] = inserted.id
            let {error } = await restaurant_DAO.add(restaurant_data);

            if(error)return res.sendStatus(401)
        }

        res.sendStatus(200);
    })*/



    /**
 * @swagger
 * /auth:
 *   post:
 *     description: Authentification d'un utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentification réussie
 *       400:
 *         description: L'email et le mot de passe sont requis
 *       401:
 *         description: Email ou mot de passe incorrect
 *       500:
 *         description: Erreur interne du serveur
 */
    app.post('/auth', async (req, res) => {
        const { email, password } = req.body;
    
        if (!email || !password) {
            return res.status(400).json({ message: "L'email et le mot de passe sont requis." });
        }
    
        try {

            const user = await user_DAO.get_where({email, password});
 
            if (!user) return res.status(401).json({ message: "Email ou mot de passe incorrect." });
            
            const token = jwt.sign(user, secretKey, { expiresIn: '1h' });

            return res.status(200).json({ message: "Authentification réussie.", token, username: user.name });
        } catch (error) {
            console.error("Erreur lors de l'authentification :", error);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
    });

    /**
 * @swagger
 * /user/{id}:
 *   get:
 *     description: Récupère un utilisateur par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de l'utilisateur à récupérer
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Succès de la requête
 *       404:
 *         description: Utilisateur non trouvé
 */
app.get('/user/:id', (req, res) => {
    
});
  
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        hello: {
          type: GraphQLString,
          resolve: () => 'Hello GraphQL!'
        }
      }
    })
  });
  app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true
  }));
  
  
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    
}

app.use(express.json());

main()


app.listen(3000, () => {
    console.log('Server is listening on port 3000...');
});