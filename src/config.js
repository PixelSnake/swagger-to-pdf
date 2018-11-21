const fs = require('fs')
const path = require('path')
const Joi = require('joi')

const colorModel = Joi.string().regex(/[0-9a-fA-F]{6}/)
const methodColorsModel = Joi.object().keys({
    get: colorModel.default('0f6ab4'),
    post: colorModel.default('10a54a'),
    patch: colorModel.default('D38042'),
    delete: colorModel.default('a41e22'),
})

const model = Joi.object().keys({
    language: Joi.string().default('english'),
    include: Joi.object().keys({
        tags: Joi.boolean().default(true),
        definitions: Joi.boolean().default(true),
    }),
    font: Joi.object().keys({
        family: Joi.string().required(),
        bold: Joi.string()
    }),
    colors: Joi.object().keys({
        primary: colorModel,
        methods: methodColorsModel.default(methodColorsModel.valid({}).value)
    })
})

function load() {
    const file = fs.readFileSync(path.join(__dirname, '..', 'swagger-pdf.json'))
    const _config = JSON.parse(file)

    const config = model.validate(_config)
    if (config.error) throw new Error(config.error)

    if (!config.value.include.tags && !config.value.include.definitions) console.error('Neither tags nor definition has been specified to be included in config - documentation will be empty')

    return config.value
}

module.exports = {
    load
}