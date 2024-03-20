#!/usr/bin/env node
import fs from 'node:fs/promises';
import { Option, program } from 'commander';

const pTag = 'p>';

const codeBlock = '```';
const codeTag = 'pre';

const convertData = {
    [codeBlock]: codeTag,
    '**':       'b',
    '_':        'i',
    '`':        'tt'
};

program
    .description('Simple Test')
    .argument('path', 'path to md file')
    .option('-o, --output <path>', 'path to output converted text')
    .addOption(
        new Option(
            '-f, --format [value]', 'Output type'
        ).choices(['html', 'ansi'])
    )
    .parse(process.argv)
    .action(commandHandle);
program.parse();

async function commandHandle(args, opts) {
    if(typeof args !== 'string')
        return process.stderr.write('Argument type is invalid');
    const mdPath = args.endsWith('.md') ? args : args.concat('.md');
    const parsedMdFileText = await parseMdFileData(mdPath);
    console.clear();
    const parsedText = getTagParsedText(parsedMdFileText);
    if(opts.output)
        await tryToWriteOutput(parsedText);
    process.stdout.write(parsedText.replace(/\t\t/g, ''));
};

const getTagParsedText = (text) => {
    const convertEntries = Object.entries(convertData);
    let parsedText = text;
    for(const [key, value] of convertEntries) {
        parsedText = replaceTag(parsedText, key, value);
    }
    return parsedText;
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
    let bufferString = parsedText;
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
};

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
    const htmlTag = tagsArray[tagIndex][1];
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
    }
};