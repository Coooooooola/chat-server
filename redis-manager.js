const serverConfig = require('../server-config.json')
const redis = require('redis')

const SIGNUP = 1
const SIGNIN = 2
const ONLINE = 3
const MESSAGE = 4

function handleError(err) {
    throw err
}

const client = redis.createClient(serverConfig.redisOptions)



module.exports = {
    setUser: ({ userId, updateNum }) => {
        return new Promise((res, rej) => {
            client.select(ONLINE)
            client.set(userId, updateNum, err => {
                if (err) {
                    handleError(err)
                }
                res()
            })
        })
    },
    hasUser: ({ userId, updateNum }) => {
        return new Promise((res, rej) => {
            client.select(ONLINE)
            client.get(userId, (err, num) => {
                if (err) {
                    handleError(err)
                }
                if (num === null) {
                    rej('not found')
                } else {
                    +num === +updateNum ? res() : rej('invalid')
                }
            })
        })
    },
    storeMsg: (id1, id2, msg) => {
        client.select(MESSAGE)
        client.lpush(`${id1}-${id2}`, msg)
    },
    getMsgs: (id1, id2) => {
        client.select(MESSAGE)
        return new Promise((res, rej) => {
            const key = `${id1}-${id2}`
            client.lrange(key, 0, -1, (err, msgs) => {
                if (err) {
                    throw err
                }
                client.select(MESSAGE)
                client.del(key)
                res(msgs)
            })
        })
    }
}