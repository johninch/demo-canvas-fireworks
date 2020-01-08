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
    var c1, // 烟花画布
        ctx1,
        c2, // 文字原有画布
        ctx2,
        c3, // 文字显示画布
        ctx3,
        w, // canvas宽度
        h,
        rockets = [],
        particles = [],
        targets = [], // text目标点集合
        textWidth,
        fontSize,
        fidelity = 3, // 保真度
        firePoint = 30,
        fireNum = Math.random() * 70 + 80, // 烟花数量
        counter = 0;
    
    //初始化 Canvas
    function onLoad() {
        [c1, c2, c3] = document.querySelectorAll('canvas');
        [ctx1, ctx2, ctx3] = [c1, c2, c3].map(c => c.getContext('2d'));

        resizeCanvas();
        layoutText();
        computeImgTarget();

        //渲染动画
        window.requestAnimationFrame(loop);
    }

    //改变 Canvas 可视窗口 Size 函数
    function resizeCanvas() {
        if (!!c1) {
            w = c1.width = c3.width = window.innerWidth;
            h = c1.height = c3.height = window.innerHeight;
        }
    }

    function layoutText() {
        const text = 'RoundTable';
        // const text = 'FE';
        fontSize = 200;
        textWidth = 99999999;
        
        while (textWidth > window.innerWidth) {
            ctx2.font = `900 ${fontSize--}px Arial`;
            textWidth = ctx2.measureText(text).width;
        }
        
        c2.width = textWidth;
        c2.height = fontSize * 1.5;
        ctx2.fillStyle = '#000';
        ctx2.font = `900 ${fontSize}px Arial`;
        ctx2.fillText(text, 0, fontSize);
        
        ctx3.fillStyle = '#FFF';
        ctx3.shadowColor = '#FFF';
        ctx3.shadowBlur = 25;
    }

    function computeImgTarget() {
        const imgData = ctx2.getImageData(0, 0, c2.width, c2.height);
        for (let i = 0, max = imgData.data.length; i < max; i += 4) {
            const alpha = imgData.data[i + 3];
            const x = Math.floor(i / 4) % imgData.width;
            const y = Math.floor(i / 4 / imgData.width);

            if (alpha && x % fidelity === 0 && y % fidelity === 0) {
                targets.push({ x, y });
            }
        }
        ctx2.clearRect(0, 0, c2.width, c2.height); // 清空c2画布
    }
    
    //更新函数
    function loop() {
        ctx1.globalCompositeOperation = 'source-over'; // 默认合成：新覆盖旧
        ctx1.fillStyle = "rgba(0,0,0,0.1)"; // 用背景的半透明，实现拖尾
        ctx1.fillRect(0, 0, w, h);
        // ctx1.clearRect(0, 0, w, h);
        ctx1.globalCompositeOperation = 'lighter'; // 加色合成

        counter += 1;
        !(counter % firePoint) && rockets.push(new Rocket());

        rockets.forEach((r, i) => {
            r.draw();
            r.update();
            if (r.vy > 0) {
                r.explode();
                rockets.splice(i, 1);
            }
        });

        // console.log(particles.length);

        particles.forEach((p, i) => {
            p.draw();
            p.move();
            if (p.vx === 0 && (p.lightness >= 99 || p.timer >= p.ttl)) {
                ctx3.fillRect(p.target.x, p.target.y, fidelity + 1, fidelity + 1);
                particles.splice(i, 1);
            }
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
            ctx1.save();
            ctx1.translate(this.x, this.y);
            ctx1.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
            ctx1.fillStyle = `hsl(${this.hue}, 100%, 50%)`; // 原生矩形非path绘制，fillReact要在选颜色之后，否则会用默认黑色绘制
            ctx1.fillRect(0, 0, 5, 10); // 长方形火箭块
            ctx1.restore();
        },
        update: function() {
            this.x = this.x + this.vx;
            this.y = this.y + this.vy;
            this.vy += 0.1;
        },
        explode: function() {
            for (var i = 0; i < fireNum; i++) {
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

        this.lightness = 50; // 亮度一致，所以是单色烟花
        // this.lightness = Math.random() * 70 + 30; // 因为亮度是不一致的，所以烟花不是单色的
        // this.alpha = Math.random() * .5 + .5;
        this.r = Math.random() * 4 + 1; // 颗粒半径

        const angle = Math.random() * 2 * Math.PI;
        const vbase = 1 + Math.random() * 6;
        this.vx = Math.cos(angle) * vbase;
        this.vy = Math.sin(angle) * vbase;

        this.target = getTarget();
    } 
    
    Particle.prototype = {
        gravity: 0.05,          //烟花颗粒坠落速度
        move: function () {     //改变烟花颗粒位置
            if (this.target) {
                this.arriveTarget()
            } else {
                this.vy += this.gravity;
                this.lightness -= 1;
                if (this.y >= screen.height || this.lightness <= 0) {
                    particles.forEach((p, i) => {
                        p === this && particles.splice(i, 1);
                    })
                }
            }
            this.x += this.vx;
            this.y += this.vy;
        },
        draw: function () {    //渲染烟花颗粒
            ctx1.save();
            ctx1.beginPath();
            
            ctx1.arc(this.x, this.y, this.r, 0, Math.PI * 2);                //圆形颗粒
            ctx1.fillStyle = `hsl(${this.hue}, 100%, ${this.lightness}%)`; //填充颜色 hsl：色调、饱和度、亮度
            // ctx1.globalAlpha = this.alpha;                         //透明度
            
            ctx1.closePath();
            ctx1.fill();
            ctx1.restore();
        },
        arriveTarget() {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const tx = Math.cos(angle) * 5;
            const ty = Math.sin(angle) * 5;
            this.r = lerp(this.r, 3, 0.05);

            if (distance < 5) {
                this.lightness = lerp(this.lightness, 100, 0.01);
                this.vx = this.vy = 0;
                this.x = lerp(this.x, this.target.x + fidelity / 2, 0.05);
                this.y = lerp(this.y, this.target.y + fidelity / 2, 0.05);
                this.timer += 1;
            } else if (distance < 10) {
                this.lightness = lerp(this.lightness, 100, 0.01);
                this.vx = lerp(this.vx, tx, 0.1);
                this.vy = lerp(this.vy, ty, 0.1);
                this.timer += 1;
            } else {
                this.vx = lerp(this.vx, tx, 0.02);
                this.vy = lerp(this.vy, ty, 0.02);
            }
        }
    }

    // 用于平滑跟随效果的插值函数
    const lerp = (from, to, t) => Math.abs(to - from) > 0.1 ? from + t * (to - from) : to;

    function getTarget() {
        if (targets.length > 0) {
            const idx = Math.floor(Math.random() * targets.length);
            let { x, y } = targets[idx];
            targets.splice(idx, 1);

            x += c1.width / 2 - textWidth / 2;
            y += c1.height / 2 - fontSize / 2;

            return { x, y };
        }
    }
})()
