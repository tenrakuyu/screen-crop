// 用于插入的元素
// img元素放原图
// frames元素放蒙层/截取框
// button是提交按钮
var tmp = $('<div class="resizer">' +
    '<div class="inner">' +
    '<img>' +
    '<div class="frames"></div>' +
    '</div>' +
    '<button class="ok">&#10003;</button>' +
    '</div>');


$.imageResizer = function () {
    // 检查浏览器支持
    if (Uint8Array && HTMLCanvasElement && atob && Blob) {

    } else {
        return false;
    }

    // 取插入元素
    var resizer = tmp.clone();

    resizer.image = resizer.find('img')[0];
    resizer.frames = resizer.find('.frames');
    resizer.okButton = resizer.find('button.ok');
    resizer.frames.offset = {
        top: 0,
        left: 0
    };

    // 注册click事件
    resizer.okButton.click(function () {
        resizer.clipImage();
    });
    // 这里其实我可以不关心
    resizer.clipImage = function () {
        console.log("resizer.clipImage called");
        var nh = this.image.naturalHeight,
            nw = this.image.naturalWidth,
            size = nw > nh ? nh : nw;// 取宽高小的那一边

        size = size > 1000 ? 1000 : size;// size最大是1000

        // canvas是截取后的图片填放的元素
        var canvas = $('<canvas width="' + size + '" height="' + size + '"></canvas>')[0],
            ctx = canvas.getContext('2d'),
            scale = nw / this.offset.width,
            x = this.frames.offset.left * scale,
            y = this.frames.offset.top * scale,
            w = this.frames.offset.size * scale,
            h = this.frames.offset.size * scale;

        ctx.drawImage(this.image, x, y, w, h, 0, 0, size, size);
        var src = canvas.toDataURL();
        this.canvas = canvas;
        this.append(canvas);
        // 修改class，用于套用不同style
        this.addClass('uploading');
        this.removeClass('have-img');

        src = src.split(',')[1];
        if (!src) return this.doneCallback(null);
        src = window.atob(src);// base64转码

        var ia = new Uint8Array(src.length);
        for (var i = 0; i < src.length; i++) {
            ia[i] = src.charCodeAt(i);
        }


        this.doneCallback(new Blob([ia], {type: "image/png"}));
    };

    // 定义一系列方法
    resizer.resize = function (file, done) {
        console.log("resizer.resize called");
        this.reset();
        this.doneCallback = done;
        this.setFrameSize(0);
        this.frames.css({
            top: 0,
            left: 0
        });
        var reader = new FileReader();
        reader.onload = function () {
            resizer.image.src = reader.result;
            reader = null;
            resizer.addClass('have-img');
            resizer.setFrames();
        };
        reader.readAsDataURL(file);
    };

    resizer.reset = function () {
        console.log("resizer.reset called");
        this.image.src = '';
        this.removeClass('have-img');
        this.removeClass('uploading');
        this.find('canvas').detach();
    };

    resizer.setFrameSize = function (size) {
        console.log("resizer.setFrameSize called");
        this.frames.offset.size = size;
        return this.frames.css({
            width: size + 'px',
            height: size + 'px'
        });
    };

    resizer.getDefaultSize = function () {
        console.log("resizer.getDefaultSize called");
        var width = this.find(".inner").width(),
            height = this.find(".inner").height();
        this.offset = {
            width: width,
            height: height
        };
        // console.log(this.offset);
        return width > height ? height : width;
    };

    // 移动蒙层
    resizer.moveFrames = function (offset) {
        console.log("resizer.moveFrames called");
        var x = offset.x,
            y = offset.y,
            top = this.frames.offset.top,
            left = this.frames.offset.left,
            size = this.frames.offset.size,
            width = this.offset.width,
            height = this.offset.height;

        if (x + size + left > width) {
            x = width - size;
        } else {
            x = x + left;
        }


        if (y + size + top > height) {
            y = height - size;
        } else {
            y = y + top;
        }

        x = x < 0 ? 0 : x;
        y = y < 0 ? 0 : y;
        this.frames.css({
            top: y + 'px',
            left: x + 'px'
        });

        this.frames.offset.top = y;
        this.frames.offset.left = x;
    };
    (function () {
        console.log("ano func1 called");
        var time;

        function setFrames() {
            console.log("setFrames called");
            var size = resizer.getDefaultSize();
            resizer.setFrameSize(size);
        }

        // 不知道为什么作者要注册这个事件，回头放到图片上传事件里去
        window.onresize = function () {
            console.log("window.onresize called");
            clearTimeout(time);
            time = setTimeout(function () {
                setFrames();
            }, 1000);
        };

        resizer.setFrames = setFrames;
    })();

    (function () {
        console.log("ano func2 called");
        var lastPoint = null;

        function getOffset(event) {
            console.log("getOffset called");
            event = event.originalEvent;
            var x, y;
            if (event.touches) {
                var touch = event.touches[0];
                x = touch.clientX;
                y = touch.clientY;
            } else {
                x = event.clientX;
                y = event.clientY;
            }

            if (!lastPoint) {
                lastPoint = {
                    x: x,
                    y: y
                };
            }


            var offset = {
                x: x - lastPoint.x,
                y: y - lastPoint.y
            };
            lastPoint = {
                x: x,
                y: y
            };
            return offset;
        }

        resizer.frames.on('mousedown', function (event) {
            getOffset(event);
        });
        resizer.frames.on('mousemove', function (event) {
            if (!lastPoint) return;
            var offset = getOffset(event);
            resizer.moveFrames(offset);
        });
        resizer.frames.on('mouseup', function (event) {
            lastPoint = null;
        });
    })();
    return resizer;
};
var resizer = $.imageResizer(), resizedImage;

if (!resizer) {
    resizer = $("<p>Your browser doesn't support these feature:</p><ul><li>canvas</li><li>Blob</li><li>Uint8Array</li><li>FormData</li><li>atob</li></ul>")
}


$('.container').append(resizer);

$('input').change(function (event) {
    var file = this.files[0];
    resizer.resize(file, function (file) {
        resizedImage = file;
    });
});

$('button.submit').click(function () {
    var url = $('input.url').val();
    if (!url || !resizedImage) return;
    var fd = new FormData();
    fd.append('file', resizedImage);
    $.ajax({
        type: 'POST',
        url: url,
        data: fd
    });
});