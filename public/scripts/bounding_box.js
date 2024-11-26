// Modified from bounding_box.js in Lab 4. randomPoint function removed.

const BoundingBox = function(ctx, top, left, bottom, right) {
    const path = new Path2D();
    path.rect(left, top, right - left, bottom - top);
    const getTop = function() { return top; };
    const getLeft = function() { return left; };
    const getBottom = function() { return bottom; };
    const getRight = function() { return right; };
    const getPoints = function() {
        return {
            topLeft: [left, top],
            topRight: [right, top],
            bottomLeft: [left, bottom],
            bottomRight: [right, bottom]
        };
    };
    const isPointInBox = function(x, y) {
        return ctx.isPointInPath(path, x, y);
    };
    const intersect = function(box) {
        let points = box.getPoints();
        for (const key in points) {
            if (isPointInBox(...points[key]))
                return true;
        }
        points = getPoints();
        for (const key in points) {
            if (box.isPointInBox(...points[key]))
                return true;
        }
        return false;
    };
	return {
        getTop: getTop,
        getLeft: getLeft,
        getBottom: getBottom,
        getRight: getRight,
        getPoints: getPoints,
        isPointInBox: isPointInBox,
        intersect: intersect,
    };
};
