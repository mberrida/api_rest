const { Column } = require('./_abstract_DAO')
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

function connect_DB(){
}

async function query(sql, params = []){
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err, result) => {
            console.log('Executing: ', sql, params, '->')
            console.log(err, result)
            resolve({err, result})
        })
    })
}

async function select_one(sql, params = []){
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            console.log('Executing: ', sql, params, '->')
            console.log(err, result)
            resolve({err, result})
        })
    })
}

async function select_many(sql, params = []){
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, result) => {
            console.log('Executing: ', sql, params, '->')
            console.log(err, result)
            resolve({err, result})
        })
    })
}


/**
 * 
 * @param {*} table_name 
 * @param {[Column]} columns 
 * @param {*} primary_key 
 */
async function make_table(table_name, columns, primary_key){
    await query(`
    CREATE TABLE IF NOT EXISTS ${table_name} (
        ${columns.map((column) => `${column.name} ${column.type} ${(column.name === primary_key) ? `primary key AUTOINCREMENT` : ''}`).join(',\n')}
    );
    `)
}



async function get_last_inserted_object(table_name, identifier){
    let {err, result} = await select_one(`SELECT * from ${table_name} order by ${identifier} DESC limit 1`)

    if(err)console.error(err)

    return result;
}

module.exports = { make_table, query, get_last_inserted_object, select_many, select_one }