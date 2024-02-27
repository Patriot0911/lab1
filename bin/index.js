#!/usr/bin/env node
import fs from 'node:fs/promises';
import { program } from 'commander';

const pTag = 'p>';
const codeBlock = '```';
const convertData = {
    [codeBlock]:'pre',
    '**':       'b',
    '_':        'i',
    '`':        'tt'
};

program
    .description('Simple Test')
    .argument('path', 'path to md file')
    .option('-o, --output <path>', 'path to output converted text')
    .parse(process.argv)
    .action(commandHandle);
program.parse();

async function commandHandle(args, opts) {
    if(typeof args !== 'string')
        return process.stderr.write('Argument type is invalid');
    const mdPath = args.endsWith('.md') ? args : args.concat('.md');
    const parsedMdFileText = await parseMdFileData(mdPath);
    console.clear();
    const convertEntries = Object.entries(convertData);
    let parsedText = parsedMdFileText;
    for(const [key, value] of convertEntries) {
        parsedText = replaceTag(parsedText, key, value);
    }
    console.log(parsedText);
};

function replaceTag(parsedText, key, value) {
    const contentPart = key.length === 1 ? key : key.split('').join('\\');
    const startPatern = `\\s\\${contentPart}[^\\s]`;
    const endPatern = `[^\\s]\\${contentPart}\\s`;
    const regConstruct = `${startPatern}|${endPatern}`;
    const testReg = new RegExp(regConstruct, 'g');
    console.log(testReg);
    const isInclude = testReg.test(parsedText);
    if(!isInclude)
        return parsedText;
    const startCount = ((parsedText || '').match(
        new RegExp(startPatern, 'g')
    ) || []).length;
    const endCount = ((parsedText || '').match(
        new RegExp(endPatern, 'g')
    ) || []).length;
    if(startCount !== endCount) {
        process.stderr.write(
            `An error occurred in the markdown syntax. (synt: [ ${key} ])`
        );
        process.exit(0);
    }
    const startReg = new RegExp(startPatern, 'g');
    const endReg = new RegExp(endPatern, 'g');
    let bufferString = parsedText;
    for(let i = 0; i < startCount; i++) {
        bufferString = partiattialyReplaceReg(
            bufferString,
            startReg,
            key, value
        );
    }
    for(let i = 0; i < endCount; i++) {
        bufferString = partiattialyReplaceReg(
            bufferString,
            endReg,
            key, value,
            false
        );
    }
    return bufferString;
};

function partiattialyReplaceReg(text, reg, key, value, isStart=true){
    const index = text.search(reg);
    const tag = isStart ? `<${value}>` : `</${value}>`;
    const firstPart = text.slice(0, index+1);
    const lastPart = text.slice(index+key.length+1, text.length);
    return [firstPart, tag, lastPart].join('');
}

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