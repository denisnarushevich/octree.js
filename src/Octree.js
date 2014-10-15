define(["./Octree/Node", "./Octree/Item"], function (Node, Item) {

        /**
         * @param {number} min Root bounding box min XYZ value.
         * @param {number} max Root bounding box max XYZ value.
         * @param {int} maxDepth
         * @param {int} treshold
         * @param {int} tearDrop
         * @constructor
         */
        function Octree(maxDepth, treshold, tearDrop) {
            this.maxDepth = maxDepth || 8;
            this.treshold = treshold || 32;
            this.tearDrop = tearDrop || 1;
            this.items = [];
            this.lastItemId = 0;
        }

        Octree.Item = Item;
        Octree.Node = Node;

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

        p.lastItemId = 0;
        p.items = null;


        /**
         * Inserts bounding box into octree.
         * @param {BoundingBox} item
         * @returns {*}
         */
        p.insert = function (item) {
            if (item.id === null) {
                item.id = this.lastItemId++;
                this.items[item.id] = item;
            }

            if (this.root === null) {
                //var root = this.root = Node.create(this);
                var root = this.root = new Node(this);
                root.x = item.x;
                root.y = item.y;
                root.z = item.z;
                root.ex = item.ex + 1;
                root.ey = item.ey + 1;
                root.ez = item.ez + 1;
            } else {
                var root = this.root;
            }

            if ((item.x - item.ex) >= (root.x - root.ex) &&
                (item.x + item.ex) <= (root.x + root.ex) &&
                (item.y - item.ey) >= (root.y - root.ey) &&
                (item.y + item.ey) <= (root.y + root.ey) &&
                (item.z - item.ez) >= (root.z - root.ez) &&
                (item.z + item.ez) <= (root.z + root.ez)) {
                Node.insert(this, this.root, item);
            } else {
                var dx = this.root.x - item.x,
                    dy = this.root.y - item.y,
                    dz = this.root.z - item.z;
                this.grow(dx, dy, dz);
                this.insert(item);
            }

        }

        /**
         * Remove bounding box from octree
         * @param {BoundingBox} item
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
                var r = Node.remove(this, this.root, item);
                if (r === true) {
                    this.shrink()
                }

                if (this.root.count === 0)
                    this.root = null;

                return r;
            }

            return false;
        }

        /**
         * Returns array of bounding boxes, that lies near given bounding box.
         * @param {BoundingBox} item
         * @param Array out Array that will be filled with result items
         * @returns {BoundingBox[]}
         */
        p.retrieve = function (item, out) {
            out = out || [];

            if (this.root !== null) {
                Node.retrieve(this.root, item, out);
                var l = out.length,
                    items = this.items;

                for (var i = 0, j = 0; i < l; i++) {
                    var item = items[out[i]];

                    if (item.flag & 1) { //if item is not flagged then it's a duplicate and the item is in array already.
                        item.flag = 0;
                        out[j++] = item;
                    }

                }

                //now, remove all garbage(duplicate indexes in the tail of array) from array
                out.splice(j, i - j);

            }
            return out;
        }

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

            this.root = Node.grow(this, this.root, index);
        }

        p.shrink = function () {
            var newRoot = Node.shrink(this, this.root);
            if (newRoot !== false)
                this.root = newRoot;
        }


        return Octree;
    }
);
