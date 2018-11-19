const fs = require('fs')
const path = require('path')
const _flattenDeep = require('lodash/flattenDeep')
const mustache = require('mustache')
const md5 = require('md5')
const { spawn } = require('child_process')

function generate(json, args) {
    const template = fs.readFileSync(
        path.join(__dirname, '..', 'tex', 'doc.tex.mustache')
    ).toString()

    const title = json.info.title
    const version = json.info.version

    const tags = json.tags.map(t => {
        const paths = Object.keys(json.paths)
            .map(k => {
                return Object.keys(json.paths[k])
                    .filter(method => {
                        return (json.paths[k][method].tags || ['default']).includes(t.name)
                    })
                    .map(method => {
                        const route = json.paths[k][method]
                        
                        return {
                            path: k,
                            method,
                            ...route,
                            label: md5(`${method}:${k}`),
                            responses: Object.keys(route.responses).map(status => {
                                const response = route.responses[status]
                                let schema = '-'
                                let schemaLink
                                if (response.schema && response.schema.$ref) {
                                    schema = response.schema.$ref.split('/')[2]
                                    schemaLink = md5(schema)
                                } else if (response.schema) {
                                    schema = JSON.stringify(response.schema)
                                }
                                
                                
                                return {
                                    status,
                                    ...response,
                                    schema,
                                    schemaLink
                                }
                            })
                        }
                    })
            })
            .filter(p => p.length > 0)

        return {
            ...t,
            paths: _flattenDeep(paths)
        }
    })

    const definitions = Object.keys(json.definitions)
        .map(def => {
            const definition = json.definitions[def]
            const properties = definition.properties && Object.keys(definition.properties)
                .map(prop => {
                    const property = definition.properties[prop]
                    return {
                        name: prop,
                        ...property
                    }
                })
            return {
                name: def,
                ...definition,
                label: md5(def),
                properties,
                empty: !properties || properties.length < 1
            }
        })
    console.log(tags[0]);

    const view = {
        title,
        version,
        tags,
        definitions
    }
    
    mustache.escape = texEscape
    const doc = mustache.render(
        template,
        view,
        {},
        ['!(', ')']
    )

    fs.writeFileSync(
        path.join(__dirname, '..', 'tex', 'doc.tex'),
        doc
    )

    const texDir = path.join(__dirname, '..', 'tex')
    process.chdir(texDir)

    // 2 times for toc and references
    for (var i = 0; i < 2; ++i) {
        const pdflatex = spawn('xelatex', ['doc.tex'])
        pdflatex.stdout.on('data', data => {
            if (args.verbose) console.log(data.toString());
        })
        pdflatex.stderr.on('data', data => {
            if (args.verbose) console.log(data.toString());
        })
    }
}

module.exports = {
    generate
}

function texEscape(str) {
    if (typeof str !== 'string') return str
    return str
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/#/g, '\\#')
        .replace(/\$/g, '\\$')
        .replace(/"/g, '\'\'')
}