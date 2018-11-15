const Cli = require('./command-line')

function run() {
    Cli.argument.default('swagger.json').short('s').long('source').description('The swagger.json source (either a file path or an URL)')
    Cli.argument.long('user').description('A username for authentication, if necessary')
    Cli.argument.long('pass').description('A password for authentication, if necessary')

    const args = Cli.arguments
    console.log(args);
}

module.exports = {
    run
}