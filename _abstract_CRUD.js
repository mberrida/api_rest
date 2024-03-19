const { Express } = require('express')
const { DAO } = require('./_abstract_DAO')

class CRUD{

    /**
     * 
     * @param {Express} express_server 
     * @param {DAO} DAO
     * @param {JSON} config 
     */
    constructor(express_server, DAO, config){
        this.express_server = express_server
        this.table_name = DAO.get_config('table_name')
        this.DAO = DAO;
        
        this._make_base_path('post', DAO, config, async (req, res) => {

            let object_to_add = req.body

            if (config?.format_params){
                object_to_add = config.format_params(object_to_add)
            }

            let { err, message } = await this.DAO.add(object_to_add)


            res.sendStatus(200)
        })
        

        this._make_base_path('get', DAO, config, async (req, res) => {

            let params = req.params

            if (config?.format_params){
                params = config.format_params(params)
            }

            try{

                let response = await this.DAO.get(Number(params[this.DAO.config.identifier_column]))

                res.send(response)

            }catch(err){

                res.sendStatus(501)

            }

        })
        this._make_base_path('put', DAO, config, this._update_object.bind(this));
        this._make_base_path('delete', DAO, config,this._delete_object.bind(this));        
    }
//TODO update / delete
    async _update_object(req, res) {
        let params = req.params;
        let updatedObject = req.body;

        if (config?.format_params) {
            params = config.format_params(params);
            updatedObject = config.format_params(updatedObject);
        }

        try {
            await this.DAO.update(Number(params[this.DAO.config.identifier_column]), updatedObject);
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send({ error: err.message });
        }
    }

    async _delete_object(req, res) {
        let params = req.params;

        if (config?.format_params) {
            params = config.format_params(params);
        }

        try {
            await this.DAO.delete(Number(params[this.DAO.config.identifier_column]));
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send({ error: err.message });
        }
    }
    _make_base_path(path_type, DAO, config, end_point){

        let path_name = `/${this.table_name}`

        if(['get','put', 'delete'].includes(path_type)){
            path_name += `/:${DAO.config.identifier_column}`
        }

        if (config?.[path_type]){
            this.express_server[path_type](path_name, ...config[path_type].middlewares ?? null, end_point)
        }else{
            this.express_server[path_type](path_name, end_point)
        }

    }

}

/**
 * 
 * @param {Express} express_server 
 * @param {DAO} DAO 
 * @param {JSON} config 
 */
function crud(express_server, DAO, config){
    return new CRUD(express_server, DAO, config)
}

module.exports = {crud}