require(["../src/Octree"], function (Octree) {


    q = new Octree()
    var cnv = document.getElementById("canvas");
    var ctx = cnv.getContext("2d");
    cnv.width = window.innerWidth;
    cnv.height = window.innerHeight;
    var items = [];

    function DrawNode(node) {

        ctx.strokeRect(window.innerWidth / 2 + node.x - node.ex, window.innerHeight / 2 + node.y - node.ey, node.ex * 2, node.ey * 2);

        if (node.type === 1) {
            var nodesMask = node.nodesMask,
                keys = Octree.Node.indexToKey, i;

            for (i = 0; i < 8; i++)
                if (nodesMask & (1 << i))
                    DrawNode(node[keys[i]]);

        } else {
            ctx.fillStyle = "black";
            var items = node.items,
                itemsLen, item, j;

            for (j = 0, itemsLen = items.length; j < itemsLen; j++) {
                item = items[j];
                ctx.fillRect(window.innerWidth / 2 + item.x - item.ex, window.innerHeight / 2 + item.y - item.ey, item.ex * 2, item.ey * 2);
            }
        }
    }

    function generateItem(w) {
        var item = new Octree.Item(Math.random() * window.innerWidth / 2 - window.innerWidth / 4, Math.random() * window.innerHeight / 2 - window.innerHeight / 4, 0, w, w, w);
        item.dir = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1];
        return item;
    }

    function fill() {
        for (var i = 0; i < 2000; i++) {
            var item = generateItem(2);
            items.push(item);
            q.insert(item);
        }
    }

    function updatePoints() {
        var itemsLen = items.length,
            item, dir;

        for (var i = 0; i < itemsLen; i++) {
            item = items[i];
            dir = item.dir;

            q.remove(item);

            item.x += dir[0];
            item.y += dir[1];

            q.insert(item);
        }
    }

    function tick() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        updatePoints();
        if (q.root !== null)
            DrawNode(q.root);
    }

    var t = Date.now();

    function loop() {
        tick();
        window.requestAnimationFrame(function () {
            loop();
        });
    }

    fill();
    loop();
})
