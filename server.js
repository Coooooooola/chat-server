const serverConfig = require('../server-config.json')
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const fastify = require('fastify')()
const validator = require('./validator')
const sqlManager = require('./sql-manager')
const redisManager = require('./redis-manager')

const chatMap = new Map()

function getUID(co) {
    if (typeof co !== 'string') {
        return
    }
    const { UID } = cookie.parse(co)
    return UID
}
function verifyUID(UID) {
    return new Promise((res, rej) => {
        jwt.verify(UID, serverConfig.serect, (err, { identifier }) => {
            if (err) {
                rej()
                return
            }
            redisManager.hasUser(identifier)
            .then(() => {
                res(identifier.userId)
            })
            .catch(err => {
                if (err === 'invalid') {
                    rej()
                    return
                }
                sqlManager.hasUser(identifier)
                .then(() => {
                    redisManager.setUser(identifier)
                    res(identifier.userId)
                })
                .catch(err => rej())
            })
        })
    })
}



fastify.register(require('fastify-websocket'), {
    prefix: '/chat',
    handle: async (ws, request) => {
        const UID = getUID(request.headers.cookie)
        if (!UID) {
            ws.end()
            return
        }
        let userId = undefined
        try {
            userId = await verifyUID(UID)
        } catch (err) {
            ws.end()
        }

        ws.setEncoding('utf8')
        let id = undefined
        try {
            const username = await new Promise((res, rej) => {
                ws.once('data', intent => {
                    try {
                        const json = JSON.parse(intent)
                        if (!validator.username(json)) {
                            rej()
                        } else {
                            res(json.username)
                        }
                    } catch (err) {
                        rej()
                        return
                    }
                })
            })
            id = await sqlManager.getUserId(username)
        } catch (err) {
            ws.end()
        }
        const myKey = `${userId}-${id}`
        const targetKey = `${id}-${userId}`
        chatMap.set(myKey, ws)

        try {
            const msgs = await redisManager.getMsgs(id, userId)
            ws.write(JSON.stringify(msgs))
        } catch (err) {
            ws.end()
        }


        ws.on('data', msg => {
            try {
                const parsedMsg = JSON.parse(msg)
                if (!validator.message(parsedMsg)) {
                    throw new Error('not match')
                }
            } catch (err) {
                console.log(err)
                ws.end()
                return
            }
            const targetWs = chatMap.get(targetKey)
            if (targetWs) {
                targetWs.write(msg)
            } else {
                redisManager.storeMsg(userId, id, msg)
            }
        })
        ws.on('close', () => {
            chatMap.delete(myKey)
            console.log('close')
        })
    }
})


fastify.listen(3300, err => {
    if (err) {
        throw err
    }
})