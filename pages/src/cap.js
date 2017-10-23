var postFile = {
        init: function () {
            var t = this;
            t.regional = document.getElementById('label');
            t.getImage = document.getElementById('get_image');
            t.editPic = document.getElementById('edit_pic');
            t.editBox = document.getElementById('cover_box');
            t.px = 0;    //background image x
            t.py = 0;    //background image y
            t.sx = 0;    //crop area x 截取框在图片内的位置
            t.sy = 0;    //crop area y 截取框在图片内的位置
            t.sHeight = 150;    //crop area height
            t.sWidth = 150;    //crop area width
            document.getElementById('post_file').addEventListener("change", t.handleFiles, false);
        },

        handleFiles: function () {
            var fileList = this.files[0];
            console.log(this.files);
            var oFReader = new FileReader();
            oFReader.readAsDataURL(fileList);
            oFReader.onload = function (oFREvent) {
                // https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader
                console.log(oFREvent);

                // oFREvent.target.result为上传图片地址，我应该用不到
                postFile.paintImage(oFREvent.target.result);
            };
        },

        paintImage: function (url) {
            var t = this;
            var createCanvas = t.getImage.getContext("2d");
            var img = new Image();
            // console.log(img);
            img.src = url;
            img.onload = function () {

                // 等比例绘制处理
                if (img.width < t.regional.offsetWidth && img.height < t.regional.offsetHeight) {
                    t.imgWidth = img.width;
                    t.imgHeight = img.height;

                } else {
                    var pWidth = img.width / (img.height / t.regional.offsetHeight);
                    var pHeight = img.height / (img.width / t.regional.offsetWidth);
                    t.imgWidth = img.width > img.height ? t.regional.offsetWidth : pWidth;
                    t.imgHeight = img.height > img.width ? t.regional.offsetHeight : pHeight;
                }
                t.px = (t.regional.offsetWidth - t.imgWidth) / 2 + 'px';
                t.py = (t.regional.offsetHeight - t.imgHeight) / 2 + 'px';

                t.getImage.height = t.imgHeight;
                t.getImage.width = t.imgWidth;
                t.getImage.style.left = t.px;
                t.getImage.style.top = t.py;

                // https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage
                createCanvas.drawImage(img, 0, 0, t.imgWidth, t.imgHeight);
                t.imgUrl = t.getImage.toDataURL();
                t.cutImage();
                t.dragAndResize();
            };
        },

        cutImage: function () {
            var t = this;

            //绘制遮罩层：
            t.editBox.height = t.imgHeight;
            t.editBox.width = t.imgWidth;
            t.editBox.style.display = 'block';
            t.editBox.style.left = t.px;
            t.editBox.style.top = t.py;

            var cover = t.editBox.getContext("2d");
            cover.fillStyle = "rgba(0, 0, 0, 0.5)";
            cover.fillRect(0, 0, t.imgWidth, t.imgHeight);
            cover.clearRect(t.sx, t.sy, t.sWidth, t.sHeight);
        },

        dragAndResize: function () {
            var t = this;
            var draging = false;
            var resizing = false;
            var resizingX = false;
            var resizingY = false;
            var startX = 0;
            var startY = 0;


            document.getElementById('cover_box').onmousemove = function (e) {

                // e.pageX鼠标到浏览器左边缘的距离
                // t.regional.offsetLeft外框到浏览器左边缘的距离
                // this.offsetLeft图片到外框左边缘的距离
                // e.pageY鼠标到浏览器上边缘的距离
                // t.regional.offsetTop外框到浏览器上边缘的距离
                // this.offsetTop图片到外框上边缘的距离
                // 计算鼠标在图片内的位置
                var pageX = e.pageX - ( t.regional.offsetLeft + this.offsetLeft );
                var pageY = e.pageY - ( t.regional.offsetTop + this.offsetTop );


                // 斜拉
                if (resizing || Math.abs(pageX - (t.sx + t.sWidth)) <= 2 && Math.abs(pageY - (t.sy + t.sHeight)) <= 2) {
                    this.style.cursor = 'se-resize';

                    this.onmousedown = function () {
                        resizing = true;
                        startX = e.pageX - ( t.regional.offsetLeft + this.offsetLeft );
                        startY = e.pageY - ( t.regional.offsetTop + this.offsetTop );
                    };
                    window.onmouseup = function () {
                        resizing = false;
                    };
                    if (resizing) {
                        console.log("resize");
                        if (pageX - t.sx <= 10) {
                            // 移动到图片左边缘外边
                            t.sWidth = 10;
                        } else if (pageX >= t.imgWidth) {
                            // 移动到右边缘外边
                            t.sWidth = t.imgWidth - t.sx;
                        } else {
                            // 改变宽度
                            t.sWidth = pageX - t.sx;
                        }

                        if (pageY - t.sy <= 10) {
                            t.sHeight = 10;
                        } else if (pageY >= t.imgHeight) {
                            t.sHeight = t.imgHeight - t.sy;
                        } else {
                            t.sHeight = pageY - t.sy;
                        }
                        t.cutImage();
                    }
                }

                // 横拉
                else if (resizingX || Math.abs(pageX - (t.sx + t.sWidth)) <= 2 && t.sy <= pageY && pageY <= (t.sy + t.sHeight)) {
                    this.style.cursor = 'e-resize';

                    this.onmousedown = function () {
                        resizingX = true;
                        startX = e.pageX - ( t.regional.offsetLeft + this.offsetLeft );
                    };
                    window.onmouseup = function () {
                        resizingX = false;
                    };

                    if (resizingX) {
                        console.log("resizeX");
                        if (pageX - t.sx <= 10) {
                            // 移动到图片左边缘外边
                            t.sWidth = 10;
                        } else if (pageX >= t.imgWidth) {
                            // 移动到右边缘外边
                            t.sWidth = t.imgWidth - t.sx;
                        } else {
                            // 改变宽度
                            t.sWidth = pageX - t.sx;
                        }
                        t.cutImage();
                    }

                }

                // 竖拉
                else if (resizingY || t.sx <= pageX && pageX <= (t.sx + t.sWidth) && Math.abs(pageY - (t.sy + t.sHeight)) <= 2) {
                    this.style.cursor = 's-resize';

                    this.onmousedown = function () {
                        resizingY = true;
                        startY = e.pageY - ( t.regional.offsetTop + this.offsetTop );
                    };
                    window.onmouseup = function () {
                        resizingY = false;
                    };
                    if (resizingY) {
                        console.log("resizeY");
                        if (pageY - t.sy <= 10) {
                            t.sHeight = 10;
                        } else if (pageY >= t.imgHeight) {
                            t.sHeight = t.imgHeight - t.sy;
                        } else {
                            t.sHeight = pageY - t.sy;
                        }
                        t.cutImage();
                    }
                }

                // 移动
                else if (draging || pageX > t.sx && pageX < t.sx + t.sWidth && pageY > t.sy && pageY < t.sy + t.sHeight) {
                    this.style.cursor = 'move';

                    this.onmousedown = function () {
                        draging = true;

                        // 记录上一次截图时候的坐标
                        t.ex = t.sx;
                        t.ey = t.sy;

                        // 记录鼠标按下时候的坐标
                        startX = e.pageX - ( t.regional.offsetLeft + this.offsetLeft );
                        startY = e.pageY - ( t.regional.offsetTop + this.offsetTop );

                    };
                    window.onmouseup = function () {
                        draging = false;
                    };

                    if (draging) {
                        console.log("move");
                        if (t.ex + (pageX - startX) < 0) {
                            // 移动到左边缘外边
                            t.sx = 0;
                        } else if (t.ex + (pageX - startX) + t.sWidth > t.imgWidth) {
                            // 移动到右边缘外边
                            t.sx = t.imgWidth - t.sWidth;
                        } else {
                            // 移动位置
                            t.sx = t.ex + (pageX - startX);
                        }

                        if (t.ey + (pageY - startY) < 0) {
                            t.sy = 0;
                        } else if (t.ey + (pageY - startY) + t.sHeight > t.imgHeight) {
                            t.sy = t.imgHeight - t.sHeight;
                        } else {
                            t.sy = t.ey + (pageY - startY);
                        }
                        t.cutImage();
                    }
                }

                else {
                    this.style.cursor = 'default';
                }

            };

            document.getElementById('save_button').onclick = function () {
                // t.editPic.height = t.sHeight;
                // t.editPic.width = t.sWidth;
                // var ctx = t.editPic.getContext('2d');
                // var images = new Image();
                // images.src = t.imgUrl;
                //
                // images.onload = function () {
                //     ctx.drawImage(images, t.sx, t.sy, t.sHeight, t.sWidth, 0, 0, t.sHeight, t.sWidth);
                //     document.getElementById('show_pic').getElementsByTagName('img')[0].src = t.editPic.toDataURL();
                // }
            }
        }
    }
;

postFile.init();

