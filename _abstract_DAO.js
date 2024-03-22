const { query, make_table, get_last_inserted_object, select_one, select_many } = require("./DBHelper")

const global_DAOs = []

class DAO{
     
    constructor(DAO_config){
        this.config = DAO_config
        this._check_config(this.config)
       
    }
    

    async build_table_before(){
        await make_table(this.config.table_name, this.config.columns, this.config.identifier_column)

        return this
    }

    _check_config(config){

        if(!config){
            throw new Error('No config provided')
        }

        if(!config.identifier_column){
            console.warn('No identifier provided in config')
        }

        if(!config.table_name){
            throw new Error('No table name provided in config')
        }

        if(!config.columns){
            throw new Error('No columns provided in config')
        }

    }

    get_config(attribute){
        return this.config[attribute]
    }

   /* _check_object(object){
    
        for (let key of Object.keys(object)){

            if(!this.config.columns.contains(key))throw new Error('Trying to modify wrong object')

        }

    }*/
    _check_object(object) {
        const objectKeys = Object.keys(object);
        const allowedColumns = this.config.columns.map(column => column.name);
    
        for (const key of objectKeys) {
            if (!allowedColumns.includes(key)) {
                throw new Error(`Trying to modify wrong object. Invalid column: ${key}`);
            }
        }
    }
    

    is_table_in(linked_table_name){

    }

    async get(identifier){

        let { error, result } = await select_one(`SELECT * FROM ${this.config.table_name} WHERE ${this.config.identifier_column} = ?`, [identifier])

        if (result){
            for (let column of this.config.columns){

                if (column.has_link_connection()){

                    result[column.name] = (await column.get_DAO().get(result[column.name]))

                }

            }
        }

        if(error)throw new Error(error)
        
        return result
    }

    async getAll(){
        let { error, results } = await select_many(`SELECT * FROM ${this.config.table_name}`)

        if (results.length > 0){

            for (let result of results){
                for (let column of this.config.columns){

                    if (column.has_link_connection()){
    
                        result[column.name] = (await column.get_DAO().get(result[column.name]))
    
                    }
    
                }
            }

        }

        if(error)throw new Error(error)
        
        return results
    }
    async  findByEmailAndPassword(email, password) {
        try {
            const { error, result } = await query(
                `SELECT * FROM User WHERE email = ? AND password = ?`,
                [email, password]
            );
    

            if (error || !result) {
                return null;
            }
    

            return result;
        } catch (error) {

            throw new Error(error.message);
        }
    }

    async add(object){

        //this._check_object(object)

        let columns_names = this.config.columns.map((col) => col.name)

        for (let column of this.config.columns){

            if (column.has_link_connection()){

                if (typeof object[column.name] === 'object'){

                    object[column.name] = (await column.get_DAO().add(object[column.name])).inserted?.[column.get_DAO().config.identifier_column] ?? null
    
                }else if (!(await column.link_exist(object[column.name]))){
    
                    throw new Error(`While inserting on ${this.config.table_name}, No ${column.get_DAO().config.table_name} with identifier = ${object[column.name]}.`)
                }
    
            }
            
        }

        let identifier_removed = columns_names.filter((name) => name != this.config.identifier_column)

        let { error, result } = await query(`INSERT INTO ${this.config.table_name} (${identifier_removed.join(',')}) VALUES (${identifier_removed.map(val => '?').join(',')});`, [...identifier_removed.map(name => object[name])])
        
        return {error, inserted: await get_last_inserted_object(this.config.table_name, this.config.identifier_column)}
    }
    

    async delete(identifier){
        let { error, result } = await select_many(`DELETE FROM ${this.config.table_name} WHERE ${this.config.identifier_column} = ?`, [identifier])

        if(error)throw new Error(error)
        
        return true
    }

//UPDATE object 
    async update(identifier, updated_object) {
        try {
            // Ensure the provided object is valid based on the configured columns
            this._check_object(updated_object);
    
            // Create the SET clause for the update query
            const setClause = Object.keys(updated_object)
                .filter(key => key !== this.config.identifier_column)
                .map(key => `${key} = ?`)
                .join(', ');
    
            // Build and execute the update query
            const { error, result } = await query(
                `UPDATE ${this.config.table_name} SET ${setClause} WHERE ${this.config.identifier_column} = ?`,
                [...Object.values(updated_object).filter(val => val !== updated_object[this.config.identifier_column]), identifier]
            );
    
            if (error) {
                throw new Error(error);
            }
    
            return true;
        } catch (error) {
            throw new Error(`Error updating record: ${error.message}`);
        }
    }

    async get_where(condition){
        
        let query = `SELECT * FROM ${this.config.table_name} WHERE ${Object.keys(condition).map((key) => `${key} = ?`).join(" AND ")};`

        let { error, result } = await select_one(query, Object.keys(condition).map(key => condition[key]))

        if (result){
            for (let column of this.config.columns){

                if (column.has_link_connection()){

                    result[column.name] = (await column.get_DAO().get(result[column.name]))

                }

            }
        }

        if(error)console.error(error);

        return result;

    }

    
    
    async get_all_where(condition){
        
        let query = `SELECT * FROM ${this.config.table_name} WHERE ${Object.keys(condition).map((key) => `${key} = ?`).join(" AND ")};`

        let { error, results } = await select_many(query, Object.keys(condition).map(key => condition[key]))

        if (results.length > 0){

            for (let result of results){
                for (let column of this.config.columns){

                    if (column.has_link_connection()){
    
                        result[column.name] = (await column.get_DAO().get(result[column.name]))
    
                    }
    
                }
            }

        }

        if(error)console.error(error);

        return results;

    }
    
    

}

class Column{

    /**
     * 
     * @param {*} name 
     * @param {*} type 
     * @param {DAO} linked_DAO 
     */
    constructor(name, type, linked_DAO){
        this.name = name
        this.type = type
        this.linked_DAO = linked_DAO
    }

    get_DAO(){
        return this.linked_DAO
    }

    has_link_connection(){
        return !!this.linked_DAO
    }

    async link_exist(value){


        if (this.has_link_connection()){
            console.log('checking link')
            let result = await this.linked_DAO.get(value);
    
            return !!result
        }
        return false

    }

}

/**
 * 
 * @param {String} column_name 
 * @param {String} type 
 * @returns {Column}
 */
function column(column_name, type){
    return new Column(column_name, type, null)
}

/**
 * 
 * @param {String} column_name 
 * @param {String} type 
 * @param {DAO} DAO 
 * @returns 
 */
function column_link(column_name, type, DAO){
    return new Column(column_name, type, DAO)
}

function dao(config){

    let created_dao = new DAO(config)

    global_DAOs.push(new DAO(config))

    return created_dao

}

module.exports = {
    dao,
    column,
    column_link,
    DAO,
    Column
}