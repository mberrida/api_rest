const express = require('express');
const app = express();
const { make_CRUD, crud } = require('./_abstract_CRUD')
const { column, column_link, dao } = require('./_abstract_DAO')


async function main(){

    let user_DAO = await dao({
        table_name: 'User',
        identifier_column: 'id',
        columns: [
            column('id', 'integer'),
            column('email', 'text'),
            column('password', 'text'),
        ]
    }).build_table_before()


    let restaurant_DAO = await dao({
        table_name: 'Restaurant',
        identifier_column: 'id',
        columns: [
            column('id', 'integer'),
            column_link('user', 'int', user_DAO),
            column('name', 'text'),
            column('postal_address', 'text')
        ]
    }).build_table_before()
//
    let customer_DAO = await dao({
        table_name: "Customer",
        identifier_column: 'id',
        columns:[
            column('id','integer'),  // serial is auto increment integer
            column_link('user','int', user_DAO),
            column('name', 'varchar(255)'),
            column('phone_number', 'varchar(16) unique'),
            column('postal_adress', 'text'),
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
            column('id','integer'),,
            column_link('customer','int', customer_DAO),
            column_link('deliveryman','int', deliveryman_DAO),
            column_link('restaurant', 'int', restaurant_DAO),
        ],
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
//

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


    // Middleware pour vérifier le rôle de l'utilisateur
const checkUserRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.headers['user-role']; 

        if (roles.includes(userRole)) {
            
            next();
        } else {
            
            res.status(403).json({ message: "Permission denied. Insufficient role." });
        }
    };
};
    
    crud(app, restaurant_DAO)
    crud(app, couvert_DAO)
    crud(app, user_DAO, {
        get: {
            middlewares: [
                checkUserRole(['customer', 'restaurant', 'deliveryman']),
                (req, res, next) => {

                    console.log('Middleware for User GET route');
                    next()
                }
            ]
        }
    })


}

app.use(express.json());

main()


app.listen(3000, () => {
    console.log('Server is listening on port 3000...');
});