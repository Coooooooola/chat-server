const Ajv = require('ajv')
const ajv = new Ajv()

const UIDValidator = ajv.compile({
    type: 'object',
    properties: {
        UID: { type: 'string' }
    },
    required: ['UID']
})

const v = ajv.compile({
    type: 'object',
    properties: {
    }
})

module.exports = {
    UID: ajv.compile({
        type: 'object',
        properties: {
            UID: { type: 'string' }
        },
        required: ['UID']
    }),
    username: ajv.compile({
        type: 'object',
        properties: {
            username: { type: 'string' }
        },
        required: ['username']
    }),
    message: ajv.compile({
        type: 'object',
        properties: {
            time: { type: 'number' },
            msg: { type: 'string' }
        },
        required: ['time', 'msg']
    })
}