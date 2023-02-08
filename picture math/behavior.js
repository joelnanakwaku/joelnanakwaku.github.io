// TODO: Add aspect ratio limits for image import
// TODO: Prevent color removal on used colors
// TODO: Make transparent import white by default and not black
// TODO: Change colors, colorNames and colorElements to a single colors array of objects
// TODO: Max and min limits and question params.

const grid = document.getElementById('image-grid');
const cGrid = document.getElementById('color-grid');
const cInput = document.getElementById('color-picker');
const cName = document.getElementById('color-name')

const defaultColors = [
    //White
    '#ffffff',
    //Gray
    '#a6a6a6',
    //Dark Gray
    '#4d4d4d',
    //Black
    '#000000',
    //Maroon
    '#800000',
    //Red
    '#ff0000',
    //Orange
    '#ff5e00',
    //Sun Yellow
    '#ffb300',
    //Yellow
    '#ffff00',
    //Grass Green
    '#bfff00',
    //Green
    '#00ff00',
    //Turquoise
    '#2c9c96',
    //Light Blue
    '#00e5ff',
    //Blue
    '#0000ff',
    //Violet
    '#4c00ff',
    //Lavender
    '#b091ff',
    //Magenta
    '#ff00ff',
    //Pale Pink
    '#ff91b8',
    //Light Peach
    '#f5a687',
    //Brown
    '#783e2c',
]

let mouseDown = false;

let selectedColor = undefined;
let pixels = undefined;
let colors = new Array(20).fill(0);
let colorElements = new Array(20);
let colorNames = [
    'White',
    'Gray',
    'Dark Gray',
    'Black',
    'Maroon',
    'Red',
    'Orange',
    'Sun Yellow',
    'Yellow',
    'Grass Green',
    'Green',
    'Turqoise',
    'Light Blue',
    'Blue',
    'Violet',
    'Lavender',
    'Magenta',
    'Pale Pink',
    'Light Peach',
    'Brown',
]
let dimensions = undefined;

let questionParams = {
    questionCount: 10,
    questionTypes: [0, 0, 0, 0],

    addition: {
        min: 1,
        max: 30,
    },

    subtraction: {
        min: 1,
        max: 30,
    },

    multiplication: {
        min: 1,
        max: 30,
    },

    division: {
        min: 1,
        max: 30,
    },

    drawSwatches: true,
}

let generationParams = {
    blockSize: 3,
    customBlockSizeEl: null,
    worksheetSwatches: false,
}


function onload() {
    defineGrid(4, 4);
    document.getElementById('addition-toggle-button').click();
}

//#region Picture Grid
function defineGrid(rows, columns) {
    dimensions = { c: columns, r: rows };

    updateGridDisplay();

    grid.style.gridTemplateRows = 'repeat(' + rows + ', 1fr [row]';
    grid.style.gridTemplateColumns = 'repeat(' + columns + ', 1fr [col]';

    document.onmousedown = function () { mouseDown = true };
    document.onmouseup = function () { mouseDown = false };

    pixels = new Array(rows * columns);
    for (let i = 0; i < pixels.length; i++) {
        const e = document.createElement('div');
        e.classList = 'grid-item';
        e.onmousedown = function () { paintGridPixel(i) }
        e.onmouseover = function () { if (mouseDown) { paintGridPixel(i) } }
        grid.appendChild(e);

        pixels[i] = { element: e, color: 0 };
    }

    colors[0] = pixels.length;

    cInput.value = defaultColors[0];
    cInput.parentElement.style.backgroundColor = cInput.value;
    for (let i = 0; i < 20; i++) {
        const e = document.createElement('div');
        e.classList = 'color';
        e.style.backgroundColor = defaultColors[i];
        e.onmousedown = function () { selectColor(i, e) };
        colorElements[i] = e;
        cGrid.appendChild(e);

        if (i == 0) {
            selectedColor = { id: 0, element: e };
            e.classList += ' selected';

            cName.value = colorNames[i];
        }
    }

    const addButton = document.createElement('div');
    addButton.classList = 'add-color';
    addButton.onmousedown = function () { addColor(addButton) };
    cGrid.appendChild(addButton);
}

function setGridRows() {
    document.getElementById('rows').value = Math.max(Math.min(document.getElementById('rows').value, 64), 2)

    let rows = document.getElementById('rows').value;
    const diff = rows - dimensions.r;

    if (diff > 0) {
        const originalLength = pixels.length;
        pixels.push(...Array(dimensions.c * diff));

        for (let i = 0; i < dimensions.c * diff; i++) {
            const e = document.createElement('div');
            e.classList = 'grid-item';
            e.onmousedown = function () { paintGridPixel(originalLength + i) };
            e.onmouseover = function () { if (mouseDown) { paintGridPixel(originalLength + i) } };
            e.style.backgroundColor = colorElements[0].style.backgroundColor;
            grid.appendChild(e);

            pixels[originalLength + i] = { element: e, color: 0 };
        }

        colors[0] += diff * dimensions.c;

    } else if (diff < 0) {
        let deleted = pixels.splice(diff * dimensions.c, -diff * dimensions.c);

        for (let i = 0; i < deleted.length; i++) {
            colors[deleted[i].color]--;
            deleted[i].element.remove();
        }
    }

    dimensions.r = rows;

    grid.style.gridTemplateRows = 'repeat(' + dimensions.r + ', 1fr [row]';
    updateGridDisplay();
}

function setGridColumns() {
    document.getElementById('columns').value = Math.max(Math.min(document.getElementById('columns').value, 64), 2)

    let columns = document.getElementById('columns').value;
    const diff = columns - dimensions.c;

    if (diff > 0) {
        //Loops through each row.
        for (let i = 0; i < dimensions.r; i++) {

            //Loops for each column that is to be added in the row.
            for (let j = 0; j < diff; j++) {

                //[dimensions.c] represents the old number of columns.
                //[(dimensions.c * (i + 1))] gives the index of the next item at the end of each row.
                //[(diff * i)] is the number of columns added on previous loops.
                //[j] is added for each column being added to the current row.
                const index = (dimensions.c * (i + 1)) + (diff * i) + j;

                const e = document.createElement('div');
                e.classList = 'grid-item';
                e.style.backgroundColor = colorElements[0].style.backgroundColor;

                if (index < pixels.length) {
                    grid.insertBefore(e, pixels[index].element);
                } else {
                    grid.appendChild(e);
                }

                pixels.splice(index, 0, { element: e, color: 0 });
            }
        }

        colors[0] += diff * dimensions.r;

    } else if (diff < 0) {
        //Loops through each row.
        for (let i = 1; i <= dimensions.r; i++) {
            let deleted = pixels.splice((Number(dimensions.c) + diff) * i, -diff);

            for (let j = 0; j < deleted.length; j++) {
                colors[deleted[j].color]--;
                deleted[j].element.remove();
            }
        }
    }

    //Since indexes of old pixels have been shifted, all event handlers must be reassigned.
    for (let i = 0; i < pixels.length; i++) {
        pixels[i].element.onmousedown = function () { paintGridPixel(i) };
        pixels[i].element.onmouseover = function () { if (mouseDown) { paintGridPixel(i) } };
    }

    dimensions.c = columns;

    grid.style.gridTemplateColumns = 'repeat(' + dimensions.c + ', 1fr [col]';
    updateGridDisplay();
}

function updateGridDisplay() {
    let size = 95

    let w = (size * Math.min(1, dimensions.c / dimensions.r));
    let h = (size * Math.min(1, dimensions.r / dimensions.c));

    grid.style.width = w + '%';
    grid.style.height = h + '%';

    grid.style.top = ((100 - size) * 0.5) + '%';
    grid.style.left = ((100 - w) * 0.5) + '%';
}

function paintGridPixel(i) {
    colors[pixels[i].color]--;
    colors[selectedColor.id]++;

    pixels[i].element.style.backgroundColor = cInput.value;
    pixels[i].color = selectedColor.id;
}

function addColor(addButton) {
    if (colorElements.length >= 47) return;

    const e = document.createElement('div');
    e.classList = 'color';
    e.style.backgroundColor = defaultColors[0];

    let i = colorElements.push(e) - 1;
    colorNames.push(colorNames[0]);
    colors[i] = 0

    e.onmousedown = function () { selectColor(i, e) };

    cGrid.insertBefore(e, addButton);

    cGrid.style.gridTemplateRows = 'repeat(' + Math.ceil((colorElements.length + 1) / 4) + ', 1fr [c_row])';
}

function removeColor() {
    if (colorElements.length <= 1) return;

    if (colors[selectedColor.id] > 0) {
        alert("Cannot remove this color as it is currently being used in the image.");
        return;
    }

    colorElements[selectedColor.id].remove();

    colors.splice(selectedColor.id, 1);
    colorElements.splice(selectedColor.id, 1);
    colorNames.splice(selectedColor.id, 1);

    for (let i = 0; i < colorElements.length; i++) {
        const e = colorElements[i];
        e.onmousedown = function () { selectColor(i, e) };
    }

    let i = Math.min(selectedColor.id, colorElements.length - 1);
    selectColor(i, colorElements[i]);

    cGrid.style.gridTemplateRows = 'repeat(' + Math.ceil((colorElements.length + 1) / 4) + ', 1fr [c_row])';
}

function selectColor(i, e) {
    selectedColor.element.classList = 'color';

    let rgb = e.style.backgroundColor.slice(4, -1).split(',');
    cInput.value = rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
    cInput.parentElement.style.backgroundColor = cInput.value;

    selectedColor = { id: i, element: e }
    e.classList += ' selected';

    cName.value = colorNames[i];
}

function setColor() {
    selectedColor.element.style.backgroundColor = cInput.value;
    cInput.parentElement.style.backgroundColor = cInput.value;

    for (let i = 0; i < pixels.length; i++) {
        if (pixels[i].color == selectedColor.id) {
            pixels[i].element.style.backgroundColor = cInput.value;
        }
    }
}

function setColorName() {
    colorNames[selectedColor.id] = cName.value;
}
//#endregion

//#region Upload Image -- Crop
function beginUploadImage(e) {
    uploadedImage = new Image();

    uploadedImage.onload = function () {
        initCropImage(uploadedImage);
        uploadedImage.onload = null;
    }

    e = e || window.event;
    let files = e.target?.files || e.srcElement?.files;

    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            uploadedImage.src = fr.result;
            document.getElementById("uploadImageInput").value = null;
        }
        fr.readAsDataURL(files[0]);
    }
}

function initCropImage(uploadedImage) {
    let modal = document.getElementById('crop-modal');
    let bsmodal = new bootstrap.Modal(modal);
    bsmodal.show();

    document.getElementById('img-upload-crop-cropped-out').src = uploadedImage.src;

    let included = document.getElementById('img-upload-crop-included-container');
    let includedImg = document.getElementById('img-upload-crop-included');

    includedImg.src = uploadedImage.src;

    let container = document.getElementById('img-upload-crop');
    let ratio = uploadedImage.width / uploadedImage.height;
    let width, height;

    // if (container.offsetWidth / container.offsetHeight > ratio) {
    //              
    // } else {
    //     width = container.offsetWidth;
    //     height = width / ratio;
    // }

    height = 600;
    width = height * ratio;

    container.style.width = width + 'px';
    container.style.height = height + 'px';

    included.style.width = width + 'px';
    included.style.height = height + 'px';

    includedImg.style.width = width + 'px';
    includedImg.style.height = height + 'px';

    modal.onmouseup = function() { modal.onmousemove = null };
    modal.onmouseleave = function() { modal.onmousemove = null };

    document.getElementById('cropper-line-n').onmousedown = function(e) { cropImageN(e, included, includedImg) }
    document.getElementById('cropper-line-e').onmousedown = function(e) { cropImageE(e, included, includedImg) }
    document.getElementById('cropper-line-s').onmousedown = function(e) { cropImageS(e, included, includedImg) }
    document.getElementById('cropper-line-w').onmousedown = function(e) { cropImageW(e, included, includedImg) }

    document.getElementById('cropper-continue').onclick = function() { finalizeCrop(uploadedImage, bsmodal) }
}

function cropImageN(e) {
    let included = document.getElementById('img-upload-crop-included-container');
    let includedImg = document.getElementById('img-upload-crop-included');

    let top = e.clientY;

    let margin = parseFloat(includedImg.style.marginTop) || 0;
    let height = parseFloat(included.style.height);

    document.getElementById('crop-modal').onmousemove = function(evt) {                 
        let delta = (top - evt.clientY);

        included.style.marginTop = -(margin + delta) + 'px';
        includedImg.style.marginTop = (margin + delta) + 'px';

        included.style.height = (height + delta) + 'px';
    };
}

function cropImageE(e) {
    let included = document.getElementById('img-upload-crop-included-container');

    let left = e.clientX;
    let width = parseFloat(included.style.width);

    document.getElementById('crop-modal').onmousemove = function(evt) {                 
        let delta = (left - evt.clientX);
        included.style.width = (width - delta) + 'px';
    };
}

function cropImageS(e) {
    let included = document.getElementById('img-upload-crop-included-container');

    let top = e.clientY;
    let height = parseFloat(included.style.height);

    document.getElementById('crop-modal').onmousemove = function(evt) {                 
        let delta = (top - evt.clientY);
        included.style.height = (height - delta) + 'px';
    };
}

function cropImageW(e) {
    let included = document.getElementById('img-upload-crop-included-container');
    let includedImg = document.getElementById('img-upload-crop-included');

    let left = e.clientX;

    let margin = parseFloat(includedImg.style.marginLeft) || 0;
    let width = parseFloat(included.style.width);

    document.getElementById('crop-modal').onmousemove = function(evt) {                 
        let delta = (left - evt.clientX);

        included.style.marginLeft = -(margin + delta) + 'px';
        includedImg.style.marginLeft = (margin + delta) + 'px';

        included.style.width = (width + delta) + 'px';
    };
}

function finalizeCrop(uploadedImage, modal) {
    //Crop
    let included = document.getElementById('img-upload-crop-included-container');
    let container = document.getElementById('img-upload-crop');

    let margin = parseFloat(included.style.marginLeft) || 0
    let left = Math.floor(margin / parseFloat(container.style.width) * uploadedImage.width);
    let width = Math.ceil(parseFloat(included.style.width) / parseFloat(container.style.width) * uploadedImage.width);

    margin = parseFloat(included.style.marginTop) || 0
    let top = Math.floor(margin / parseFloat(container.style.height) * uploadedImage.height)
    let height = Math.ceil(parseFloat(included.style.height) / parseFloat(container.style.height) * uploadedImage.height);

    let cropCanvas = document.createElement('canvas');
    let cropCtx = cropCanvas.getContext('2d');
    
    cropCtx.imageSmoothingEnabled = true;
    cropCtx.mozImageSmoothingEnabled = true;
    cropCtx.webkitImageSmoothingEnabled = true;
    cropCtx.msImageSmoothingEnabled = true;

    cropCanvas.width = width;
    cropCanvas.height = height;

    cropCtx.drawImage(uploadedImage, left, top, width, height, 0, 0, width, height);
    uploadedImage.src = cropCanvas.toDataURL();
    uploadedImage.width = width;
    uploadedImage.height = height;

    modal.hide();

    //Begin Grid
    modal = document.getElementById('import-modal');
    let bsmodal = new bootstrap.Modal(modal);
    modal.addEventListener('shown.bs.modal', function () {
        let canvas = document.getElementById('image-import-set-display');
        let ctx = canvas.getContext('2d');

        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.width;
        canvas.imageSmoothingEnabled = false;

        document.body.onresize = function () {
            let canvas = importImage.display.canvas;
            if (canvas == undefined) return;

            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.width;
            canvas.imageSmoothingEnabled = false;

            importImage.draw();
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        importImage = new ImportImage(uploadedImage, canvas, ctx, bsmodal);
        //TODO: Remove modal listener
    })

    bsmodal.show();
}


//#endregion

//#region Upload Image -- Main
let importImage = undefined;

class ImportImage {
    constructor(uploadedImage, canvas, ctx, modal) {
        this.image = uploadedImage;

        this.zoom = 1;
        this.xPos = 0;
        this.yPos = 0;

        this.center = { x: this.image.width / 2, y: this.image.height / 2 };
        this.size = Math.max(this.image.width, this.image.height);

        this.display = { canvas: canvas, ctx: ctx };
        this.display.ctx.imageSmoothingEnabled = true;
        this.display.ctx.mozImageSmoothingEnabled = true;
        this.display.ctx.webkitImageSmoothingEnabled = true;
        this.display.ctx.msImageSmoothingEnabled = true;

        this.grid = { canvas: document.getElementById('image-import-set-grid'), ctx: document.getElementById('image-import-set-grid').getContext('2d') };

        this.gridCellMin = Math.ceil(this.size / 64);
        this.gridCellMax = Math.floor(this.size / 2.5);

        this.gridCellSize = Math.min(this.gridCellMin * 2, this.size);
        this.gridXOffset = -this.gridCellSize;
        this.gridYOffset = -this.gridCellSize;

        this.selectedGridCell = { x: 0, y: 0, w: 1, h: 1 };
        this.draggingGridCell = 0;
        this.ghostGrid = undefined;

        this.p = undefined;
        this.c = undefined;

        this.importModal = modal
        this.finalModal = new bootstrap.Modal(document.getElementById('import-final-modal'));

        this.draw();

        document.getElementById('import-continue').onclick = function() { 
            this.convertImageToGrid();
        }.bind(this);
    }

    draw() {
        this.display.ctx.clearRect(0, 0, this.display.canvas.width, this.display.canvas.height);

        let size = this.size;

        this.xPos = Math.sign(this.xPos) * Math.min(Math.abs(this.xPos), (size - (size / this.zoom)) * 0.5);
        this.yPos = Math.sign(this.yPos) * Math.min(Math.abs(this.yPos), (size - (size / this.zoom)) * 0.5);

        let center = { x: this.center.x + this.xPos, y: this.center.y + this.yPos };

        size /= this.zoom;

        this.display.ctx.drawImage(this.image, center.x - size / 2, center.y - size / 2, size, size,
            0, 0, this.display.canvas.width, this.display.canvas.width);


        this.drawGrid(this.display.canvas.width);
    }

    drawGrid(canvasWidth) {
        this.grid.canvas.width = canvasWidth;
        this.grid.canvas.height = canvasWidth;
        this.grid.ctx.clearRect(0, 0, this.grid.canvas.width, this.grid.canvas.height);

        //Scale factor to convert image pixel units to canvas size units.
        let s = this.display.canvas.width / this.size;

        const xStart = (this.gridXOffset * this.zoom * s) + (this.display.canvas.width / 2) - (((this.size * this.zoom * 0.5) * s) + this.xPos * s * this.zoom);
        let x = xStart;
        while (x < this.size * s) {
            this.grid.ctx.beginPath();
            this.grid.ctx.moveTo(x, 0);
            this.grid.ctx.lineTo(x, this.display.canvas.height);
            this.grid.ctx.stroke();

            x += this.gridCellSize * this.zoom * s;
        }

        const yStart = (this.gridYOffset * this.zoom * s) + (this.display.canvas.height / 2) - (((this.size * this.zoom * 0.5) * s) + this.yPos * s * this.zoom);
        let y = yStart;
        while (y < this.size * s) {
            this.grid.ctx.beginPath();
            this.grid.ctx.moveTo(0, y);
            this.grid.ctx.lineTo(this.display.canvas.width, y);
            this.grid.ctx.stroke();

            y += this.gridCellSize * this.zoom * s;
        }

        if (this.ghostGrid != undefined) {
            this.drawGhostGrid(xStart, yStart);
        }

        if (this.selectedGridCell != undefined) {
            this.grid.ctx.beginPath();

            const cellX = (this.selectedGridCell.x * this.zoom * s) + xStart - (this.gridXOffset * this.zoom * s);
            const cellY = (this.selectedGridCell.y * this.zoom * s) + yStart - (this.gridYOffset * this.zoom * s);
            const cellSize = this.gridCellSize * this.zoom * s;

            this.grid.ctx.rect(cellX, cellY, (cellSize * this.selectedGridCell.w), (cellSize * this.selectedGridCell.h));
            this.grid.ctx.lineWidth = "3";
            this.grid.ctx.strokeStyle = "rgba(0, 255, 255, 1)";
            this.grid.ctx.fillStyle = "rgba(0, 255, 255, 1)";
            this.grid.ctx.stroke();

            this.grid.ctx.beginPath();
            this.grid.ctx.arc(cellX, cellY, 5, 0 * Math.PI, 2 * Math.PI);
            this.grid.ctx.fill();

            this.grid.ctx.beginPath();
            this.grid.ctx.arc(cellX + (cellSize * this.selectedGridCell.w), cellY, 5, 0 * Math.PI, 2 * Math.PI);
            this.grid.ctx.fill();

            this.grid.ctx.beginPath();
            this.grid.ctx.arc(cellX + (cellSize * this.selectedGridCell.w), cellY + (cellSize * this.selectedGridCell.h), 5, 0 * Math.PI, 2 * Math.PI);
            this.grid.ctx.fill();

            this.grid.ctx.beginPath();
            this.grid.ctx.arc(cellX, cellY + (cellSize * this.selectedGridCell.h), 5, 0 * Math.PI, 2 * Math.PI);
            this.grid.ctx.fill();
        }
    }

    drawGhostGrid(xStart, yStart) {
        let s = this.display.canvas.width / this.size;

        this.grid.ctx.strokeStyle = "red";

        let x = xStart + ((this.ghostGrid.xOffset + this.ghostGrid.xScale) * this.zoom * s);
        x = mod(x, (this.gridCellSize + this.ghostGrid.sizeOffset) * this.zoom * s);
        while (x < this.size * s) {
            this.grid.ctx.beginPath();
            this.grid.ctx.moveTo(x, 0);
            this.grid.ctx.lineTo(x, this.display.canvas.height);
            this.grid.ctx.stroke();

            x += (this.gridCellSize + this.ghostGrid.sizeOffset) * this.zoom * s;
        }

        let y = yStart + ((this.ghostGrid.yOffset + this.ghostGrid.yScale) * this.zoom * s);
        y = mod(y, (this.gridCellSize + this.ghostGrid.sizeOffset) * this.zoom * s);
        while (y < this.size * s) {
            this.grid.ctx.beginPath();
            this.grid.ctx.moveTo(0, y);
            this.grid.ctx.lineTo(this.display.canvas.width, y);
            this.grid.ctx.stroke();

            y += (this.gridCellSize + this.ghostGrid.sizeOffset) * this.zoom * s;
        }
    }

    selectGridCell(e, selectNewCell = true) {
        var rect = this.display.canvas.getBoundingClientRect();

        const s = this.display.canvas.width * this.zoom;

        let x = e.clientX - rect.left + (s - this.display.canvas.width) * 0.5;
        let y = e.clientY - rect.top + (s - this.display.canvas.width) * 0.5;

        x *= this.size / s;
        y *= this.size / s;

        x += this.xPos - (this.gridXOffset + this.gridCellSize);
        y += this.yPos - (this.gridYOffset + this.gridCellSize);

        let newCell = {
            x: this.gridXOffset + Math.ceil(x / this.gridCellSize) * this.gridCellSize,
            y: this.gridYOffset + Math.ceil(y / this.gridCellSize) * this.gridCellSize,
            w: 1,
            h: 1
        };

        let xDiff = (x + (this.gridXOffset + this.gridCellSize)) - this.selectedGridCell.x;
        let yDiff = (y + (this.gridYOffset + this.gridCellSize)) - this.selectedGridCell.y;

        const checkValue = 15 * this.size / s;

        if (xDiff > -checkValue && xDiff < checkValue) {
            if (yDiff > -checkValue && yDiff < checkValue) {
                this.draggingGridCell = 5;
                if (this.ghostGrid == undefined) {
                    this.ghostGrid = { xOffset: 0, yOffset: 0, sizeOffset: 0, xScale: 0, yScale: 0 };
                }
                
            } else if (yDiff > (this.gridCellSize * this.selectedGridCell.h) - checkValue && yDiff < (this.gridCellSize * this.selectedGridCell.h) + checkValue) {
                this.draggingGridCell = 4;
                if (this.ghostGrid == undefined) {
                    this.ghostGrid = { xOffset: 0, yOffset: 0, sizeOffset: 0, xScale: 0, yScale: 0 };
                }

            }
        } else if (xDiff > (this.gridCellSize * this.selectedGridCell.w) - checkValue && xDiff < (this.gridCellSize * this.selectedGridCell.w) + checkValue) {
            if (yDiff > -checkValue && yDiff < checkValue) {
                this.draggingGridCell = 3;
                if (this.ghostGrid == undefined) {
                    this.ghostGrid = { xOffset: 0, yOffset: 0, sizeOffset: 0, xScale: 0, yScale: 0 };
                }

            } else if (yDiff > (this.gridCellSize * this.selectedGridCell.h) - checkValue && yDiff < (this.gridCellSize * this.selectedGridCell.h) + checkValue) {
                this.draggingGridCell = 2;
                if (this.ghostGrid == undefined) {
                    this.ghostGrid = { xOffset: 0, yOffset: 0, sizeOffset: 0, xScale: 0, yScale: 0 };
                }

            }
        } else if ((Math.abs(this.selectedGridCell.x - newCell.x) + Math.abs(this.selectedGridCell.y - newCell.y)) < this.gridCellSize) {
            this.draggingGridCell = 1;

            if (this.ghostGrid == undefined) {
                this.ghostGrid = { xOffset: 0, yOffset: 0, sizeOffset: 0, xScale: 0, yScale: 0 };
            }
        } else if (selectNewCell) {
            this.selectedGridCell = newCell;
        }

        this.draw();
    }

    convertImageToGrid() {
        let data = imageToImageData(this.image);

        let count = Math.floor(this.gridCellSize / 3);
        let checkGuide = new Array();

        for (let i = 1; i <= count; i++) {
            for (let j = 1; j <= count; j++) {
                checkGuide.push([i * 3, j * 3]);
            }
        }

        //TODO: patchwork solution because i can't figure why the algorithms doesn't work with non-integer inputs.
        this.gridCellSize = Math.round(this.gridCellSize);
        this.gridXOffset = Math.round(this.gridXOffset);
        this.gridYOffset = Math.round(this.gridYOffset);

        let x = this.gridXOffset + this.gridCellSize;
        let y = this.gridYOffset + this.gridCellSize;

        let xBuffer = Math.floor((this.size - this.image.width) * 0.5);
        let yBuffer = Math.floor((this.size - this.image.height) * 0.5);

        let rows = 0;
        let cols = 0;
        this.p = [];


        //TODO: maybe go over this algorithm.
        while (y < this.size - this.gridCellSize) {
            while (x < this.size - this.gridCellSize) {
                let avg = [0, 0, 0];

                for (let i = 0; i < checkGuide.length; i++) {
                    let rgb = [255, 255, 255];

                    if (checkGuide[i][0] + x > xBuffer && checkGuide[i][0] + x < this.size - xBuffer
                        && checkGuide[i][1] + y > yBuffer && checkGuide[i][1] + y < this.size - yBuffer) {

                        const check = (x + checkGuide[i][0] - xBuffer) + (y + checkGuide[i][1] - yBuffer) * this.image.width;
                        rgb = [data.data[check * 4], data.data[(check * 4) + 1], data.data[(check * 4) + 2]];
                    }

                    avg[0] = ((avg[0] * i) + rgb[0]) / (i + 1);
                    avg[1] = ((avg[1] * i) + rgb[1]) / (i + 1);
                    avg[2] = ((avg[2] * i) + rgb[2]) / (i + 1);
                }

                this.p.push({ color: [Math.round(avg[0]), Math.round(avg[1]), Math.round(avg[2])], element: undefined });
                x += this.gridCellSize;
                cols++;
            }

            y += this.gridCellSize;
            x = this.gridXOffset + this.gridCellSize;
            rows++;
        }

        cols /= rows;

        this.c = Array.from(this.p, (e, i) => [{ index: i, color: e.color, element: undefined }]);
        this.selected = undefined;
        this.combining = false;
        document.getElementById('import-final-modal').onclick = function () { this.deselectColor() }.bind(this);

        //For each pixel in the grid...
        for (let i = 1; i < this.p.length; i++) {
            const a = this.c[i][0].color;

            //...check the pixel groups before it...
            for (let j = 0; j < i; j++) {
                let cont = false;

                if (this.c[j] == undefined) {
                    continue;
                }

                //...loop through the group, check each pixel...   
                for (let k = 0; k < this.c[j].length; k++) {
                    const b = this.c[j][k].color;

                    let diff = Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);

                    //if the current pixel and this pixel are close enough, continue checking the group,
                    //else end the loop and move onto the next group.
                    if (diff > 2500) {
                        cont = true;
                        break;
                    }
                }

                if (cont) {
                    continue;
                }

                //if the pixel is close enough to every other in the group,
                //add it to the group and move to the next pixel
                this.c[j].push(this.c[i][0]);
                this.c[i] = undefined;

                break;
            }
        }

        //Remove all undefined elements.
        this.c = this.c.filter(item => item);

        for (let i = 0; i < this.c.length; i++) {
            let avg = this.c[i][0].color;
            for (let j = 1; j < this.c[i].length; j++) {
                avg[0] = ((avg[0] * i) + this.c[i][j].color[0]) / (i + 1);
                avg[1] = ((avg[1] * i) + this.c[i][j].color[1]) / (i + 1);
                avg[2] = ((avg[2] * i) + this.c[i][j].color[2]) / (i + 1);
            }

            avg = [Math.round(avg[0]), Math.round(avg[1]), Math.round(avg[2])];

            for (let j = 0; j < this.c[i].length; j++) {
                this.c[i][j].color = avg;
                this.p[this.c[i][j].index].color = avg;
            }
        }

        this.c = this.c.sort((a, b) => {
            return rgbToHue(...a[0].color) - rgbToHue(...b[0].color);
        });

        this.importModal.hide();
        this.finalModal.show();

        let importColorGrid = document.getElementById('img-import-color-grid');
        importColorGrid.style.gridTemplateColumns = 'repeat(' + 6 + ', 1fr [col]';
        // importColorGrid.style.height = (32 * Math.ceil(this.c.length / 6) / 6) + 'vw';

        importColorGrid.onmouseleave = function () { this.unhighlight() }.bind(this);

        for (let i = 0; i < this.c.length; i++) {
            const e = document.createElement('div');
            e.classList = 'color';
            e.style.backgroundColor = rgbToHex(...this.c[i][0].color);
            e.onmousedown = function (e) { e.stopPropagation(); this.selectColor(i); }.bind(this);
            e.onclick = function (e) { e.stopPropagation(); };
            e.onmouseover = function () { this.highlightColor(i) }.bind(this);

            this.c[i][0].element = e;
            importColorGrid.appendChild(e);
        }

        let importGrid = document.getElementById('img-import-grid');

        importGrid.style.aspectRatio = cols / rows

        importGrid.style.gridTemplateRows = 'repeat(' + (rows) + ', 1fr [row]';
        importGrid.style.gridTemplateColumns = 'repeat(' + (cols) + ', 1fr [col]';

        this.dimensions = { r: rows, c: cols };

        for (let i = 0; i < this.p.length; i++) {
            const e = document.createElement('div');
            e.classList = 'grid-item';
            e.style.backgroundColor = rgbToHex(...this.p[i].color);
            e.style.transition = 'background-color 0.1s';

            this.p[i].element = e;
            importGrid.appendChild(e);
        }

        document.getElementById('import-final-continue').onclick = function() { this.finishImport(); }.bind(this);
    }

    selectColor(index) {
        if (this.combining) {
            if (this.c[index][0].element.classList.contains('selected')) {
                this.c[index][0].element.classList = 'color';
                this.selected.splice(this.selected.indexOf(index), 1);
            } else {
                this.c[index][0].element.classList += ' selected';
                this.selected.push(index);
            }

            this.highlightColor(index);
            return;
        }

        if (this.selected != undefined) {
            if (index == this.selected) {
                this.deselectColor();
                return;
            }

            this.c[this.selected][0].element.style.transform = '';
            this.c[this.selected][0].element.style.zIndex = '';
        } else {
            this.selectMenu = document.getElementById('import-color-select');

            this.selectMenuColor = document.getElementById('import-color-picker');
            this.selectMenuColor.onchange = function () { this.changeColor() }.bind(this);

            document.getElementById('import-begin-combine').onclick = function () { this.combine() }.bind(this);
        }
        this.c[index][0].element.style.transform = 'scale(1.3)';
        this.c[index][0].element.style.zIndex = '5';

        this.selected = index;
        this.highlightColor(index);

        this.selectMenu.style.display = 'block';
        this.selectMenuColor.value = rgbToHex(...this.c[index][0].color)

    }

    deselectColor() {
        if (this.selected == undefined) return;

        if (this.combining) {
            for (let i = 0; i < this.selected.length; i++) {
                this.c[this.selected[i]][0].element.classList = 'color';
            }

            this.combining = false;
        }

        this.c[this.selected][0].element.style.transform = '';
        this.c[this.selected][0].element.style.zIndex = '0';

        this.selectMenu.style.display = 'none';

        this.selected = undefined;
        this.unhighlight();
    }

    changeColor() {
        this.c[this.selected][0].element.style.backgroundColor = this.selectMenuColor.value;

        let color = hexToRgb(this.selectMenuColor.value)
        this.c[this.selected][0].color = color;

        for (let i = 0; i < this.c[this.selected].length; i++) {
            const index = this.c[this.selected][i].index;
            this.p[index].color = color;
            this.p[index].element.style.backgroundColor = rgbToHex(...this.p[index].color);
        }
    }

    highlightColor(index) {
        for (let i = 0; i < this.c.length; i++) {
            let color = this.c[i][0].color;

            if (this.combining) {
                if (i != index && !this.selected.includes(i)) {
                    let hsv = rgbToHSV(...color);
                    hsv[1] *= 0.2;
                    hsv[2] = 255 - ((255 - hsv[2]) * 0.2);
                    color = hsvToRGB(...hsv);
                }

            } else if (i != index && i != this.selected) {
                let hsv = rgbToHSV(...color);
                hsv[1] *= 0.2;
                hsv[2] = 255 - ((255 - hsv[2]) * 0.2);
                color = hsvToRGB(...hsv);
            }

            for (let j = 0; j < this.c[i].length; j++) {
                this.p[this.c[i][j].index].element.style.backgroundColor = rgbToHex(...color);
            }
        }
    }

    unhighlight() {
        if (this.selected == undefined) {
            for (let i = 0; i < this.c.length; i++) {
                let color = this.c[i][0].color;

                for (let j = 0; j < this.c[i].length; j++) {
                    this.p[this.c[i][j].index].element.style.backgroundColor = rgbToHex(...color);
                }
            }
        } else {
            this.highlightColor(this.selected);
        }
    }

    combine() {
        if (this.combining) {
            let base = this.c[this.selected[0]];
            let color = base[0].color;
            let start = base.length;

            base[0].element.classList = 'color';

            for (let i = 1; i < this.selected.length; i++) {
                base.push(...this.c[this.selected[i]]);

                this.c[this.selected[i]][0].element.remove();
                this.c[this.selected[i]] = undefined;
            }

            //Remove all undefined elements.
            this.c = this.c.filter(item => item);

            for (let i = 0; i < this.c.length; i++) {
                const el = this.c[i][0].element;
                el.onmousedown = function (e) { e.stopPropagation(); this.selectColor(i); }.bind(this);
                el.onmouseover = function () { this.highlightColor(i) }.bind(this);
            }

            for (let i = start; i < base.length; i++) {
                const index = base[i].index;
                this.p[index].color = color;
                this.p[index].element.style.backgroundColor = rgbToHex(...this.p[index].color);
            }

            let importColorGrid = document.getElementById('img-import-color-grid');
            importColorGrid.style.height = (32 * Math.ceil(this.c.length / 6) / 6) + 'vw';

            this.combining = false;
            this.selected = this.c.indexOf(base);
            this.highlightColor(this.selected);

        } else {
            this.combining = true;

            this.c[this.selected][0].element.style.transform = '';
            this.c[this.selected][0].element.style.zIndex = '';

            this.c[this.selected][0].element.classList += ' selected';

            this.selected = [this.selected];
        }
    }

    close() {
        if (this.c) {
            for (let i = 0; i < this.c.length; i++) {
                this.c[i][0].element.remove();
            }
        }

        if (this.p) {
            for (let i = 0; i < this.p.length; i++) {
                this.p[i].element.remove();
            }
        }

        document.body.onresize = null;
    }

    finishImport() {
        this.close();

        let p = new Array(this.p.length);
        let colors = Array.from(this.c, (e, i) => {
            for (let j = 0; j < e.length; j++) {
                p[e[j].index] = i;
            }

            return {
                count: e.length,
                color: rgbToHex(...e[0].color),
                name: ''
            }
        });

        let image = {
            dimensions: this.dimensions,
            pixels: p,
            colors: colors
        }

        importObject(image);
        this.finalModal.hide();
    }
}

function importObject(image) {
    document.getElementById('rows').value = image.dimensions.r;
    setGridRows();

    document.getElementById('columns').value = image.dimensions.c;
    setGridColumns();

    //Clear all color elements and create new ones
    while (colorElements[0].nextElementSibling) {
        colorElements[0].nextElementSibling.remove()
    }

    colorElements[0].remove();

    cInput.value = image.colors[0].color;
    cInput.parentElement.style.backgroundColor = cInput.value;
    for (let i = 0; i < image.colors.length; i++) {
        const e = document.createElement('div');
        e.classList = 'color';
        e.style.backgroundColor = image.colors[i].color;
        e.onmousedown = function () { selectColor(i, e) };
        colorElements[i] = e;
        cGrid.appendChild(e);

        if (i == 0) {
            selectedColor = { id: 0, element: e };
            e.classList += ' selected';

            cName.value = colorNames[i];
        }
    }

    const addButton = document.createElement('div');
    addButton.classList = 'add-color';
    addButton.onmousedown = function () { addColor(addButton) };
    cGrid.appendChild(addButton);

    colors = new Array(image.colors.length);
    colorNames = new Array(image.colors.length);

    for (let i = 0; i < image.colors.length; i++) {
        colors[i] = image.colors[i].count;
        colorNames[i] = image.colors[i].name;
    }

    cGrid.style.gridTemplateRows = 'repeat(' + Math.ceil((colorElements.length + 1) / 4) + ', 1fr [c_row])';

    for (let i = 0; i < pixels.length; i++) {
        pixels[i].color = image.pixels[i];
        pixels[i].element.style.backgroundColor = image.colors[pixels[i].color].color;
    }

    selectColor(0, colorElements[0]);
}

function importImageDisplayMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    importImage.selectGridCell(e, false);

    let startX = e.clientX;
    let startY = e.clientY;
    importImage.display.canvas.onmousemove = function (e) { importImageDisplayMouseMove(e, startX, startY) };
}

function importImageDisplayMouseMove(e, startX, startY) {
    let s = (importImage.size / (importImage.display.canvas.width * importImage.zoom));

    switch (importImage.draggingGridCell) {
        case 1:
            importImage.ghostGrid.xOffset += e.movementX * s;
            importImage.ghostGrid.yOffset += e.movementY * s;
            break;

        case 2:
            importImage.ghostGrid.sizeOffset = Math.min((e.clientX - startX) / importImage.selectedGridCell.w, (e.clientY - startY) / importImage.selectedGridCell.h) * s;
            importImage.ghostGrid.sizeOffset = Math.max(Math.min(importImage.gridCellSize + importImage.ghostGrid.sizeOffset, importImage.gridCellMax), importImage.gridCellMin) - importImage.gridCellSize;

            importImage.ghostGrid.xScale = - importImage.ghostGrid.sizeOffset * Math.floor(1 + (importImage.selectedGridCell.x) / importImage.gridCellSize);
            importImage.ghostGrid.yScale = - importImage.ghostGrid.sizeOffset * Math.floor(1 + (importImage.selectedGridCell.y) / importImage.gridCellSize);
            break;

        case 3:
            importImage.ghostGrid.sizeOffset = Math.min((e.clientX - startX) / importImage.selectedGridCell.w, -(e.clientY - startY) / importImage.selectedGridCell.h) * s;
            importImage.ghostGrid.sizeOffset = Math.max(Math.min(importImage.gridCellSize + importImage.ghostGrid.sizeOffset, importImage.gridCellMax), importImage.gridCellMin) - importImage.gridCellSize;

            importImage.ghostGrid.xScale = - importImage.ghostGrid.sizeOffset * Math.floor(1 + (importImage.selectedGridCell.x) / importImage.gridCellSize);
            importImage.ghostGrid.yScale = - importImage.ghostGrid.sizeOffset * Math.floor(1 + importImage.selectedGridCell.h + (importImage.selectedGridCell.y) / importImage.gridCellSize);
            break;

        case 4:
            importImage.ghostGrid.sizeOffset = Math.min(-(e.clientX - startX) / importImage.selectedGridCell.w, (e.clientY - startY) / importImage.selectedGridCell.h) * s;
            importImage.ghostGrid.sizeOffset = Math.max(Math.min(importImage.gridCellSize + importImage.ghostGrid.sizeOffset, importImage.gridCellMax), importImage.gridCellMin) - importImage.gridCellSize;

            importImage.ghostGrid.xScale = - importImage.ghostGrid.sizeOffset * Math.floor(1 + importImage.selectedGridCell.w + (importImage.selectedGridCell.x) / importImage.gridCellSize);
            importImage.ghostGrid.yScale = - importImage.ghostGrid.sizeOffset * Math.floor(1 + (importImage.selectedGridCell.y) / importImage.gridCellSize);
            break;

        case 5:
            importImage.ghostGrid.sizeOffset = Math.min(-(e.clientX - startX) / importImage.selectedGridCell.w, -(e.clientY - startY) / importImage.selectedGridCell.h) * s;
            importImage.ghostGrid.sizeOffset = Math.max(Math.min(importImage.gridCellSize + importImage.ghostGrid.sizeOffset, importImage.gridCellMax), importImage.gridCellMin) - importImage.gridCellSize;

            importImage.ghostGrid.xScale = - importImage.ghostGrid.sizeOffset * Math.floor(1 + importImage.selectedGridCell.w + (importImage.selectedGridCell.x) / importImage.gridCellSize);
            importImage.ghostGrid.yScale = - importImage.ghostGrid.sizeOffset * Math.floor(1 + importImage.selectedGridCell.h + (importImage.selectedGridCell.y) / importImage.gridCellSize);
            break;


        default:
            importImage.xPos -= e.movementX * s;
            importImage.yPos -= e.movementY * s;
            break;
    }

    importImage.draw();
}

function importImageDisplayMouseUp(e) {
    importImage.display.canvas.onmousemove = '';

    if (importImage.ghostGrid != undefined) {
        importImage.gridCellSize = importImage.gridCellSize + importImage.ghostGrid.sizeOffset;

        importImage.gridXOffset += importImage.ghostGrid.xOffset + importImage.ghostGrid.xScale;
        importImage.gridYOffset += importImage.ghostGrid.yOffset + importImage.ghostGrid.yScale;

        importImage.gridXOffset = mod(importImage.gridXOffset, importImage.gridCellSize);
        importImage.gridXOffset -= importImage.gridCellSize;

        importImage.gridYOffset = mod(importImage.gridYOffset, importImage.gridCellSize);
        importImage.gridYOffset -= importImage.gridCellSize;

        switch (importImage.draggingGridCell) {
            case 1:
                importImage.selectedGridCell.x += importImage.ghostGrid.xOffset;
                importImage.selectedGridCell.y += importImage.ghostGrid.yOffset;
                break;

            case 3:
                importImage.selectedGridCell.y -= importImage.ghostGrid.sizeOffset * importImage.selectedGridCell.h;
                break;

            case 4:
                importImage.selectedGridCell.x -= importImage.ghostGrid.sizeOffset * importImage.selectedGridCell.w;
                break;

            case 5:
                importImage.selectedGridCell.x -= importImage.ghostGrid.sizeOffset * importImage.selectedGridCell.w;
                importImage.selectedGridCell.y -= importImage.ghostGrid.sizeOffset * importImage.selectedGridCell.h;
                break;
        }

        importImage.draggingGridCell = 0;

        importImage.ghostGrid = undefined;
        importImage.draw();
    } else {
        importImage.selectGridCell(e);
        importImage.draw();
    }
}

function importImageDisplayMouseLeave() {
    importImage.display.canvas.onmousemove = '';
}

function importImageDisplayMouseWheel(e) {
    e.preventDefault();

    if (e.deltaY > 0) {
        importImage.zoom *= 1.05;
    }
    else {
        importImage.zoom /= 1.05;
    }

    importImage.zoom = Math.min(6, Math.max(1, importImage.zoom));

    importImage.draw();
}

//Derived from Stack Overflow answer: https://stackoverflow.com/a/68319943
function imageToImageData(image) {
    const context = Object.assign(document.createElement('canvas'), {
        width: image.width,
        height: image.height
    }).getContext('2d');

    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, image.width, image.height);
}

//Form Handlers
function importImageSetZoom() {
    importImage.zoom = Math.max(1, (Math.min(10, document.getElementById('import-image-zoom').value)));
    document.getElementById('import-image-zoom').value = importImage.zoom;
    importImage.draw();
}

function importImageSetPos() {
    importImage.xPos = document.getElementById('import-image-xpos').value;
    importImage.yPos = document.getElementById('import-image-ypos').value;

    importImage.draw();
}

function importImageSetGridOffset() {
    importImage.gridXOffset = mod(parseInt(document.getElementById('import-image-gridx').value), importImage.gridCellSize);
    importImage.gridXOffset -= importImage.gridCellSize;

    importImage.gridYOffset = mod(parseInt(document.getElementById('import-image-gridy').value), importImage.gridCellSize);
    importImage.gridYOffset -= importImage.gridCellSize;

    importImage.draw();
}

function importImageSetGridCellSize() {
    importImage.gridCellSize = Math.max(importImage.gridCellMin, (Math.min(importImage.gridCellMax, parseInt(document.getElementById('import-image-cellSize').value))));
    document.getElementById('import-image-cellSize').value = importImage.gridCellSize;

    importImageSetGridOffset();

    importImage.draw();
}

//#endregion

//#region Set Questions 

function toggleQuestion(e, type) {
    var button = e.target.closest("button") || e.srcElement.closest("button");
    button.classList.toggle("active");

    var content = button.nextElementSibling;
    content.classList.toggle("active");

    if (content.style.maxHeight) {
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = (content.scrollHeight + 20) + "px";
    }

    questionParams.questionTypes[type] = 1 - questionParams.questionTypes[type];
}

function setAdditionParams() {
    questionParams.addition.min = parseInt(document.getElementById("number-range-from-addition").value);
    questionParams.addition.max = parseInt(document.getElementById("number-range-to-addition").value);
}

function setSubtractionParams() {
    questionParams.subtraction.min = parseInt(document.getElementById("number-range-from-subtraction").value);
    questionParams.subtraction.max = parseInt(document.getElementById("number-range-to-subtraction").value);
}

function setMultiplicationParams() {
    questionParams.multiplication.min = parseInt(document.getElementById("number-range-from-multiplication").value);
    questionParams.multiplication.max = parseInt(document.getElementById("number-range-to-multiplication").value);
}

function setDivisionParams() {
    questionParams.division.min = parseInt(document.getElementById("number-range-from-division").value);
    questionParams.division.max = parseInt(document.getElementById("number-range-to-division").value);
}

function setQuestionCount(e) {
    var input = e.target || e.srcElement;
    let count = input.value;
    count = Math.max(5, Math.min(60, count));

    let activeColorCount = 0
    for (let i = 0; i < colors.length; i++) {
        //Returns true when number of pixels of a certain color is greater than zero. Hence, that color is 
        //used and should be added to list.
        if (colors[i]) {
            activeColorCount++;
        }
    }

    if (count <= activeColorCount) {
        count = activeColorCount;
    }

    input.value = count;
    questionParams.questionCount = count;
}

//#endregion

//#region Generate Image
function generate() {
    let modal = document.getElementById('generate-final-modal');
    let bsmodal = new bootstrap.Modal(modal);
    bsmodal.show();

    let colorNameElements = [modal.querySelector('.generate-color-name-block')];
    while (colorNameElements[0].nextElementSibling) {
        colorNameElements[0].nextElementSibling.remove()
    }

    for (let i = 0; i < colors.length; i++) {
        let element = colorNameElements[0];
        
        if (i != 0) {
            element = colorNameElements[i - 1].cloneNode(true);
            colorNameElements[i - 1].after(element);
            colorNameElements.push(element);
        }

        element.querySelector('.generate-color-name-indicator').style.backgroundColor = colorElements[i].style.backgroundColor;
        let input = element.querySelector('.form-control');
        input.value = colorNames[i];
        input.onchange = function() {
            colorNames[i] = input.value;
        }
    }

    document.getElementById('generate-continue').onclick = function() { 
        for (let i = 0; i < colorNames.length; i++) {
            if (colorNames[i].trim() == '') {
                alert("Name all colors");
                return;
            }
        }

        bsmodal.hide();

        openGenerateSettings();
    }
}

function openGenerateSettings() {
    let modal = document.getElementById('generate-final-settings-modal');
    let bsmodal = new bootstrap.Modal(modal);
    bsmodal.show();

    document.getElementById('generate-finish').onclick = function() { 
        bsmodal.hide();

        let params = drawQuestions();
        generateGrid(params.colorNumbers, params.activeColors, generationParams.blockSize);
    }
}

function setGridGenerationMode(e) {
    let mode = e.target.value || e.srcElement.value;
    if (mode == 1) {
        generationParams.blockSize = 1;
        generationParams.customBlockSizeEl?.hide();

    } else if (mode == 2) {
        generationParams.blockSize = 5;
        generationParams.customBlockSizeEl?.hide();


    } else if (mode == 3) {
        generationParams.blockSize = 999;
        generationParams.customBlockSizeEl?.hide();


    } else if (mode == 4) {
        if (generationParams.customBlockSizeEl) {
            generationParams.customBlockSizeEl.show();
        } else {
            generationParams.customBlockSizeEl = new bootstrap.Collapse(document.getElementById("generation-block-size-input"));
        }
    }
}

function setGridGenerationBlockSize(e) {
    let input = e.target || e.srcElement;
    if (input.value > 99) input.value = 99;
    if (input.value < 2) input.value = 2;

    generationParams.blockSize = input.value;
}

function toggleDrawSwatches(e) {
    let input = e.target.checked || e.srcElement.checked;
    questionParams.drawSwatches = input;
}

//A section is a collection of image pixels that are all connected and of one color. They may be blocks of a large single color patch or the entire patch.
class Section {
    constructor(pixel) {
        this.pixels = [pixel];
    }

    add(p) {
        this.pixels.push(p);
    }

    addm(p) {
        this.pixels.push(...p)
    }

    combine(section) {
        this.pixels.push(...section.pixels);
    }

    //Breaks the section down into smaller blocks
    blockize(blockSize) {
        let unused = [...this.pixels];
        let blocks = [];

        while (unused.length > 0) {
            //Set a pixel to start the block.
            const start = parseInt(unused.splice(0, 1));
            dimensions.c = parseInt(dimensions.c);
            let block = new Section(start);


            //Create a list of neighbours to the block, starting with all the starting pixel's neighbours.
            let neighbours = [];

            if (unused.includes(start - dimensions.c))
                neighbours.push(start - dimensions.c);

            if (start % dimensions.c != 0 && unused.includes(start - 1))
                neighbours.push(start - 1);

            if (unused.includes(start + dimensions.c))
                neighbours.push(start + dimensions.c);

            if ((start + 1) % dimensions.c != 0 && unused.includes(start + 1))
                neighbours.push(start + 1);

            //Loop until block is large enough (or there are no more neighbours to add to the block).
            while (true) {
                if (neighbours.length == 0) {
                    break;
                }

                //Select a random number of pixels from the block's neighbours to add to the block.
                let count = Math.min(Math.floor(Math.random() * (blockSize - block.size)) + 1, neighbours.length);
                let added = get_random_destructive(neighbours, count);
                block.addm(added);

                //Find all the neighbours of all the added pixels and add them to the neighbours array.
                for (let j = 0; j < added.length; j++) {
                    unused.splice(unused.indexOf(added[j]), 1);
                }

                if (block.size < blockSize) {
                    for (let j = 0; j < added.length; j++) {
                        const e = parseInt(added[j]);

                        if (unused.includes(e - dimensions.c) && !neighbours.includes(e - dimensions.c))
                            neighbours.push(e - dimensions.c);

                        if (e % dimensions.c != 0 && unused.includes(e - 1) && !neighbours.includes(e - 1))
                            neighbours.push(e - 1);

                        if (unused.includes(e + dimensions.c) && !neighbours.includes(e + dimensions.c))
                            neighbours.push(e + dimensions.c);

                        if ((e + 1) % dimensions.c != 0 && unused.includes(e + 1) && !neighbours.includes(e + 1))
                            neighbours.push(e + 1);
                    }

                } else {
                    break;
                }
            }

            //Add new block to the list of block.
            blocks.push(block);
        }

        return blocks;
    }

    get color() {
        return pixels[this.pixels[0]].color;
    }

    get size() {
        return this.pixels.length;
    }
}

//Divides the image into smaller color sections/blocks.
function getImageSections(blockSize) {
    //The sections are first divided by color, then patches of that color
    let sections = [...Array(colors.length)].map(e => []);
    let pixelSections = new Array(pixels.length);

    for (let i = 0; i < pixels.length; i++) {
        let c = pixels[i].color;

        //Check pixel vertically above
        if ((i - dimensions.c) in pixels && pixels[i - dimensions.c].color == c) {
            pixelSections[i] = pixelSections[i - dimensions.c];
        }

        //Check pixel directly to the left
        if (i % dimensions.c != 0 && pixels[i - 1].color == c) {
            if (pixelSections[i]) {
                if (pixelSections[i] != pixelSections[i - 1]) {
                    let addedSection = pixelSections[i - 1];
                    pixelSections[i].combine(addedSection);

                    for (let j = 0; j < addedSection.pixels.length; j++) {
                        pixelSections[addedSection.pixels[j]] = pixelSections[i];
                    }

                    sections[c].splice(sections[c].indexOf(addedSection), 1);
                }
            } else {
                pixelSections[i] = pixelSections[i - 1];
            }
        }

        if (pixelSections[i]) {
            pixelSections[i].add(i);
        } else {
            let s = new Section(i);
            sections[c].push(s);
            pixelSections[i] = s;
        }
    }

    //Sections can now be blockized, further divided into smaller blocks
    if (blockSize > 0) {
        for (let i = 0; i < sections.length; i++) {
            let blocks = [];
            for (let j = 0; j < sections[i].length; j++) {
                blocks.push(...sections[i][j].blockize(blockSize));
            }
            sections[i] = blocks;
        }
    }

    return sections;
}

function generateQuestions() {
    if (questionParams.questionTypes[0] + questionParams.questionTypes[1] + questionParams.questionTypes[2] + questionParams.questionTypes[3] == 0) {
        return get_random(Array.from(new Array(questionParams.questionCount * 2), (x, i) => Object.create({number: i + 1, question: i + 1 }) ), questionParams.questionCount);
    }

    let numbers = [];
    let usedNumbers = [];
    let type = 0;
    while (numbers.length < questionParams.questionCount) {
        switch (type) {
            // Addition
            case 0: {
                if (questionParams.questionTypes[0] == 0) {
                    break;
                }

                let a = Math.floor(questionParams.addition.min + Math.random() * (questionParams.addition.max - questionParams.addition.min));
                let b = Math.floor(questionParams.addition.min + Math.random() * (questionParams.addition.max - questionParams.addition.min));

                let n = a + b;

                while (true) {
                    if (!usedNumbers.includes(n)) {
                        numbers.push({ number: n, question: a + ' + ' + b + ' = '});
                        usedNumbers.push(n);
                        break;
                    } else {
                        n++;
                        a++;
                    }

                    if (!usedNumbers.includes(n)) {
                        numbers.push({ number: n, question: a + ' + ' + b + ' = '});
                        usedNumbers.push(n);
                        break;
                    } else {
                        n++;
                        b++;
                    }
                }

                break;
            }
                
            // Subtraction
            case 1: {
                if (questionParams.questionTypes[1] == 0) {
                    break;
                }

                let a = Math.floor(questionParams.subtraction.min + Math.random() * (questionParams.subtraction.max - questionParams.subtraction.min));
                let b = Math.floor(questionParams.subtraction.min + Math.random() * (a - 1 - questionParams.subtraction.min));

                let n = a - b;

                while (true) {
                    if (!usedNumbers.includes(n)) {
                        numbers.push({ number: n, question: a + ' - ' + b + ' = '});
                        usedNumbers.push(n);
                        break;
                    } else {
                        n++;
                        a++;
                    }
                }

                break;
            }

            // Multiplication
            case 2: {
                if (questionParams.questionTypes[2] == 0) {
                    break;
                }

                let a = Math.floor(questionParams.multiplication.min + Math.random() * (questionParams.multiplication.max - questionParams.multiplication.min));
                let b = Math.floor(questionParams.multiplication.min + Math.random() * (questionParams.multiplication.max - questionParams.multiplication.min));

                let n = a * b;

                while (true) {                    
                    if (!usedNumbers.includes(n)) {
                        numbers.push({ number: n, question: a + ' × ' + b + ' = '});
                        usedNumbers.push(n);
                        break;

                    } else {

                        n++;
                        for (let i = b + 2; i >= 1; i--) {
                            if (n % i == 0) {
                                a = i;
                                b = Math.floor(n / a);
                                break;
                            }
                        }
                    }
                }

                break;
            }

            // Division
            case 3: {
                if (questionParams.questionTypes[3] == 0) {
                    break;
                }

                let a = Math.floor(questionParams.division.min + Math.random() * (questionParams.division.max - questionParams.division.min));
                let n = Math.floor(questionParams.division.min + Math.random() * (questionParams.division.max - questionParams.division.min));

                let b = a * n;

                while (true) {                    
                    if (!usedNumbers.includes(n)) {
                        numbers.push({ number: n, question: b + ' ÷ ' + a + ' = '});
                        usedNumbers.push(n);
                        break;
                    } else {
                        n++;
                        b = a * n;
                    }
                }

                break;
            }
        }

        type = ++type == 4 ? 0 : type;
    }

    return numbers;
}

function drawQuestions() {
    let n = generateQuestions();

    //An array with all the indexes in the color array of colors used in the image.
    let activeColors = [];
    //An array of all the numbers for each color.
    let colorNumbers = new Array(colors.length);

    for (let i = 0; i < colors.length; i++) {
        //Returns true when number of pixels of a certain color is greater than zero. Hence, that color is 
        //used and should be added to list.
        if (colors[i]) {
            activeColors.push(i);
        }
    }

    let shared = Math.floor(n.length / activeColors.length);
    if (shared < 1) {
        alert('Question count is too low');
        return;
    }
    for (let i = 0; i < activeColors.length; i++) {
        colorNumbers[activeColors[i]] = n.splice(0, shared);
    }

    activeColors = get_random(activeColors, activeColors.length);

    let remaining = n.length;

    for (let i = 0; i < remaining; i++) {
        colorNumbers[activeColors[i]].push(...n.splice(0, 1));
    }

    //DRAW QUESTION GRID
    let canvas = document.getElementById('generate-question-canvas');
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let drawPos = 20;
    let colorStartPos = 20;
    canvas.height = 20;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < activeColors.length; i++) {
        let numbers = colorNumbers[activeColors[i]];

        colorStartPos = drawPos;
        drawPos += 70;

        //Resize
        let originalCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.height += 70 + Math.ceil(numbers.length / 2) * 70;

        ctx = canvas.getContext('2d');

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.putImageData(originalCanvas, 0, 0);
        ctx.fillStyle = "black";
        ctx.textBaseline = 'top';
        ctx.font = 'normal 30px Sans-Serif';

        for (let j = 0; j < numbers.length; j++) {
            if (j % 2 == 0) {
                ctx.fillText(numbers[j].question, 50, drawPos);
            } else {
                ctx.fillText(numbers[j].question, 250, drawPos);
                if (j < (numbers.length - 1)) drawPos += 70;
            }
        }

        ctx.font = 'normal 40px Sans-Serif';
        ctx.fillText(colorNames[activeColors[i]], 50, colorStartPos);

        drawPos += 50;

        ctx.beginPath();
        ctx.moveTo(20, colorStartPos);
        ctx.lineTo(20, drawPos);
        ctx.lineTo(canvas.width - 20, drawPos);
        ctx.lineTo(canvas.width - 20, colorStartPos);
        ctx.lineTo(70 + ctx.measureText(colorNames[activeColors[i]]).width, colorStartPos);
        ctx.stroke();

        if (questionParams.drawSwatches) {
            ctx.fillStyle = colorElements[activeColors[i]].style.backgroundColor;
            ctx.fillRect(canvas.width - 65, colorStartPos + 5, 40, 40);
        }

        drawPos += 20;
    }

    return { colorNumbers: colorNumbers, activeColors: activeColors };
}

function generateGrid(colorNumbers, activeColors, blockSize = 3) {
    let pixelNumbers = new Array(pixels.length);

    if (blockSize == 1) {
        for (let i = 0; i < pixels.length; i++) {
            const numbers = colorNumbers[pixels[i].color];
            pixelNumbers[i] = numbers[Math.floor(Math.random() * numbers.length)].number;
        }

        drawGrid(pixelNumbers);

    } else {
        const sections = getImageSections(blockSize);
        let sections_to_draw = new Array(0);

        //Loop through each color
        for (let i = 0; i < activeColors.length; i++) {
            const c = activeColors[i];

            let numbers = colorNumbers[activeColors[i]];

            //Loop through each block of the color (represented by a section)
            for (let j = 0; j < sections[c].length; j++) {
                let n = j in numbers ? numbers[j] : numbers[Math.floor(Math.random() * numbers.length)];

                sections_to_draw.push({ section: sections[c][j], number: n.number });
            }
        }

        drawSections(sections_to_draw)
    }
}

function drawGrid(pixelNumbers) {
    let canvas = document.getElementById('generate-grid-canvas');

    const cellWidth = 120;
    const gridHeight = cellWidth * dimensions.r;
    const gridWidth = cellWidth * dimensions.c;

    canvas.width = gridWidth;
    canvas.height = gridHeight;

    let ctx = canvas.getContext('2d');

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'lighter ' + cellWidth * 0.4 + 'px Sans-Serif';
    ctx.fillStyle = '#222222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < dimensions.r; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellWidth);
        ctx.lineTo(gridWidth, i * cellWidth);
        ctx.stroke();

        //TODO: I think there's a mistake here... I think there should be two for loops, not one nested.
        for (let j = 0; j < dimensions.c; j++) {
            if (i == 0) {
                ctx.beginPath();
                ctx.moveTo(j * cellWidth, 0);
                ctx.lineTo(j * cellWidth, gridHeight);
                ctx.stroke();
            }

            ctx.fillText(pixelNumbers[(i * dimensions.c) + j], cellWidth * (j + 0.5), cellWidth * (i + 0.5));
        }
    }

    ctx.beginPath();
    ctx.moveTo(dimensions.c * cellWidth, 0);
    ctx.lineTo(dimensions.c * cellWidth, gridHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, dimensions.r * cellWidth);
    ctx.lineTo(gridWidth, dimensions.r * cellWidth);
    ctx.stroke();
}

function drawSections(sections) {
    let canvas = document.getElementById('generate-grid-canvas');

    const cellWidth = 120;
    const gridHeight = cellWidth * dimensions.r;
    const gridWidth = cellWidth * dimensions.c;

    canvas.width = gridWidth;
    canvas.height = gridHeight;

    let ctx = canvas.getContext('2d');

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'lighter ' + cellWidth * 0.4 + 'px Sans-Serif';
    ctx.fillStyle = '#222222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i].section;
        
        for (let j = 0; j < section.size; j++) {
            const pixel = section.pixels[j];
            const pixel_c = pixel % dimensions.c;
            const pixel_r = Math.floor(pixel / dimensions.c);

            // console.log(pixel_c, pixel_r);

            if (j == 0) {
                ctx.fillText(sections[i].number, cellWidth * (pixel_c + 0.5), cellWidth * (pixel_r + 0.5));
                // console.log('first pixel')
            }
            
            //Check if there is no other pixel in the same section...
            //...above
            if (!section.pixels.includes(pixel - dimensions.c)) {
                ctx.beginPath();
                ctx.moveTo(pixel_c * cellWidth, pixel_r * cellWidth);
                ctx.lineTo((pixel_c + 1) * cellWidth, pixel_r * cellWidth);
                ctx.stroke();
            }

            //...below
            if (!section.pixels.includes(pixel + dimensions.c)) {
                ctx.beginPath();
                ctx.moveTo(pixel_c * cellWidth, (pixel_r + 1) * cellWidth);
                ctx.lineTo((pixel_c + 1) * cellWidth, (pixel_r + 1) * cellWidth);
                ctx.stroke();
            }

            //...to left
            if (pixel_c != 0 && !section.pixels.includes(pixel - 1)) {
                ctx.beginPath();
                ctx.moveTo(pixel_c * cellWidth, pixel_r * cellWidth);
                ctx.lineTo(pixel_c * cellWidth, (pixel_r + 1) * cellWidth);
                ctx.stroke();
            }

            //...to right
            if (pixel_c != dimensions.c - 1 &&!section.pixels.includes(pixel + 1)) {
                ctx.beginPath();
                ctx.moveTo((pixel_c + 1) * cellWidth, pixel_r * cellWidth);
                ctx.lineTo((pixel_c + 1) * cellWidth, (pixel_r + 1) * cellWidth);
                ctx.stroke();
            }
        }
    }
}

//#endregion

//#region Helpers

/* Colors */
function rgbToHex(r, g, b) {
    //https://stackoverflow.com/questions/6367010/average-2-hex-colors-together-in-javascript/65552876#65552876
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        [parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)]
        : null;
}

function rgbToHue(r, g, b) {
    let min = Math.min(Math.min(r, g), b);
    let max = Math.max(Math.max(r, g), b);

    //max == min for hue to be 0 but this is a better approximation for slightly imperfect colors.
    if (max - min < 50) {
        return 0;
    }

    let hue = 0.0;
    if (max == r) {
        hue = (g - b) / (max - min);

    } else if (max == g) {
        hue = 2 + (b - r) / (max - min);

    } else {
        hue = 4 + (r - g) / (max - min);
    }

    if (hue < 0) hue += 6;
    return hue;
}

//https://stackoverflow.com/a/13807455
function rgbToHSV(r, g, b) {
    var h, s, v;
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);

    v = max;
    delta = max - min;
    if (max != 0)
        s = delta / max;        // s
    else {
        // r = g = b = 0        // s = 0, v is undefined
        s = 0;
        h = -1;
        return [h, s, undefined];
    }

    if (r === max)
        h = (g - b) / delta;      // between yellow & magenta
    else if (g === max)
        h = 2 + (b - r) / delta;  // between cyan & yellow
    else
        h = 4 + (r - g) / delta;  // between magenta & cyan
    h *= 60;                // degrees
    if (h < 0)
        h += 360;
    if (isNaN(h))
        h = 0;
    return [h, s, v];
}

function hsvToRGB(h, s, v) {
    var i;
    var r, g, b;

    if (s === 0) {
        // achromatic (grey)
        r = g = b = v;
        return [Math.round(r), Math.round(g), Math.round(b)];
    }
    h /= 60;            // sector 0 to 5
    i = Math.floor(h);
    f = h - i;          // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));
    switch (i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        default:        // case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    return [Math.round(r), Math.round(g), Math.round(b)];
}

/* Misc. */
//Returns an array of n elements from arr using a Fischer-Yates shuffle.
function get_random(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);

    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

//Returns an array of n elements from arr using a Fischer-Yates shuffle, removing those elements from the orignal array.
function get_random_destructive(arr, n) {
    var result = new Array(n),
        len = arr.length;

    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n) {
        let x = Math.floor(Math.random() * len--);
        result[--n] = arr[x];
        arr.splice(x, 1);
    }
    return result;
}

function mod(n, m) {
    return ((n % m) + m) % m;
}
//#endregion

