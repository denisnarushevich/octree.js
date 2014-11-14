var Node = require("./node", "./item");

/**
 * @param {int} maxDepth
 * @param {int} threshold
 * @param {int} tearDrop
 * @constructor
 */
function Octree(maxDepth, threshold, tearDrop) {
    this.maxDepth = maxDepth || 8;
    this.treshold = threshold || 32;
    this.tearDrop = tearDrop || 1;
}

var p = Octree.prototype;

/**
 * Limit when node should subdivide
 * @type {int}
 */
p.treshold = null;

/**
 * @type {int}
 */
p.maxDepth = null;

/**
 * Minimal size of node bounds
 * @type {number}
 */
p.tearDrop = 0;

/**
 * Root node of tree
 * @type {Node}
 */
p.root = null;

/**
 * Inserts bounding box into octree.
 * @param {Item} item
 * @returns {*}
 */
p.insert = function (item) {
    var root = this.root;

    //setup tree's root node
    if (root === null) {
        root = this.root = new Node(this);
        root.x = item.x;
        root.y = item.y;
        root.z = item.z;
        root.ex = item.ex + 1;
        root.ey = item.ey + 1;
        root.ez = item.ez + 1;
    }

    //insert item in a subnode, if item is outside of tree's root node,
    //then tree should expand
    if ((item.x - item.ex) >= (root.x - root.ex) &&
        (item.x + item.ex) <= (root.x + root.ex) &&
        (item.y - item.ey) >= (root.y - root.ey) &&
        (item.y + item.ey) <= (root.y + root.ey) &&
        (item.z - item.ez) >= (root.z - root.ez) &&
        (item.z + item.ez) <= (root.z + root.ez)) {
        root.insert(item);
    } else {
        var dx = root.x - item.x,
            dy = root.y - item.y,
            dz = root.z - item.z;
        this.grow(dx, dy, dz);
        this.insert(item);
    }
};

/**
 * Remove bounding box from octree
 * @param {Item} item
 * @returns {boolean} True on success, else false.
 */
p.remove = function (item) {
    var root = this.root;

    if ((item.x - item.ex) >= (root.x - root.ex) &&
        (item.x + item.ex) <= (root.x + root.ex) &&
        (item.y - item.ey) >= (root.y - root.ey) &&
        (item.y + item.ey) <= (root.y + root.ey) &&
        (item.z - item.ez) >= (root.z - root.ez) &&
        (item.z + item.ez) <= (root.z + root.ez)) {
        var r = root.remove(item);
        if (r === true) {
            this.shrink()
        }

        if (root.count === 0)
            this.root = null;

        return r;
    }

    return false;
};

/**
 * Returns array of bounding boxes, that lies near given bounding box.
 * @param {Item} item
 * @param {Array} out Array that will be filled with result items
 * @returns {Item[]}
 */
p.retrieve = function (item, out) {
    out = out || [];

    if (this.root !== null) {
        this.root.retrieve(item, out);
        var l = out.length;

        for (var i = 0, j = 0; i < l; i++) {
            var item = out[i];

            if (item.flag & 1) { //if item is not flagged then it's a duplicate and the item is in array already.
                item.flag = 0;
                out[j++] = item;
            }

        }

        //now, remove all garbage(duplicate indexes in the tail of array) from array
        out.splice(j, i - j);

    }
    return out;
};

p.grow = function (x, y, z) {
    if (x >= 0)
        x = 1;
    else
        x = 0;

    if (y >= 0)
        y = 1;
    else
        y = 0;

    if (z >= 0)
        z = 1;
    else
        z = 0;

    var index = (z << 2) + (y << 1) + x;

    this.root = this.root.grow(index);
};

p.shrink = function () {
    var newRoot = this.root.shrink();
    if (newRoot !== false)
        this.root = newRoot;
};


module.exports = Octree;
