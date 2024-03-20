const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const correctString = `
> lab1@1.0.0 test_coorect_format
> node ./bin/index.js ./successfulFile.md --format html

<p> Hi, I am title! </p>
<p> <b>bold *test* text</b> </p>
<p>  <tt>not fine</tt> </p>
<p> <pre>tet</pre> </p>
<p> <pre>some text go here _eqwe_ * ew * end of</pre> </p>
<p> <i>test</i> </p>`;

describe('MyCli', () => {
        test('exec with wrong flag', async() => {
            // console.log("TEST" + (await exec('mycli ./successfulFile.md -f test')))
            expect(
                (await exec('npm run test_appcli_wrong_arg')).stderr
            )
            .toBe(`Error: option '-f, --format [value]' argument 'test' is invalid. Allowed choices are html, ansi.`)
        })
        test('incorrect file', async() => {
            expect(
                (await exec('npm run test_incorrect_file')).stderr
            ).toBe(`The file cannot be found.\nMake sure it's in '.md' format and you've specified the correct path`)
        });
        test('incorrect format', async() => {
            expect(
                (await exec('npm run test_wrong_format')).stderr
            ).toBe(`An error occurred in the markdown syntax.\nDouble tag is provided(inside of [ ** ])`)
        });
        test('correct transform', async() => {
            expect(
                (await exec('npm run test_coorect_format')).stdout
            ).toBe(correctString)
        });
    }
);
