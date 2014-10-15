require(["../src/Octree"], function (Octree) {
    var profiles = false;

    function insertTest(){
        var tree = new Octree(),
            items = [];

        for (var i = 0; i < 50000; i++) {
            items.push(new Octree.Item(Math.random() * 1000, Math.random() * 1000, Math.random() * 1000, 4, 4, 4));
        }

        var t0 = Date.now();

        for(var i = 0; i < 50000; i++){
            tree.insert(items.pop());
        }

        return Date.now() - t0;
    }

    function retrieveTest(){
        var tree = new Octree(),
            items = [];

        for (var i = 0; i < 50000; i++) {
            var item = new Octree.Item(Math.random() * 1000, Math.random() * 1000, Math.random() * 1000, 4, 4, 4);
            items.push(item);
            tree.insert(item);
        }

        var t0 = Date.now();

        for(var j = 0; j < 50000; j++){
            tree.retrieve(items[j]);
        }

        return Date.now() - t0;
    }

    function removeTest(){
        var tree = new Octree(),
            items = [];

        for (var i = 0; i < 50000; i++) {
            var item = new Octree.Item(Math.random() * 1000, Math.random() * 1000, Math.random() * 1000, 4, 4, 4);
            items.push(item);
            tree.insert(item);
        }

        var t0 = Date.now();

        for(var j = 0; j < 50000; j++){
            tree.remove(items[j]);
        }

        return Date.now() - t0;
    }



    document.getElementById("insertButton").addEventListener("click", function () {
        if(profiles)
            console.profile("Insert");

        var ms = 0;
        for(var i = 0; i < 20; i++){
            ms += insertTest();
        }
        ms = Math.round(ms/20);

        if(profiles)
            console.profileEnd();

        this.innerHTML = ms.toString() + "ms";
        return false;
    });

    document.getElementById("retrieveButton").addEventListener("click", function () {
        if(profiles)
            console.profile("Retrieve");

        var ms = 0;
        for(var i = 0; i < 20; i++){
            ms += retrieveTest();
        }
        ms = Math.round(ms/20);

        if(profiles)
            console.profileEnd();

        this.innerHTML = ms.toString() + "ms";
        return false;
    });

    document.getElementById("cleanButton").addEventListener("click", function () {
        if(profiles)
            console.profile("Remove");

        var ms = 0;
        for(var i = 0; i < 20; i++){
            ms += removeTest();
        }
        ms = Math.round(ms/20);

        if(profiles)
            console.profileEnd();

        this.innerHTML = ms.toString() + "ms";
        return false;
    });
})
