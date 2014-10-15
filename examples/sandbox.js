require(["../src/Octree"], function (Octree) {

    q = new Octree(4, 4);
    var cnv = document.getElementById("canvas");
    var ctx = cnv.getContext("2d");

    var items = [];

    cnv.width = window.innerWidth;
    cnv.height = window.innerHeight;

    function DrawNode(node) {
        ctx.fillStyle = "black";
        ctx.strokeRect(node.x - node.ex, node.y - node.ey, node.ex * 2, node.ey * 2);

        if (node.type === 0) {
            var items = node.items,
                itemsLen, item, j;

            for (j = 0, itemsLen = items.length; j < itemsLen; j++) {
                item = items[j];
                ctx.fillStyle = item.color;
                ctx.fillRect(item.x - item.ex, item.y - item.ey, item.ex * 2, item.ey * 2);
            }
        } else {
            var mask = node.nodesMask,
                indexToKey = Octree.Node.indexToKey,
                i;

            for (i = 0; i < 8; i++)
                if (mask & (1 << i))
                    DrawNode(node[indexToKey[i]]);
        }
    }

    document.oncontextmenu = function () {
        return false
    };

    document.onmouseup = function update(e) {
        var x = e.pageX,
            y = e.pageY;

        if (e.which === 1) {
            console.log("left click");

             //find and retrieve
            for(var i = 0; i < items.length; i++){
                var item = items[i];

                if(Math.abs(x - item.x) < item.ex && Math.abs(y - item.y) < item.ey){
                    var near = q.retrieve(item);
                    for(var k = 0; k < items.length; k++){
                        items[k].color = "blue";
                    }
                    for(var j = 0; j < near.length; j++){
                        var nearItem = near[j];
                        nearItem.color = "red";
                    }

                    return;
                }
            }


            //insert new node
            var item = new Octree.Item(x, y, 0, 8, 8, 0);
            items.push(item);
            q.insert(item);
        }

        if(e.which === 3){
            console.log("right click");

            for(var i = 0; i < items.length; i++){
                var item = items[i];

                if(Math.abs(x - item.x) < item.ex && Math.abs(y - item.y) < item.ey){
                    q.remove(item);
                    items.splice(i,1);
                    break;
                }
            }
        }
    }

    function tick() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (q.root !== null)
            DrawNode(q.root);
    }

    function loop() {
        tick();
        window.requestAnimationFrame(function () {
            loop();
        });
    }

    loop();
})
