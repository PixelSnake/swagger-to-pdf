const Cli = require('./command-line')
const http = require('superagent')
const fs = require('fs')
const SwaggerTex = require('./swagger-tex')

async function run() {
    Cli.argument.default('swagger.json').short('s').long('source').description('The swagger.json source (either a file path or an URL)')
    Cli.argument.long('user').description('A username for authentication, if necessary')
    Cli.argument.long('pass').description('A password for authentication, if necessary')
    Cli.flag.bool.default(false).short('v').long('verbose')

    const args = Cli.arguments

    const file = await getFile(args.source)
        .catch(err => console.log(err))

    const doc = JSON.parse(file)
    SwaggerTex.generate(doc, args)
}

async function getFile(uri) {
    if (!uri.startsWith('http')) {
        return fs.readFileSync(uri).toString()
    } else {
        return http.get(uri)
    }
}

module.exports = {
    run
}