define(function () {
    function Item(x, y, z, ex, ey, ez) {
        if (arguments.length === 3) {
            this.type = Item.POINT;
            this.x = x;
            this.y = y;
            this.z = z;
        } else {
            this.type = Item.AABB;
            this.x = x;
            this.y = y;
            this.z = z;
            this.ex = ex;
            this.ey = ey;
            this.ez = ez;
        }


        //this is neccesary to set on objects creation,
        //otherwise it will be set on retrieve and memory allocation will slow things down.
        //is used to avoid duplicates in retrieve results
        this.flag = 0;
        this.id = null;
    }

    Item.POINT = 0;
    Item.AABB = 1;

    var p = Item.prototype;

    p.id = null;
    p.type = null;
    p.flag = 0;

    p.x = 0;
    p.y = 0;
    p.z = 0;

    p.ex = 0;
    p.ey = 0;
    p.ez = 0;

    return Item;
});