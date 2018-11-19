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
    const doc = await getFile(args.source)

    SwaggerTex.generate(doc, args)
}

async function getFile(uri) {
    if (!uri.startsWith('http')) {
        const file = fs.readFileSync(uri).toString()
        return JSON.parse(file)
    } else {
        const req = http.get(uri)

        if (Cli.arguments.user && Cli.arguments.pass) {
            basicAuth = new Buffer(`${Cli.arguments.user}:${Cli.arguments.pass}`).toString('base64')
            req.set('Authorization', `Basic ${basicAuth}`)
        }
        
        const res = await req
        return res.body
    }
}

module.exports = {
    run
}