// Modified from sprite.js in Lab 4. Everything related to shadows removed. All comments removed.
// Now replaced by the Sprite class in classes.js.
/*
const Sprite = function(ctx, x, y) {
	const sheet = new Image();
    let sequence = { x: 0, y: 0, width: 20, height: 20, count: 1, timing: 0, loop: false };
    let index = 0, scale = 1, lastUpdate = 0;
    const useSheet = function(spriteSheet) {
        sheet.src = spriteSheet;
        return this;
    };
    const isReady = function() {
        return sheet.complete && sheet.naturalHeight != 0;
    };
    const getXY = function() {
        return {x, y};
    };
    const setXY = function(xvalue, yvalue) {
        [x, y] = [xvalue, yvalue];
        return this;
    };
    const setSequence = function(newSequence) {
        sequence = newSequence;
        index = 0;
        lastUpdate = 0;
        return this;
    };
    const setScale = function(value) {
        scale = value;
        return this;
    };
    const getDisplaySize = function() {
        const scaledWidth  = sequence.width * scale;
        const scaledHeight = sequence.height * scale;
        return {width: scaledWidth, height: scaledHeight};
    };
    const getBoundingBox = function() {
        const size = getDisplaySize();
        const top = y - size.height / 2;
        const left = x - size.width / 2;
        const bottom = y + size.height / 2;
        const right = x + size.width / 2;
        return BoundingBox(ctx, top, left, bottom, right);
    };
    const drawSprite = function() {
        ctx.save();
        const size = getDisplaySize();
		ctx.clearRect(parseInt(x - size.width * 0.5), parseInt(y - size.height * 0.5), size.width, size.height);
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(sheet, sequence.x + index * sequence.width, sequence.y, sequence.width, sequence.height, parseInt(x - size.width * 0.5), parseInt(y - size.height * 0.5), size.width, size.height);
        ctx.restore();
    };
    const draw = function() {
        if (isReady()) {
            drawSprite();
        }
        return this;
    };
    const update = function(time) {
        if (lastUpdate == 0) lastUpdate = time;
		if (time - lastUpdate >= sequence.timing) {
			index = sequence.loop ? (index + 1) % sequence.count : Math.min(index + 1, sequence.count - 1);
			lastUpdate = 0;
		}
        return this;
    };
    return {
        useSheet: useSheet,
        getXY: getXY,
        setXY: setXY,
        setSequence: setSequence,
        setScale: setScale,
        getDisplaySize: getDisplaySize,
        getBoundingBox: getBoundingBox,
        isReady: isReady,
        draw: draw,
        update: update
    };
};
*/
