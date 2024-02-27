
import fs from 'node:fs/promises';

const convertData = {
    '*': '<b>',
    '_': '<i>',
    '`': '<tt>',
    '```': '<pre>'
};

const parseMdFileData = async (path) => {
    const pTag = 'p>';
    const newLineRegex = new RegExp(/\r\n/g);
    const file = await fs.readFile(path);
    const fileContent = file.toString();
    const isWithParagraphs = newLineRegex.test(fileContent);
    const text = isWithParagraphs ? '<p>'.concat(fileContent) : fileContent;
    const textWithParagraphs = text.replace(/\r\n/g, `</${pTag}\n<${pTag}`)
    return isWithParagraphs ?
        textWithParagraphs.concat(`</${pTag}`) :
        textWithParagraphs.slice(0, textWithParagraphs.length-pTag.length+2);
};

void (async function main() {
    const [
        nodePath,
        appPath,
        ...args
    ] = process.argv;
    // console.clear();
    if(args.length < 1) {
        process.stderr.write(
            'Provided not enough arguments!\n' +
            'Usage:\n' +
            '\t(npm run start)/(node .) [path to md file] ...flags\n' +
            'Flags:\n' +
            '\tOutput html to specific file\t -o=[path] \t --output=[path]'
        );
        return process.exit(0);
    };
    const mdPath = args[0].endsWith('.md') ? args[0] : args[0].concat('.md');
    try {
        const parsedMdText = await parseMdFileData(mdPath);
        console.log(parsedMdText);
    } catch (e) {
        process.stderr.write(
            'The file cannot be found.\n' +
            'Make sure it\'s in \'.md\' format and you\'ve specified the correct path'
        );
        process.exit(0);
    }
})();

function parseMarkdownToHTML(markdown) {
    // Replace headers
    markdown = markdown.replaceAll(/^###\s*(.*?)$/gm, '<h3>$1</h3>');
    markdown = markdown.replaceAll(/^##\s*(.*?)$/gm, '<h2>$1</h2>');
    markdown = markdown.replaceAll(/^#\s*(.*?)$/gm, '<h1>$1</h1>');
    // Add more rules for other Markdown elements

    // Replace bold and italic
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>');

    return markdown;
};