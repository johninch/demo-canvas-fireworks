(() => {
    //可视化窗口 Size 改变时触发 resizeCanvas 函数
    window.addEventListener("resize", resizeCanvas, false);
    //当 DOM 解析完成后触发 onLoad 函数
    window.addEventListener("DOMContentLoaded", onLoad, false);
    //requestAnimationFrame 兼容
    window.requestAnimationFrame = 
        window.requestAnimationFrame       || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame    || 
        window.oRequestAnimationFrame      || 
        window.msRequestAnimationFrame     || 
        function (callback) {
            window.setTimeout(callback, 1000/60);
        };
    
    //初始化变量
    var canvas,
        ctx,
        w, // canvas宽度
        h,
        rockets = [],
        particles = [],
        counter = 0;
    
    //初始化 Canvas
    function onLoad() {
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext("2d");
        resizeCanvas();
        //渲染动画
        window.requestAnimationFrame(loop);
    } 
    
    //改变 Canvas 可视窗口 Size 函数
    function resizeCanvas() {
        if (!!canvas) {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
    }
    
    //更新函数
    function loop() {
        ctx.globalCompositeOperation = 'source-over'; // 默认合成：新覆盖旧
        ctx.fillStyle = "rgba(0,0,0,0.1)"; // 用背景的半透明，实现拖尾
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter'; // 加色合成

        counter += 1;
        !(counter % 30) && rockets.push(new Rocket());

        rockets.forEach((r, i) => {
            r.draw();
            r.update();
            if (r.vy > 0) {
                r.explode();
                rockets.splice(i, 1);
            }
        });

        particles.forEach((p, i) => {
            p.draw();
            let flag = p.move();
            !flag && particles.splice(i, 1);
        })

        window.requestAnimationFrame(loop);
    }

    // 火箭函数
    function Rocket() {
        this.x = Math.random() * (w - 200) + 100;
        this.y = h;
        this.hue = Math.floor(Math.random() * 360);

        const angle = Math.random() * Math.PI / 4 - Math.PI / 6;
        const vbase = 6 + Math.random() * 7;
        this.vx = Math.sin(angle) * vbase;
        this.vy = -Math.cos(angle) * vbase;
    }

    Rocket.prototype = {
        draw: function() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
            ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`; // 原生矩形非path绘制，fillReact要在选颜色之后，否则会用默认黑色绘制
            ctx.fillRect(0, 0, 5, 10); // 长方形火箭块
            ctx.restore();
        },
        update: function() {
            this.x = this.x + this.vx;
            this.y = this.y + this.vy;
            this.vy += 0.1;
        },
        explode: function() {
            var num = Math.random() * 50 + 100;
            for (var i = 0; i < num; i++) {
                let p = new Particle(this.x, this.y, this.hue)
                particles.push(p);
            }
        }
    }
    
    //颗粒函数
    function Particle(x, y, hue) {
        this.x = x;
        this.y = y;
        this.hue = hue;

        this.alpha = Math.random() * .5 + .5;
        this.r = Math.random() * 4 + 1; // 颗粒半径

        const angle = Math.random() * 2 * Math.PI;
        const vbase = 1 + Math.random() * 6;
        this.vx = Math.cos(angle) * vbase;
        this.vy = Math.sin(angle) * vbase;
    } 
    
    Particle.prototype = {
        gravity: 0.05,          //烟花颗粒坠落速度
        lightness: 50,
        move: function () {     //改变烟花颗粒位置
            this.x += this.vx;
            this.vy += this.gravity;
            this.y += this.vy;
            this.alpha -= 0.01;
            if (this.x <= -2 * this.r || this.x >= screen.width || this.y >= screen.height || this.alpha <= 0) {
                return false;
            }
            return true;
        },
        draw: function () {    //渲染烟花颗粒
            ctx.save();
            ctx.beginPath();
            
            ctx.translate(this.x, this.y);  //改变位置
            ctx.arc(0, 0, this.r, 0, Math.PI * 2);                //圆形颗粒
            ctx.fillStyle = `hsl(${this.hue}, 100%, ${this.lightness}%)`; //填充颜色 hsl：色调、饱和度、亮度
            ctx.globalAlpha = this.alpha;                         //透明度
            
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
})()
