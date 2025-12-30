const convertInput = document.getElementById('convert-input');
const convertButton = document.getElementById('convert-button');
const convertOutput = document.getElementById('convert-output');
const copyButton = document.getElementById('copy-button');

function convertTableStyle(tableText) {
    if(tableText) {
        let isHeaderRow = true;
        const lines = tableText.split('\n');
        const resultText = lines.map((line) => {
            // Markdownテーブルのヘッダとデータ部を分ける分割線の行は、Wiki形式には不要なので削除
            if(isTableSeparator(line))
                return '';
            // lineの末尾でテーブルの行が終わっている
            if(isEndOfRow(line)) {
                if(isHeaderRow) {
                    isHeaderRow = false;
                    return line + 'h\n';
                }
                return line + '\n';
            }
            // lineの末尾でテーブルの行が終わっていない場合、セル内の改行
            return line + '&br;';
        }).join('');
        return resultText;
    } else {
        return '';
    }
}

function isTableSeparator(line) {
    return line.startsWith('| ---');
}

function isEndOfRow(line) {
    return line.endsWith('|');
}

convertButton.addEventListener('click', (e) => {
    const inputText = convertInput.value;
    const convertResult = convertTableStyle(inputText);
    convertOutput.value = convertResult;
});

copyButton.addEventListener('click', async (e) => {
    const resultText = convertOutput.value;
    if(resultText) {
        await navigator.clipboard.writeText(resultText);
    }
});
