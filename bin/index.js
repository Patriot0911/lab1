#!/usr/bin/env node
const fs = require('node:fs/promises');
const { Option, program } = require('commander');

const pTag = 'p>';

const codeBlock = '```';
const codeTag = 'pre';

const ansiClear = '\x1b[0m';

const convertData = {
    [codeBlock]: {
        html: codeTag,
        ansi: '\x1b[7m',
    },
    '**': {
        html: 'b',
        ansi: '\x1b[1m',
    },
    '_': {
        html: 'i',
        ansi: '\x1b[3m',
    },
    '`': {
        html: 'tt',
        ansi: '\x1b[33m',
    },
};

program
    .description('Simple Test')
    .argument('path', 'path to md file')
    .option('-o, --output <path>', 'path to output converted text')
    .addOption(
        new Option(
            '-f, --format [value]', 'Output type'
        ).choices(['html', 'ansi'])
        .argParser((str, prev) => {
            if(str !== 'html' && str !== 'ansi') {
                process.stderr.write(
                    `Error: option '-f, --format [value]' argument '${str}' is invalid. Allowed choices are html, ansi.`
                );
                process.exit(0);
            }
            return str;
        })
    )
    .parse(process.argv)
    .exitOverride(
        (e) => {
            process.stderr.write('s');
            process.exit(0);
        }
    )
    .action(commandHandle);
program.parse();

async function commandHandle(args, opts) {
    if(typeof args !== 'string')
        return process.stderr.write('Argument type is invalid');
    const mdPath = args.endsWith('.md') ? args : args.concat('.md');
    const isHtml = !opts.format ? !!opts.output : (opts.format === 'html');
    const parsedMdFileText = await parseMdFileData(mdPath);
    console.clear();
    const parsedText = getTagParsedText(parsedMdFileText, isHtml);
    if(opts.output)
        await tryToWriteOutput(parsedText);
    process.stdout.write(parsedText);
    return parsedText;
};

const getTagParsedText = (text, isHtml) => {
    const parsedText = getHtmlParsedText(text);
    if(!isHtml)
        return convertHtmlToAnsi(parsedText);
    return parsedText;
};

const getHtmlParsedText = (text, index = 0) => {
    const convertEntries = Object.entries(convertData);
    if(index === convertEntries.length)
        return text.replace(/\t\t/g, '');
    const [key, value] = convertEntries[index];
    const newText = replaceTag(text, key, value.html);
    return getHtmlParsedText(newText, index+1);
};

const getHtmlTagInsideRegex = (tag) => {
    const begin = `<${tag}>\\s*`;
    const end = `\\s*</${tag}>`;
    const concated = `${begin}(.*?)${end}`;
    const regex = new RegExp(concated, 'g');
    return regex;
};

const convertHtmlToAnsi = (text, index = 0) => {
    const convertedDataArray = Object.entries(convertData);
    if(index === convertedDataArray.length) {
        const regex = getHtmlTagInsideRegex(pTag.slice(0, 1));
        return text.replace(regex,
            (_, content) => '' + content + ''
        );
    }
    const [_, value] = convertedDataArray[index];
    const regex = getHtmlTagInsideRegex(value.html);
    const newText = text.replace(regex,
        (_, content) => value.ansi + content + ansiClear
    );
    return convertHtmlToAnsi(newText, index+1);
};

const tryToWriteOutput = async (text) => {
    try {
        await fs.writeFile(opts.output, parsedText);
    } catch (err) {
        process.stderr.write(
            `An error occurred in writing file.`
        );
        process.exit(0);
    }
};

const getRegexCount = (string, regex) => ((string || '').match(regex) || []).length;

function replaceTag(parsedText, key, value) {
    const {
        openTag,
        closeTag
    } = getInTagAttributes(key, true);
    const regConstruct = `${openTag}|${closeTag}`;
    const testReg = new RegExp(regConstruct, 'g');
    const isInclude = testReg.test(parsedText);
    if(!isInclude)
        return parsedText;
    const startCount = getRegexCount(parsedText, new RegExp(openTag, 'g'));
    const endCount = getRegexCount(parsedText, new RegExp(closeTag, 'g'));
    if(startCount !== endCount) {
        process.stderr.write(
            `An error occurred in the markdown syntax. (synt: [ ${key} ])`
        );
        process.exit(0);
    }
    const startReg = new RegExp(openTag, 'g');
    const endReg = new RegExp(closeTag, 'g');
    const partitalReplacedString = blockPartiattialyReplace(
        parsedText, startCount,
        key, value,
        startReg, endReg
    );
    return partitalReplacedString;
};

const blockPartiattialyReplace = (text, startCount, key, value, startReg,  endReg) => {
    let bufferString = text;
    for(let i = 0; i < startCount; i++) {
        bufferString = partiattialyReplaceReg(
            bufferString,
            startReg,
            key, value
        );
        bufferString = partiattialyReplaceReg(
            bufferString,
            endReg,
            key, value,
            false
        );
    }
    return bufferString;
}

const checkByTagsCount = (text, index, tag, useTag, checkerCount, useRegex) => {
    const tagChecker = isInTag(text, index, useTag, checkerCount, useRegex);
    if(tagChecker) {
        if(tag === codeBlock)
            return true;
        process.stderr.write(
            `An error occurred in the markdown syntax.\nDouble tag is provided(inside of [ ${tag} ])`
        );
        process.exit(0);
    };
    return false;
};

const checkIsInAllTags = (text, index, key, tagIndex = 0) => {
    const tagsArray = Object.entries(convertData);
    const tag = tagsArray[tagIndex][0];
    const htmlTag = tagsArray[tagIndex][1].html;
    const openTag = `<${htmlTag}>`;
    const closeTag = `</${htmlTag}>`;
    const contentPart = tag.length === 1 ? tag : tag.split('').join('\\');
    const startPatern = `\\s\\${contentPart}[^\\s]`;
    const tagsRegexCount = getRegexCount(text, startPatern);
    if(key === tag || !new String(key).includes(tag)) {
        const htmlStartTagsCount = getRegexCount(text, new RegExp(openTag, 'g'));
        const htmlEndTagsCount = getRegexCount(text, new RegExp(closeTag, 'g'));
        if(htmlStartTagsCount > 0 && htmlStartTagsCount === htmlEndTagsCount) {
            if(checkByTagsCount(text, index, tag, htmlTag, htmlStartTagsCount, false))
                return true;
        }
        if(tagsRegexCount > 0) {
            if(checkByTagsCount(text, index, tag, tag, tagsRegexCount, true))
                return true;
        }
    }
    if(tagIndex+1 !== tagsArray.length)
        return checkIsInAllTags(text, index, key, tagIndex+1);
    return false;
};

const isInTag = (text, index, tag, count, regex, times = 0, lastIndex = 0) => {
    const tagAttributes = getInTagAttributes(tag, regex);
    const {
        closeTagIndex,
        openTagIndex
    } = getTagIndices(text, lastIndex, tagAttributes, regex);
    if(openTagIndex !== index) {
        if(closeTagIndex === -1 && openTagIndex < index) {
            return true;
        }
        if(openTagIndex < index && index < closeTagIndex)
            return true;
    };
    if(count-1 === times)
        return false;
    return isInTag(text, index, tag, count, regex, times+1, closeTagIndex ? closeTagIndex : openTagIndex+1);
};

const getTagIndices = (text, lastIndex, tagAttributes, regex = false) => {
    const { openTag, closeTag } = tagAttributes;
    if(regex) {
        const openTagIndex = regexIndexOf(text, openTag, lastIndex);
        const closeTagIndex = regexIndexOf(text, closeTag, lastIndex+1);
        return {
            openTagIndex,
            closeTagIndex
        };
    }
    const openTagIndex = text.indexOf(openTag, lastIndex);
    const closeTagIndex = text.indexOf(closeTag, lastIndex+1);
    return {
        openTagIndex,
        closeTagIndex
    };
}

const getInTagAttributes = (tag, isRegex = false) => {
    if(!isRegex) {
        const openTag = `<${tag}>`;
        const closeTag = `</${tag}>`;
        return {
            openTag,
            closeTag
        };
    }
    const contentPart = tag.length === 1 ? tag : tag.split('').join('\\');
    const openTag = `\\s\\${contentPart}[^\\s]`;
    const closeTag = `[^\\s]\\${contentPart}\\s`;
    return {
        openTag,
        closeTag
    };
};


const regexIndexOf = (string, regex, startpos) => {
    const indexOf = string.substring(startpos || 0).search(regex);
    return indexOf >= 0 ? (indexOf + (startpos || 0)) : indexOf;
};

function partiattialyReplaceReg(text, reg, key, value, isStart=true) {
    const index = text.search(reg);
    const isInTag = checkIsInAllTags(text, index, key);
    if(isInTag) {
        const beforeTag = text.slice(0, index+key.length);
        const afterTag =  text.slice(index+key.length+1, text.length);
        return [beforeTag, key, afterTag].join('\t\t');
    }
    const tag = isStart ? `<${value}>` : `</${value}>`;
    const firstPart = text.slice(0, index+1);
    const lastPart = text.slice(index+key.length+1, text.length);
    return [firstPart, tag, lastPart].join('');
};

async function parseMdFileData(path) {
    const newLineRegex = new RegExp(/\r\n/g);
    try {
        const file = await fs.readFile(path);
        const fileContent = file.toString();
        const isWithParagraphs = newLineRegex.test(fileContent);
        const text = isWithParagraphs ? `<${pTag} `.concat(fileContent) : ['', fileContent, ''].join(' ');
        const textWithParagraphs = text.replace(/\r\n/g, ` </${pTag}\n<${pTag} `)
        return isWithParagraphs ?
            textWithParagraphs.concat(` </${pTag}`) :
            textWithParagraphs.slice(0, textWithParagraphs.length-pTag.length+2);
    } catch (e) {
        process.stderr.write(
            'The file cannot be found.\n' +
            'Make sure it\'s in \'.md\' format and you\'ve specified the correct path'
        );
        process.exit(0);
    }
};

module.exports = {
    commandHandle
};
