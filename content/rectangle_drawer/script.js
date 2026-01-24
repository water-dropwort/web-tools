const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const drawingState = {
    isSelecting: false,
    rawImage: null,
    snapshot: null,
    startX: null,
    startY: null,
    scale: null,
    endX: null,
    endY: null,
};
const resetButton = document.getElementById('resetButton');
const copyButton = document.getElementById('copyButton');
const upsizeButton = document.getElementById('upsizeButton');
const downsizeButton = document.getElementById('downsizeButton');


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
            drawingState.scale = 1;
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


// 画像を拡大する
upsizeButton.addEventListener('click', (e) => {
    if(!drawingState.rawImage) return;

    drawingState.scale += 0.1;
    resize(drawingState.scale);
});

// 画像を縮小する
downsizeButton.addEventListener('click', (e) => {
    if(!drawingState.rawImage) return;

    drawingState.scale -= 0.1;
    resize(drawingState.scale);
});

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

    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    ctx.restore();
}


// 画像のサイズを拡縮する
// 拡大縮小を繰り返すと画像が荒くなるので、元画像（rawImage）を拡大縮小する。
// その都合で描画していた矩形が消去される。
function resize(scale) {
    // canvasのサイズを変更したときに画像データがクリアされるので、
    // 一旦元画像をオフスクリーンcanvasに描画し、
    // そのオフスクリーンcanvasをctxのdrawImageでリサイズして描画する。
    const img = drawingState.rawImage;
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.width;
    srcCanvas.height = img.height;
    const srcCtx = srcCanvas.getContext('2d');
    srcCtx.putImageData(img, 0, 0);

    const newWidth = img.width * scale;
    const newHeight = img.height * scale;
    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.drawImage(srcCanvas, 0, 0, newWidth, newHeight);
}
