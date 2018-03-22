const mysql = require('mysql')
const serverConfig = require('../server-config.json')

const conn = mysql.createConnection(serverConfig.mysqlConfig)

function handleError(err) {
    throw err
}

module.exports = {
    getUserId: username => {
        return new Promise((res, rej) => {
            conn.query('SELECT `user_id` AS `id` FROM `users` WHERE ? LIMIT 1', { username }, (err, results) => {
                if (err) {
                    return handleError(err)
                }
                const [user] = results
                user ? res(user.id) : rej()
            })
        })
    },
    hasUser: ({ userId, updateNum }) => {
        return new Promise((res, rej) => {
            conn.query('SELECT `user_id` FROM `users` WHERE ? AND ? LIMIT 1',
                [{ 'user_id': userId }, { 'update_num': updateNum }], (err, results) => {
                    if (err) {
                        return handleError(err)
                    }
                    results.length === 1 ? res() : rej('invalid')
                })
        })
    }
}