/**
 * Design Tokens conversion from Figma to style-dictionary (https://amzn.github.io/style-dictionary/)
 *
 * See documentation/docs/development/design.md for more info
 */

const ejs = require('ejs')
const StyleDictionaryPackage = require('style-dictionary')
const { fileHeader } = StyleDictionaryPackage.formatHelpers;


const { exec } = require('child_process')
const util = require('util')
const { readFileSync } = require('fs')
const { tokens } = require('style-dictionary')
const { snakeCase, isObject } = require('lodash')

StyleDictionaryPackage.registerFormat({
  name: 'javascript/color-const',
  formatter: function({dictionary, file}) {
    var styles = {};

    dictionary.allTokens.forEach(function(token) {
      var to_ret = '  ' + snakeCase(token.name).toUpperCase() + ': ' + JSON.stringify(token.value, null, 2)   + ',';
      if (token.comment)
        to_ret = to_ret.concat(' // ' + token.comment);
      
      if (!styles[token.type])
        styles[token.type] = [];

      styles[token.type].push(to_ret);
    });

    var output = fileHeader({file});
    for (const [type, values] of Object.entries(styles)) {
      output += `const ${type.toUpperCase()} = {\n${values.join("\n")}\n}\n\n`
    }

    return output;
  }
});

/**
 * Filters
 */
 const registerFilter = (name, type) => {
  StyleDictionaryPackage.registerFilter({
    name,
    matcher: token => {
      return token.type === type
    },
  })
}

registerFilter('isColor', 'color')
registerFilter('isTypography', 'typography')
registerFilter('isBorderRadius', 'borderRadius')
registerFilter('isBoxShadow', 'boxShadow')
// registerFilter('isLineHeight', 'lineHeights')


/**
 * Generates a Style Dictionary config
 *
 */
const getSDConfig = () => {
  return {
    source: ['output.tokens.json'],
    platforms: {
      js: {
        transformGroup: 'js',
        files: [
          {
            format: 'javascript/color-const',
            destination: 'allTokens.js',
          },
        ],
      },
    },
  }
}

const execPromise = util.promisify(exec)
const transform = async () =>
  await execPromise(
    'npx token-transformer input.tokens.json output.tokens.json',
  )

const build = async () => {
  // console.log('[Design] Starting design tokens conversion from Figma')​
  await transform()
  
  const StyleDictionary = StyleDictionaryPackage.extend(getSDConfig())
  console.log(StyleDictionary.options)
  StyleDictionary.buildPlatform("js")
}

build();