const parse = require('./parser')

const defaultArgument = {
    _required: false,
    _defaultValue: null,
    _value: true,
    _type: null
}
const defaultFlag = {
    _value: false
}

class Cli {
    constructor() {
        this.__arguments = []
    }

    __argument(arg) {
        if (arg.short !== undefined) verifyShort(arg.short)
        if (arg.long !== undefined) verifyLong(arg.long)

        this.__arguments = [arg, ...this.__arguments]
        return this
    }

    __flag(arg) {
        if (arg.short !== undefined) {
            verifyShort(arg.short)
        }

        if (arg.long !== undefined) {
            verifyLong(arg.long)
        }
    }
}
const CliInstance = new Cli()
defineOperators(CliInstance, Cli)

CliInstance.TypeLiterals = {
    int: 'Integer Number',
    float: 'Floating Point Number',
    string: 'String',
    bool: 'Boolean'
}

function defineOperators(cli) {
    Object.defineProperty(cli, 'argument', {
        get: function() { return new CliArgument(this, defaultArgument) }
    })
    Object.defineProperty(cli, 'flag', {
        get: function() { return new CliArgument(this, defaultFlag) }
    })
    Object.defineProperty(cli, 'arguments', {
        get: () => {
            try {
                return parse(cleanArguments(), CliInstance)
            } catch (err) {
                console.error(err.message)
                process.exit(1)
            }
        }
    })
    return cli
}


class CliArgument {
    constructor(_base, props) {
        Object.assign(this, _base, props)
        defineArgumentOperators(CliArgument, this)

        switch (this._type) {
            case undefined:
            case null:
            case 'string':
            case 'float':
            case 'int':
            case 'bool':
                break
            default: throw new Error(`unknown type ${this._type}`)
        }
        
        if (this.__argId == undefined) this.__argId = CliArgument.count++
        
        CliInstance.__argument(deprivatize(this))
    }

    short(_short) {
        return new CliArgument(this, { _short })
    }

    long(_long) {
        return new CliArgument(this, { _long })
    }

    description(_description) {
        return new CliArgument(this, { _description })
    }

    default(_defaultValue) {
        return new CliArgument(this, { _defaultValue })
    }
}
defineArgumentOperators(CliArgument, CliArgument)

CliArgument.count = 0
function defineArgumentOperators(constr, cliArgument) {
    /* constraints */
    Object.defineProperty(cliArgument, 'required', {
        get: function() { return new constr(this, { _required: true }) }
    })

    /* types */
    Object.defineProperty(cliArgument, 'string', {
        get: function() { return new constr(this, { _type: 'string' }) }
    })
    Object.defineProperty(cliArgument, 'int', {
        get: function() { return new constr(this, { _type: 'int' }) }
    })
    Object.defineProperty(cliArgument, 'float', {
        get: function() { return new constr(this, { _type: 'float' }) }
    })
    Object.defineProperty(cliArgument, 'number', {
        get: function() { return new constr(this, { _type: 'float' }) }
    })
    Object.defineProperty(cliArgument, 'bool', {
        get: function() { return new constr(this, { _type: 'bool' }) }
    })
    return cliArgument
}

function cleanArguments() {
    const cleaned = []
    const ids = []
    CliInstance.__arguments.forEach(a => {
        if (a.__argId === undefined || ids.includes(a.__argId)) return
        ids.push(a.__argId)
        cleaned.push(a)
    })
    return cleaned.reverse()
}

function deprivatize(obj) {
    const _obj = {}
    for (const key in obj) {
        let _key = key
        if (!obj.hasOwnProperty(key)) continue
        if (key[1] !== '_') _key = key.substr(1)
        _obj[_key] = obj[key]
    }
    return _obj
}

function verifyShort(short) {
    if (short !== undefined) {
        if (typeof short !== 'string') throw new Error('short argument name must be a string')
        if (short.length !== 1) throw new Error('short argument length needs to be exactly one character long')
    }
}

function verifyLong(long) {
    if (long !== undefined) {
        if (typeof long !== 'string') throw new Error('long argument name must be a string')
        if (long.length < 2) throw new Error('long argument length needs to be more than one character long')
    }
}

module.exports = CliInstance