const _flattenDeep = require('lodash/flattenDeep')

let Cli

function parse(args, cli) {
    Cli = cli
    const arguments = {}
    const argv = process.argv
    const availableArgSets = args.map(a => [a.long, a.short].filter(a => a !== undefined)).filter(a => a.length > 0)
    const processedArgSets = []

    for (var i = 2; i < argv.length; ++i) {
        let arg = argv[i]
        let argDefinition
        let argSet
        
        if (arg.startsWith('--')) {
            arg = arg.substr(2)
            argDefinition = args.filter(a => a.long === arg)[0]
            if (!argDefinition) unrecognizedParameter(arg)
        } else if (arg.startsWith('-')) {
            arg = arg.substr(1)
            argDefinition = args.filter(a => a.short === arg)[0]
            if (!argDefinition) unrecognizedParameter(arg)
        } else {
            unexpectedToken(arg, argv[i - 1])
        }

        argSet = availableArgSets.filter(s => s.includes(arg))[0]

        if (processedArgSets.includes(argSet.join(','))) {
            const prevValue = argSet.map(a => arguments[a]).filter(a => a !== undefined)[0]
            doublySpecifiedParameter(arg, argSet, prevValue)
        }

        if (argDefinition.value) arguments[argDefinition.long || argDefinition.short] = formatValue({ def: argDefinition, arg }, argv[++i])
        else arguments[argDefinition.long || argDefinition.short] = true
        processedArgSets.push(argSet.join(','))
    }

    args.forEach(a => {
        const key = a.long || a.short
        const value = arguments[key]
        if (a.required && value === undefined)
            throw new Error(`Parameter ${key} is required`)
        if (a.defaultValue && value === undefined)
            arguments[key] = a.defaultValue
    })

    return arguments
}

function formatValue({ arg, def }, _val) {
    let val
    let error
    if (def.type) {
        switch (def.type) {
            case 'string': val = _val.toString(); break
            case 'int': val = parseInt(_val); break
            case 'float': val = parseFloat(_val); break
            case 'bool': val = _val === 'true' ? true : false; break
            default: throw new Error(`unknown type ${def.type}`)
        }
    } else {
        if (!isNaN(val = parseFloat(_val))) ;
        else if (!isNaN(val = parseInt(_val))) ;
        else {
            val = _val
        }
    }

    if (val === null) throw new Error(`Invalid value '${_val}' for parameter ${arg} - expects type ${Cli.TypeLiterals[def.type]}`)
    return val
}

function unrecognizedParameter(param) {
    throw new Error(`Unrecognized flag '${param}'`)
}
function unexpectedToken(token, prevParam) {
    throw new Error(`Unrecognized token '${token}' - the parameter '${prevParam}' does not expect a value`)
}
function doublySpecifiedParameter(param, set, value) {
    set = set.filter(s => s !== param)
    throw new Error(`The parameter ${param} (or ${ set.length > 1 ? 'one of its aliases' : 'its alias' } ${set.join(', ')}) has already been specified: ${value}`)
}

module.exports = parse