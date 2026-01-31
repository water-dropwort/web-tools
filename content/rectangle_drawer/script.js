const LINE_COLOR_DEFAULT = "#ffa500";
const LINE_WIDTH_DEFAULT = 2;
const LINE_WIDTH_MIN = 1;
const LINE_WIDTH_MAX = 10;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const drawingState = {
    isSelecting: false,
    rawImage: null,
    snapshot: null,
    startX: null,
    startY: null,
    endX: null,
    endY: null,
    lineColor: null,
    lineWidth: null,
};
const resetButton = document.getElementById('resetButton');
const copyButton = document.getElementById('copyButton');
const lineColorPicker = document.getElementById('lineColor');
const lineWidthInput = document.getElementById('lineWidth');

// 画面が読み込まれたときに初期化処理を実行する。
window.addEventListener("load", startup, false);

// 画像をクリップボードからキャンバスに貼り付ける
document.addEventListener('paste', (e) => {
    e.preventDefault();
    const url = getImageObjURL(e.clipboardData);

    if(!url) return;

    const img = new Image();
    img.src = url;
    img.decode()
        .then(() => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            drawingState.rawImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        });
});


// 範囲選択を開始する
canvas.addEventListener('pointerdown', (e) => {
    const canStartSelecting = !drawingState.isSelecting && drawingState.rawImage != null;
    if(!canStartSelecting) return;

    drawingState.isSelecting = true;
    drawingState.startX = e.offsetX;
    drawingState.startY = e.offsetY;
    drawingState.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
});


// 範囲選択中のカーソル移動
canvas.addEventListener('pointermove', (e) => {
    if(!drawingState.isSelecting) return;

    ctx.putImageData(drawingState.snapshot, 0, 0);
    drawingState.endX = e.offsetX;
    drawingState.endY = e.offsetY;
    drawRectangle(drawingState, true);
});


// 範囲選択を終了する。
// 終了位置を確定し、矩形を描画する。
canvas.addEventListener('pointerup', (e) => {
    if(!drawingState.isSelecting) return;

    drawingState.isSelecting = false;
    ctx.putImageData(drawingState.snapshot, 0, 0);
    drawingState.endX = e.offsetX;
    drawingState.endY = e.offsetY;
    drawRectangle(drawingState);
});


// 編集内容をリセットし、ペーストしたときの画像の状態に戻す
resetButton.addEventListener('click', (e) => {
    if(!drawingState.rawImage) return;

    ctx.putImageData(drawingState.rawImage, 0, 0);
});


// 現在のキャンバスの内容をクリップボードにコピーする
copyButton.addEventListener('click', async (e) => {
    canvas.toBlob(async (blob) => {
        if(!blob) return;

        await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob}),
        ]);
    });
});


// カラーピッカーで色が変更されたら、それ以降に描画する矩形の線色を変更する。
// すでに描画されている矩形の線色は変わらない。
lineColorPicker.addEventListener('change', lineColorChanged, false);


// 矩形の線幅を変更する。
lineWidthInput.addEventListener('change', lineWidthChanged, false);


// 初期化処理
function startup() {
    drawingState.lineColor = LINE_COLOR_DEFAULT;
    lineColorPicker.value = LINE_COLOR_DEFAULT;

    drawingState.lineWidth = LINE_WIDTH_DEFAULT;
    lineWidthInput.value = LINE_WIDTH_DEFAULT.toString();
    lineWidthInput.max = LINE_WIDTH_MAX.toString();
    lineWidthInput.min = LINE_WIDTH_MIN.toString();
}


// クリップボードから画像を取得し、URLを返す。
function getImageObjURL(clipboardData) {
    for(const item of clipboardData.items) {
        if(!item.type.startsWith('image/')) continue

        return URL.createObjectURL(item.getAsFile());
    }
    return null;
}


// 矩形を描画する
function drawRectangle({startX, startY, endX, endY}, isPreview = false) {
    const minX = Math.min(startX, endX);
    const minY = Math.min(startY, endY);
    const maxX = Math.max(startX, endX);
    const maxY = Math.max(startY, endY);

    ctx.save();

    if(isPreview) {
        ctx.setLineDash([8, 4]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.strokeStyle = drawingState.lineColor;
    ctx.lineWidth = drawingState.lineWidth;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    ctx.restore();
}

// 矩形の線色を変更する。
function lineColorChanged(e) {
    drawingState.lineColor = e.target.value;
}

// 矩形の線幅を変更する。
function lineWidthChanged(e) {
    let newLineWidth = e.target.valueAsNumber;

    // MIN-MAXの範囲になるように調整する。
    if(newLineWidth < LINE_WIDTH_MIN) {
        newLineWidth = LINE_WIDTH_MIN;
    } else if(newLineWidth > LINE_WIDTH_MAX) {
        newLineWidth = LINE_WIDTH_MAX;
    }

    drawingState.lineWidth = newLineWidth;
    // MIN-MAXの範囲に調整された値で上書きする。
    e.target.value = newLineWidth.toString();
}
