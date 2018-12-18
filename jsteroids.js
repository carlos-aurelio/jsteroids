/*
 *https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
 */
function onsegment(p, q, r) {
  if (q.x <= Math.max(p.x, r.x) &&
      q.x >= Math.min(p.x, r.x) &&
      q.y <= Math.max(p.y, r.y) &&
      q.y >= Math.min(p.y, r.y)) {
    return true;
  } else {
    return false;
  }
}
  
function orientation(p, q, r) {
  var val = (q.y - p.y) * (r.x - q.x) -
            (q.x - p.x) * (r.y - q.y);
  if (val === 0) {
    return 0;
  } else if (val > 0) {
    return 1;
  } else {
    return 2;
  }
}
  
function segment_intersect(p1, q1, p2, q2) {
  var o1 = orientation(p1, q1, p2);
  var o2 = orientation(p1, q1, q2);
  var o3 = orientation(p2, q2, p1);
  var o4 = orientation(p2, q2, q1);

  return (o1 != o2 && o3 != o4) ||
    (o1 === 0 && onsegment(p1, p2, q1)) || 
    (o2 === 0 && onsegment(p1, q2, q1)) ||
    (o3 === 0 && onsegment(p2, p1, q2)) ||
    (o4 === 0 && onsegment(p2, q1, q2));
}
  
function poly_intersect(poly1, poly2) {
  for (var i = 0; i < poly1.length; i++) {
    for (var j = 0; j < poly2.length; j++) {
      if (segment_intersect(
        poly1[i], poly1[(i + 1) % poly1.length],
        poly2[j], poly2[(j + 1) % poly2.length])) {
        return true;
      }
    }
  }
  return false;
}

function from_polar(angle, radius) {
  angle = angle * Math.PI / 180;
  return {
    'x': radius * Math.cos(angle),
    'y': radius * Math.sin(angle)
  };
}

function rand_range(min, max) {
  return Math.random() * (max - min) + min;
}

function rotate_pt(pt, angle) {
  angle = angle * Math.PI / 180;
  xrot = pt.x * Math.cos(angle) - pt.y * Math.sin(angle);
  yrot = pt.y * Math.cos(angle) + pt.x * Math.sin(angle);
  return { 'x': xrot, 'y': yrot };
}

function rotate_poly(poly, angle) {
  var ret = [];
  for (var i = 0; i < poly.length; i++) {
    ret.push(rotate_pt(poly[i], angle));
  }
  return ret;
}

function translate_poly(poly, dx, dy) {
  var ret =[];
  for (var i = 0; i < poly.length; i++) {
    ret.push({ 'x': poly[i].x + dx, 'y': poly[i].y + dy });
  }
  return ret;
}

function draw_poly(poly, ctx) {
  if (poly.length > 1) {
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y)
    for (var i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i].x, poly[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }
}

class UIText {
  constructor(scene) {
    this.scene = scene;
    this.ctx = this.scene.ctx;
    this.cvs = this.scene.cvs;
    this.text = '<text>';
    this.size = 15;
    this.font = 'Monospace';
    this.color = 'white';
    this.bordercolor = 'black';
    this.textAlign = 'start';
    this.x = this.cvs.width / 2;
    this.y = this.cvs.height / 2;
  }

  draw() {
    this.ctx.lineCap = 'square';
    this.ctx.lineJoin = 'miter';
    this.ctx.lineWidth = this.size / 10;
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = this.bordercolor;
    this.ctx.font = this.size + 'px ' + this.font;
    this.ctx.textAlign = this.textAlign;
    var text = this.text;
    if (!Array.isArray(text)) {
      text = [ this.text ];
    }
    for (var i = 0; i < text.length; i++) {
      this.ctx.strokeText(text[i], this.x, this.y + this.size * i);
      this.ctx.fillText(text[i], this.x, this.y + this.size * i);
    }
  }
}

class Score extends UIText {
  constructor(scene) {
    super(scene);
    this.x = 5;
    this.y = this.size;
    this.score = 0;
  }

  add_points(points) {
    this.score += points;
  }

  draw() {
    this.text = 'SCORE: ' + this.score;
    super.draw();
  }
}

class Lives extends UIText {
  constructor(scene) {
    super(scene);
    this.y = this.size + 2;
    this.extra = 3;
    this.textAlign = 'end';
    this.font = 'sans-serf';
    this.use_sched = false;
  }

  use_life(delay) {
    this.use_time = Date.now() + delay;
    this.use_sched = true;
  }

  has_extra() {
    return this.extra > 0;
  }

  draw() {
    if (this.use_sched && Date.now() > this.use_time) {
      if (this.extra > 0) {
        this.extra--;
      }
      this.use_sched = false;
    }
    this.x = this.cvs.width - 5;
    this.text = '';
    for (var i = 0; i < this.extra; i++ ) {
      this.text += ' ⮝';
    }
    super.draw();
  }
}

class GameOver extends UIText {
  constructor(scene) {
    super(scene);
    this.text = 'GAME OVER';
    this.textAlign = 'center';
    this.size = 30;
  }

  draw() {
    this.x = this.scene.cvs.width / 2;
    this.y = this.scene.cvs.height / 4;
    super.draw();
  }
}

class Stats extends UIText {
  constructor(scene, score, level, shots_fired, asteroids_hit) {
    super(scene);
    this.textAlign = 'center';
    var accuracy = 0;
    if (shots_fired > 0) {
      accuracy = Math.floor(asteroids_hit * 100 / shots_fired);
    }
    this.text = [
      ('Total score: ' + score).padEnd(25),
      ('      Level: ' + level).padEnd(25),
      ('   Accuracy: ' + accuracy + '%').padEnd(25)
    ];
  }

  draw() {
    this.x = this.scene.cvs.width / 2;
    this.y = this.scene.cvs.height / 2;
    super.draw();
  }
}

class Body {
  constructor(scene, poly) {
    this.scene = scene;
    this.x = this.scene.cvs.width / 2;
    this.y = this.scene.cvs.height / 2;
    this.p_x = this.x;
    this.p_y = this.y;
    this.x_speed = 0;
    this.y_speed = 0;
    this.angle = 0;
    this.p_angle = this.angle;
    this.angle_speed = 0;
    this.cvs = this.scene.cvs;
    this.ctx = this.scene.cvs.getContext("2d");
    this.poly = poly;
    this.color = 'rgba(255, 255, 255, 1.0)';
    this.speed_limit = 100000;
    this.class = 'none';
    this.inertia = 1;
    this.offsets = [
      {'x': 0, 'y': 0},
      {'x': this.cvs.width, 'y': 0},
      {'x': this.cvs.width, 'y': this.cvs.height },
      {'x': 0, 'y': this.cvs.height },
      {'x': -this.cvs.width, 'y': this.cvs.height },
      {'x': -this.cvs.width, 'y': 0 },
      {'x': -this.cvs.width, 'y': -this.cvs.height },
      {'x': 0, 'y': -this.cvs.height },
      {'x': this.cvs.width, 'y': -this.cvs.height },
    ];
    var max_xy = 0;
    for (var i = 0; i < this.poly.length; i++) {
      if (Math.abs(this.poly[i].x) > max_xy) {
        max_xy = Math.abs(this.poly[i].x);
      }
      if (Math.abs(this.poly[i].y) > max_xy) {
        max_xy = Math.abs(this.poly[i].y);
      }
    }
    this.bbox = { 
      'x0': -max_xy, 'y0': -max_xy,
      'x1': max_xy, 'y1': max_xy
    };
    this.children = [];
    this.active = false;
  }

  add_child(o) {
    this.children.push(o);
  }

  remove_child(o) {
    for (var i = 0; i < this.children.length; i++) {
      if (o === this.children[i]) {
        this.children.splice(i, 1);
        i--;
      }
    }
  }

  activate() {
    this.active = true;
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].activate();
    }
  }

  reposition(x, y) {
    this.x = this.p_x = x;
    this.y = this.p_y = y;
  }

  bbox_intersects(body) {
    var tdx = Math.abs(this.x - this.p_x);
    var tdy = Math.abs(this.y - this.p_y);
    var bdx = Math.abs(body.x - body.p_x);
    var bdy = Math.abs(body.y - body.p_y);
    for (var i = 0; i < this.offsets.length; i++) {
      if (!(this.offsets[i].x + this.x + this.bbox.x1 + tdx < body.x + body.bbox.x0 - bdx ||
            this.offsets[i].x + this.x + this.bbox.x0 - tdx > body.x + body.bbox.x1 + bdx ||
            this.offsets[i].y + this.y + this.bbox.y1 + tdy < body.y + body.bbox.y0 - bdy ||
            this.offsets[i].y + this.y + this.bbox.y0 - tdy > body.y + body.bbox.y1 + bdy)) {
        return i;
      } 
    }
    return -1;
  }
  
  intersects(body) {
    var o = this.bbox_intersects(body);
    if (o >= 0) {
      var poly1 = translate_poly(rotate_poly(this.poly, this.angle), this.x + this.offsets[o].x, this.y + this.offsets[o].y);
      var poly2 = translate_poly(rotate_poly(body.poly, body.angle), body.x, body.y);
      if (poly_intersect(poly1, poly2)) {
        return true;        
      }
    }
    return false;
  }
  
  update(interval) {
    if (!this.active) {
      return;
    }
    // store previous values
    this.p_x = this.x;
    this.p_y = this.y;
    this.p_angle = this.angle;
    
    this.x_speed *= this.inertia;
    this.y_speed *= this.inertia;
    
    // limit speed
    if (this.x_speed < -this.speed_limit) {
      this.x_speed = -this.speed_limit;
    }
    if (this.y_speed < -this.speed_limit) {
      this.y_speed = -this.speed_limit;
    }
    if (this.x_speed > this.speed_limit) {
      this.x_speed = this.speed_limit;
    }
    if (this.y_speed > this.speed_limit) {
      this.y_speed = this.speed_limit;
    }
    
    // update angle and position
    this.angle += this.angle_speed * interval / 1000;
    this.x += this.x_speed * interval / 100000;
    this.y += this.y_speed * interval / 100000;

    // trim angle and position
    while (this.angle < 0) {
      this.angle += 360;
    }
    this.angle %= 360;
    while (this.x < 0) {
      this.x += this.cvs.width;
      this.p_x += this.cvs.width;
    }
    while (this.y < 0) {
      this.y += this.cvs.height;
      this.p_y += this.cvs.height;
    }
    while (this.x >= this.cvs.width) {
      this.x -= this.cvs.width;
      this.p_y  -= this.cvs.width;
    }
    while (this.y >= this.cvs.height) {
      this.y -= this.cvs.height;
      this.p_y -= this.cvs.height;
    }
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].update(interval);
    }
  }

  draw() {
    if(!this.active) {
      // body not yet active
      return;
    }
    // create rotated/translated polygon
    var r_poly = rotate_poly(this.poly, this.angle);
    var t_poly = translate_poly(r_poly, this.x, this.y);
    var d_poly = [];
    d_poly.push(t_poly);

    // create duplicated polygons to draw when going through the canvas edge
    if (this.x < this.cvs.width / 2) {
      d_poly.push(translate_poly(t_poly, this.cvs.width, 0));
      if (this.y < this.cvs.height / 2) {
        d_poly.push(translate_poly(t_poly, this.cvs.width, this.cvs.height));
      } else {
        d_poly.push(translate_poly(t_poly, this.cvs.width, -this.cvs.height));
      }
    } else {
      d_poly.push(translate_poly(t_poly, -this.cvs.width, 0));  
      if (this.y < this.cvs.height / 2) {
        d_poly.push(translate_poly(t_poly, -this.cvs.width, this.cvs.height));
      } else {
        d_poly.push(translate_poly(t_poly, -this.cvs.width, -this.cvs.height));
      }
    }
    if (this.y < this.cvs.height / 2) {
      d_poly.push(translate_poly(t_poly, 0, this.cvs.height));
      if (this.x < this.cvs.width / 2) {
        d_poly.push(translate_poly(t_poly, this.cvs.width, this.cvs.height));
      } else {
        d_poly.push(translate_poly(t_poly, -this.cvs.width, this.cvs.height));
      }
    } else {
      d_poly.push(translate_poly(t_poly, 0, -this.cvs.height));      
      if (this.x < this.cvs.width / 2) {
        d_poly.push(translate_poly(t_poly, this.cvs.width, -this.cvs.height));
      } else {
        d_poly.push(translate_poly(t_poly, -this.cvs.width, -this.cvs.height));
      }
    }

    // draw all polygons
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 1;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    for (var i = 0; i < d_poly.length; i++) {
      draw_poly(d_poly[i], this.ctx);
    }

    for (var i = 0; i < this.children.length; i++) {
      this.children[i].draw();
    }
  }
}

class Asteroid extends Body {
  constructor(scene, size) {
    var poly = [];
    for (var i = 0; i < 360; i += rand_range(20, 60)) {
      if (360 - i > 30) {
        poly.push(from_polar(i, size * rand_range(4, 5)));
      }
    }
    super(scene, poly);
    this.angle_speed = rand_range(-30, 30);
    this.class = 'asteroid';
    this.color = 'hsl(0, 0%, 50%)';
    this.size = size;
  }

  spawn_shards(hitting_object) {
    var min_angle = 0;
    var max_angle = 360;
    var angle = rand_range(0, 360);
    if (this.size > 2) {
      if (hitting_object.x - this.x != 0 || hitting_object.y - this.y != 0) {
        angle = Math.atan2(hitting_object.y - this.y, hitting_object.x - this.x) * 180 / Math.PI;          
      }
      var vec = rotate_pt({ 'x': 0, 'y': rand_range(1000, 5000) }, angle);
      var s1pos = rotate_pt({'x': this.size * 1.5, 'y': 0}, angle + 90);
      var s2pos = rotate_pt({'x': this.size * 1.5, 'y': 0}, angle - 90);
      s1pos.x += this.x;
      s1pos.y += this.y;
      s2pos.x += this.x;
      s2pos.y += this.y;
      
      var shard1 = new Asteroid(this.scene, this.size / 2);
      var shard2 = new Asteroid(this.scene, this.size / 2);
      shard1.reposition(s1pos.x, s1pos.y);
      shard2.reposition(s2pos.x, s2pos.y);
      shard1.x_speed = this.x_speed + vec.x;
      shard1.y_speed = this.y_speed + vec.y;
      shard2.x_speed = this.x_speed - vec.x;
      shard2.y_speed = this.y_speed - vec.y;
      this.scene.add(shard1);
      this.scene.add(shard2);
      min_angle = -60;
      max_angle = 60;
    }
    var spread = 5;
    for (var i = 0; i < 15; i++) {
      var d1pos = rotate_pt({'x': this.size * 1.5, 'y': rand_range(-spread, spread)}, angle + 180);
      var d2pos = rotate_pt({'x': this.size * 1.5, 'y': rand_range(-spread, spread)}, angle);
      var d1 = new Debris(this, angle + 90 + rand_range(min_angle, max_angle));
      var d2 = new Debris(this, angle - 90 + rand_range(min_angle, max_angle));
      d1.reposition(d1pos.x + this.x, d1pos.y + this.y);
      d2.reposition(d2pos.x + this.x, d2pos.y + this.y);
      this.scene.add(d1);
      this.scene.add(d2);
    }
    new Audio('explosion.wav').play();
  }
}

class Shield extends Body {
  constructor(ship) {
    var poly = [
      {"x": -5, "y": -20},
      {"x": 0, "y": -23},
      {"x": 5, "y": -20},
      {"x": 16, "y": 16},
      {"x": 10, "y": 21},
      {"x": -10, "y": 21},
      {"x": -16, "y": 16},
    ];
    super(ship.scene, poly);
    this.ship = ship;
    this.class = 'shield';
    this.alpha = 0.5;
    this.color = 'rgba(100, 255, 255, ' + this.alpha + ')';
    this.warn_delay = 1000;
    this.expire_delay = 2350;
  }

  activate() {
    this.warn_start = Date.now() + this.warn_delay;
    this.expiration = Date.now() + this.expire_delay;
    super.activate();
  }

  update(interval) {
    this.reposition(this.ship.x, this.ship.y);
    this.angle = this.ship.angle;
    var blink_time = Date.now() - this.warn_start;
    if (blink_time >= 0) {
      if (Math.floor(blink_time / 150) % 2 > 0) {
        this.alpha = 0.0;
      } else {
        this.alpha = 0.5;
      }
      this.color = 'rgba(100, 255, 255, ' + this.alpha + ')';
    }
    if (Date.now() > this.expiration) {
      this.ship.remove_child(this);
      this.ship.shield = null;
    }
  }
}

class Ship extends Body {
  constructor(scene, shield) {
    var poly = [
      {"x": 0, "y": -15},
      {"x": 10, "y": 15},
      {"x": 0, "y": 5},
      {"x": -10, "y": 15},
    ];
    super(scene, poly);
    this.accel = 0;
    this.shot_fired = false;
    this.speed_limit = 30000;
    this.class = 'player';
    if (shield) {
      this.shield = new Shield(this);
      this.children.push(this.shield);
    }
  }

  keydown(key) {
    switch (key) {
      case 'ArrowLeft':
        this.angle_speed = -270;
        break;
      case 'ArrowRight':
        this.angle_speed = 270;
        break;
      case 'ArrowUp':
        if (this.accel === 0) {
          this.last_engine_particle = Date.now();
          this.accel = -400;
        }
        break;
      case 'ArrowDown':
        if (!this.shot_fired) {
          new Audio('shot.wav').play();
          this.scene.add(new Shot(this, -50000, 500));
          this.shot_fired = true;
        }
        break;
    }
  }

  keyup(key) {
    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        this.angle_speed = 0;
        break;
      case 'ArrowUp':
        this.accel = 0;
        break;
      case 'ArrowDown':
        this.shot_fired = false;
        break;
    }
  }

  update(interval) {
    var vec = rotate_pt({ 'x': 0, 'y': 1 }, this.angle);
    this.x_speed += this.accel * vec.x;
    this.y_speed += this.accel * vec.y;
    if (this.accel !== 0 && Date.now() - this.last_engine_particle > 30) {
      this.scene.add(new EngineFire(this));
      this.last_engine_particle = Date.now();
    }
    super.update(interval);
  }
}

class Shot extends Body {
  constructor (parent_body, speed, ttl) {
    var poly = [
      {'x': -1, 'y': 0},
      {'x': 0, 'y': -3},
      {'x': 1, 'y': 0},
      {'x': 0, 'y': 2},
    ];
    super(parent_body.scene, poly);
    var origin = rotate_pt({ 'x': 0, 'y': -10 }, parent_body.angle);
    var t_origin = {
      'x': origin.x + parent_body.x,
      'y': origin.y + parent_body.y
    };
    var vec = rotate_pt({ 'x': 0, 'y': 1 }, parent_body.angle);
    this.x_speed = vec.x * speed + parent_body.x_speed;
    this.y_speed = vec.y * speed + parent_body.y_speed;
    this.reposition(t_origin.x, t_origin.y);
    this.p_angle = this.angle = parent_body.angle;
    this.expiration = Date.now() + ttl;
    this.color = 'rgba(100, 255, 255, 1.0)';
    this.class = 'shot';
  }
  
  intersects(body) {
    var o = this.bbox_intersects(body);
    if (o >= 0) {
      var fpoly = [
        { 
          'x': this.x + this.offsets[o].x,
          'y': this.y + this.offsets[o].y
        },
        {
          'x': this.p_x + this.offsets[o].x,
          'y': this.p_y + this.offsets[o].y
        }
      ];
      var poly2 = translate_poly(rotate_poly(body.poly, body.angle), body.x, body.y);
      if (poly_intersect(fpoly, poly2)) {
        return true;
      }
    }
    return false;
  }
  
  update(interval) {
    super.update(interval);
    if (Date.now() > this.expiration) {
      this.scene.remove(this);
    }
  }
}

class Particle extends Body {
  constructor (parent_body, ttl, hue, speed, angle) {
    var poly = [
      {'x': -1.5, 'y': 0},
      {'x': 0, 'y': -1.5},
      {'x': 1.5, 'y': 0},
      {'x': 0, 'y': 1.5},
    ];
    super(parent_body.scene, poly);
    var origin = rotate_pt({ 'x': 0, 'y': 5 }, parent_body.angle);
    var t_origin = {
      'x': origin.x + parent_body.x,
      'y': origin.y + parent_body.y
    };
    var vec = rotate_pt({ 'x': 0, 'y': 1 }, angle + parent_body.angle);
    this.x_speed = vec.x * speed + parent_body.x_speed;
    this.y_speed = vec.y * speed + parent_body.y_speed;
    this.reposition(t_origin.x, t_origin.y);
    this.p_angle = this.angle = angle + parent_body.angle;
    this.expiration = Date.now() + ttl;
    this.alpha = 1;
    this.ttl = ttl;
    this.hue = hue;
    this.lig = 100;
    this.sat = 100;
  }

  update(interval) {
    super.update(interval);
    if (Date.now() > this.expiration) {
      this.scene.remove(this);
    }
    this.alpha -= interval / this.ttl;
    this.color = 'hsla(' + this.hue + ', ' + this.sat + '%, ' + this.lig + '%, ' + this.alpha + ')';
  }

  bbox_intersects(body) {
    return -1;
  }
}

class EngineFire extends Particle {
  constructor (parent_body) {
    var hue = rand_range(0, 60);
    var ttl = rand_range(300, 600);
    var speed = rand_range(6000, 15000);
    var angle = rand_range(-20, 20);
    super(parent_body, ttl, hue, speed, angle);
    this.lig = 50;
  }

  update(interval) {
    super.update(interval);
    this.color = 'hsla(' + this.hue + ', ' + this.sat + '%, ' + (50 + 50 * this.alpha) + '%, ' + this.alpha + ')';
  }
}

class Debris extends Particle {
  constructor (parent_body, angle) {
    var ttl = rand_range(800, 1200);
    var speed = rand_range(5000, 10000);
    super(parent_body, ttl, 0, speed, angle);
    this.lig = 50;
    this.angle_speed = rand_range(-500, 500);
    this.sat = 0;
  }
}

class Level {
  constructor(cvs, level) {
    this.cvs = cvs;
    this.ctx = cvs.getContext("2d");
    this.last_step = Date.now();
    this.level = level;
    this.score = new Score(this);
    this.lives = new Lives(this);
    this.uis = [];
    this.uis.push(this.score);
    this.uis.push(this.lives);
    this.shots_fired = 0;
    this.asteroids_hit = 0;
    this.audio_explosion = new Audio('explosion.wav');
    this.audio_shot = new Audio('shot.wav');
    this.audio_shield = new Audio('shield.wav');
    this.reset();
  }
  
  reset() {
    console.log('starting level ' + this.level);
    this.clear = false;
    this.reset_sched = 0;
    this.deletion_sched = [];
    this.addition_sched = [];
    this.delayed_addition_sched = [];
    this.objects = [];
    this.ship = new Ship(this);
    this.add(this.ship);
    this.add_pending();
    for (var i = 0; i < 2 + this.level; i++) {
      this.spawn_asteroid();
    }
  }

  keydown(key) {
    if (this.ship && this.ship.active) {
      this.ship.keydown(key);
    }
  }

  keyup(key) {
    if (this.ship && this.ship.active) {
      this.ship.keyup(key);
    }
  }

  add_delayed(body, delay) {
    body.active = false;
    this.delayed_addition_sched.push({ 'body': body, 'now': Date.now(), 'delay': delay });
  }

  add(o) {
    this.addition_sched.push(o);
  }
  
  remove(o) {
    this.deletion_sched.push(o);
  }

  in_range_of(x, y, dist, body) {
    if (body.class == 'ui') {
      return;
    }
    var min_dist = this.cvs.width + this.cvs.height;
    for (var i = 0; i < body.offsets.length; i++) {
      var dx = x - body.x + body.offsets[i].x;
      var dy = y - body.y + body.offsets[i].y;
      var odist = Math.sqrt(dx * dx + dy * dy);
      if (odist < min_dist) {
        min_dist = odist;
      }
    }

    return min_dist <= dist;
  }

  in_range_of_any(x, y, dist) {
    for (var i = 0; i < this.objects.length; i++) {
      if (this.in_range_of(x, y, dist, this.objects[i])) {
        return true;
      }
    }
    return false;
  }

  spawn_asteroid() {
    var x;
    var y;
    var tries = 0;
    var max_tries = 1000;
    do {
      x = rand_range(0, this.cvs.width);
      y = rand_range(0, this.cvs.height);
      tries++;
    } while (tries < max_tries && this.in_range_of_any(x, y, 120));
    if (tries < max_tries) {
      var a = new Asteroid(this, 12);
      a.reposition(x, y);
      a.x_speed = rand_range(-500, 500);
      a.y_speed = rand_range(-500, 500);
      this.add(a);
      this.add_pending();
    } else {
      console.log('warning: no room for an asteroid');
    }
  }
  
  update(interval) {
    var asteroids = 0;
    for (var i = 0; i < this.objects.length; i++) {
      if (this.objects[i].class == 'asteroid') {
        asteroids++;
      }
      this.objects[i].update(interval);
    }
    for (var i = 0; i < this.objects.length; i++) {
      if (this.objects[i].class == 'shot') {
        for (var k = 0; k < this.objects.length; k++) {
          if (this.objects[k].class == 'asteroid') {
            if (this.objects[i].intersects(this.objects[k])) {
              // asteroid is hit by shot
              this.score.add_points(this.level * 12 / this.objects[k].size);
              this.asteroids_hit++;
              this.remove(this.objects[i]);
              this.remove(this.objects[k]);
              this.objects[k].spawn_shards(this.objects[i]);
              break;
            }
          }
        }
      } else if (this.objects[i].class == 'player') {
        for (var j = 0; j < this.objects.length; j++) {
          if (this.objects[j].class == 'asteroid') {
            if (this.objects[i].shield) {
              // ship is invincible
              if (this.objects[i].shield.intersects(this.objects[j])) {
                this.remove(this.objects[j]);
                this.objects[j].spawn_shards(this.objects[i]);
                new Audio('shield.wav').play();
                break;
              }
            } else if (this.objects[i].intersects(this.objects[j])) {
              // ship is hit by asteroid
              this.remove(this.objects[i]);
              for (var k = 0; k < 100; k++) {
                var sdebris = new Debris(this.objects[i], rand_range(0, 360));
                sdebris.lig = 100;
                this.add(sdebris);
              }
              this.remove(this.objects[j]);
              this.objects[j].spawn_shards(this.objects[i]);
              if (this.lives.has_extra()) {
                // only add ship if there is an extra life
                this.lives.use_life(2500);
                this.ship = new Ship(this, true);
                this.add_delayed(this.ship, 2500);
              } else {
                // game over
                this.ship = null;
                this.uis.push(new GameOver(this));
                this.uis.push(new Stats(this, this.score.score, this.level, this.shots_fired, this.asteroids_hit));
              }
              break;
            }
          }
        }
      }
    }
    if (asteroids == 0 && !this.clear && this.ship) {
      // level clear, wait 3 seconds to start next level
      this.delayed_addition_sched = [];
      this.clear = true;
      this.reset_sched = Date.now() + 3000;
      console.log('level ' + this.level + ' clear!');
    }
    if (this.clear && Date.now() >= this.reset_sched) {
      // 3 seconds passed, reset level with increased asteroid count
      this.level++;
      this.reset();
    }
  }
  
  draw() {
    this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
    for (var i = 0; i < this.objects.length; i++) {
      this.objects[i].draw();
    }
    for (var i = 0; i < this.uis.length; i++) {
      this.uis[i].draw();
    }
  }
  
  add_pending() {
    for (var i = 0; i < this.delayed_addition_sched.length; i++) {
      var o = this.delayed_addition_sched[i];
      if (Date.now() >= o.now + o.delay) {
        o.body.activate();
        this.objects.push(o.body);
        this.delayed_addition_sched.splice(i, 1);
        i--;
      }
    }
    for (var i = 0; i < this.addition_sched.length; i++) {
      this.addition_sched[i].activate();
      if(this.addition_sched[i].class == 'shot') {
        this.shots_fired++;
      }
      this.objects.push(this.addition_sched[i]);
    }
    this.addition_sched = [];
  }

  remove_pending() {
    for (var i = 0; i < this.deletion_sched.length; i++) {
      for (var j = 0; j < this.objects.length; j++) {
        if (this.deletion_sched[i] === this.objects[j]) {
          this.objects.splice(j, 1);
          j--;
        }
      }
    }
    this.deletion_sched = [];
  }
  
  step() {
    this.add_pending();
    this.update((Date.now() - this.last_step));
    this.remove_pending();
    this.draw();
    this.last_step = Date.now();
  }
}

class Game {
  constructor(cvs) {
    this.cvs = cvs;
    this.scene = new Level(this.cvs, 1);
  }

  keydown(key) {
    if (this.scene) {
      this.scene.keydown(key);
    }
  }

  keyup(key) {
    if (this.scene) {
      this.scene.keyup(key);
    }
  }

  start() {
    this.step();
  }

  step() {
    var delay = 16;
    var step_before = Date.now();
    if (this.scene) {
      this.scene.step();
    }
    var step_time = Date.now() - step_before;
    if (delay - step_time > 0) {
      setTimeout(this.step.bind(this), delay - step_time);
    } else {
        setTimeout(this.step.bind(this), 0);
    }
  }
}

function cvs_adjust_size() {
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
}

function window_resize(event) {
  cvs_adjust_size();
}

function window_keydown(e) {
  game.keydown(e.key);
}

function window_keyup(e) {
  game.keyup(e.key)
}

cvs = document.getElementById("canvas");
ctx = cvs.getContext("2d");
window.addEventListener('resize', window_resize);
document.addEventListener('keyup', window_keyup);
document.addEventListener('keydown', window_keydown);
window_resize();

var game = new Game(cvs);
game.start();

