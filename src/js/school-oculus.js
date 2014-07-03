
(function ($) {
  var numBoids = 300;

  // Dimensions
  var minY = -200;
  var maxY = 200;
  var minX = -200;
  var maxX = 200;
  var minZ = -200;
  var maxZ = 200;
  var maxVelocity = 3;

  var seperationDistance = 40,
      alignmentDistance = 20,
      cohesionDistance = 40;

  var delta = .016;
  var PI = 3.141592653589793;
  var PI_2 = PI * 2.0;

  var renderer, scene, camera, stats;
  var light1, light2, light3, light4, light5, light6;
  var showStats = true;

  var minLightDist = 150;
  var maxLightDist = 800;
  var dimLights = true;
  var intensities = [];
  var lastIntensity = 0;

  var clock = new THREE.Clock();
  var controls, oculuEffect, oculusControl;

  // Create each boid. Each boid stores its current position
  // and its current velocity.
  var boids = [], largeFish;
  for (var i = 0; i < numBoids; i += 1) {
      boids[boids.length] = {
          n: i,
          x: Math.random()*(maxX-minX)+minX,
          y: Math.random()*(maxY-minY)+minY,
          z: Math.random()*(maxZ-minZ)+minZ,
          xVelocity: Math.random()*maxVelocity*2 - maxVelocity,
          yVelocity: Math.random()*maxVelocity*2 - maxVelocity,
          zVelocity: Math.random()*maxVelocity*2 - maxVelocity
      };
  }

  // Return the distance between two points (dX, dY, and dZ
  // are the differences between x, y, and z coordinates of the
  // two points).
  var distance = function(dX, dY, dZ) {
      return Math.sqrt((dX * dX) + (dY * dY) + (dZ * dZ)) * 1.0;
  };

  // Return the distance between two boids
  var distanceBetween = function(boidA, boidB) {
      return distance(
          boidA.x - boidB.x,
          boidA.y - boidB.y,
          boidA.z - boidB.z
      );
  };

  var normalize = function(v3){
    var dist = distance(v3.x, v3.y, v3.z);

    return {x:v3.x/dist, y:v3.y/dist, z:v3.z/dist};
  };

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    oculusEffect.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();

    //renderer.setSize( window.innerWidth, window.innerHeight );
  }

  var renderFish = function(){
    var zoneRadius = seperationDistance + alignmentDistance + cohesionDistance;
    var separationThresh = seperationDistance / zoneRadius;
    var alignmentThresh = (seperationDistance + alignmentDistance)  / zoneRadius;
    var zoneRadiusSquared = zoneRadius * zoneRadius;

    var dist;
    var distSquared;

    var seperationSquared = seperationDistance * seperationDistance;
    var cohesionSquared = cohesionDistance * cohesionDistance;

    var f;
    var percent;

    for (var i=0; i<numBoids; i++) {
      var selfBoid = boids[i];
      var central = {x:0, y:0, z:0};
      var dir = {
        x : selfBoid.x - central.x,
        y : selfBoid.y - central.y,
        z : selfBoid.z - central.z
      };
      dist = distance(dir.x, dir.y, dir.z);
      dir.y *= 2.5;

      var normalizeDir = normalize(dir);
      selfBoid.xVelocity -= normalizeDir.x * delta * 2;
      selfBoid.yVelocity -= normalizeDir.y * delta * 2;
      selfBoid.zVelocity -= normalizeDir.z * delta * 2;

      for (var j=0; j<numBoids; j++) {
        var otherBoid = boids[j];

        dir = {
          x : otherBoid.x - selfBoid.x,
          y : otherBoid.y - selfBoid.y,
          z : otherBoid.z - selfBoid.z
        };

        dist = distance(dir.x, dir.y, dir.z);
        distSquared = dist * dist;

        if (dist > 0 && distSquared < zoneRadiusSquared){
          percent = distSquared / zoneRadiusSquared;

          if (percent < separationThresh){ // low
            // Separation - Move apart for comfort
            f = (separationThresh / percent - 1.0) * delta;

            normalizeDir = normalize(dir);
            selfBoid.xVelocity -= normalizeDir.x * f;
            selfBoid.yVelocity -= normalizeDir.y * f;
            selfBoid.zVelocity -= normalizeDir.z * f;
          } else if (percent < alignmentThresh){ // high
            // Alignment - fly the same direction
            var threshDelta = alignmentThresh - separationThresh;
            var adjustedPercent = (percent - separationThresh) / threshDelta;
            var otherBirdVel = {
              x:otherBoid.xVelocity,
              y:otherBoid.yVelocity,
              z:otherBoid.zVelocity
            };

            f = (0.5 - Math.cos(adjustedPercent * PI_2) * 0.5 + 0.5) * delta;

            var normalizeOtherVel = normalize(otherBirdVel);
            selfBoid.xVelocity += normalizeOtherVel.x * f;
            selfBoid.yVelocity += normalizeOtherVel.y * f;
            selfBoid.zVelocity += normalizeOtherVel.z * f;
          } else {
            // Attraction / Cohesion - move closer
            var threshDelta = 1.0 - alignmentThresh;
            var adjustedPercent = (percent - alignmentThresh) / threshDelta;

            f = (0.5 - (Math.cos(adjustedPercent * PI_2) * -0.5 + 0.5)) * delta;

            normalizeDir = normalize(dir);
            selfBoid.xVelocity += normalizeDir.x * f;
            selfBoid.yVelocity += normalizeDir.y * f;
            selfBoid.zVelocity += normalizeDir.z * f;
          }
        }
      }

      if(distance(selfBoid.xVelocity, selfBoid.yVelocity, selfBoid.zVelocity) > maxVelocity){
        var normalizedVel = normalize({x: selfBoid.xVelocity, y: selfBoid.yVelocity, z:selfBoid.zVelocity});

        selfBoid.xVelocity = normalizedVel.x * maxVelocity;
        selfBoid.yVelocity = normalizedVel.y * maxVelocity;
        selfBoid.zVelocity = normalizedVel.z * maxVelocity;
      }
    }

    for (i=0; i<numBoids; i++) {
      var boid = boids[i];
      var oldPos = {
        x: boid.x,
        y: boid.y,
        z: boid.z
      };
      boid.x += boid.xVelocity;
      boid.y += boid.yVelocity;
      boid.z += boid.zVelocity;

      boid.geometry.position.x = boid.x;
      boid.geometry.position.y = boid.y;
      boid.geometry.position.z = boid.z;
      boid.geometry.lookAt(oldPos);

      // if(i==0){
      //   console.log(boid.x, boid.y, boid.z);
      // }
    }
  };

  var renderLights = function(){
    var time = Date.now() * 0.00025;
    var z = 20, d = 100;

    // light1.position.x = Math.sin( time * 1.7 ) * d * 3;
    // light1.position.z = Math.cos( time * 0.3 ) * d - d*2;

    // light2.position.x = Math.cos( time * 1.3 ) * d * 3;
    // light2.position.z = Math.sin( time * 0.7 ) * d - d*6;

    // light3.position.x = Math.sin( time * 1.5 ) * d * 3;
    // light3.position.z = Math.sin( time * 0.5 ) * d - d*10;

    light1.position.x = Math.cos( time*1.7) * d * 4+1;
    light1.position.z = Math.sin( time*1.7 ) * d * 2+1;
    light2.position.x = Math.cos( time*1.3 ) * d * 8+1;
    light2.position.z = Math.sin( time*1.3 ) * d * 4+1;
    light3.position.x = Math.cos( time*1.5 ) * d * 10+1;
    light3.position.z = Math.sin( time*1.5 ) * d * 6+1;
    light5.position.x = Math.cos( time*1.0 ) * d * 12+1;
    light5.position.z = Math.sin( time*1.0 ) * d * 8+1;
    light6.position.x = Math.cos( time*1.2 ) * d * 14+1;
    light6.position.z = Math.sin( time*1.2 ) * d * 10+1;

    light4.position.x = 0;
    light4.position.y = 300;
    light4.position.z = 100;

    // if(dimLights){
    //   light1.distance = Math.max(light1.distance - maxLightDist/120, minLightDist);
    // } else {
    //   light1.distance = Math.min(light1.distance + maxLightDist/15, maxLightDist);
    // }
    //
    // light2.distance = light1.distance;
    // light3.distance = light1.distance;
    // light4.distance = light1.distance;
    // light5.distance = light1.distance;
    // light6.distance = light1.distance;

    var intensity = 0;
    if(intensities.length){
      for(var i=0; i<intensities.length; i++){
        intensity += intensities[i];
      }
      intensity /= intensities.length;
      intensities = [];
      lastIntensity = intensity;
    } else {
      intensity = lastIntensity;
    }

    var speed = 25;
    if(light1.distance < intensity){
      light1.distance = Math.min(light1.distance + speed, intensity);
    } else {
      light1.distance = Math.max(light1.distance - speed, intensity);
    }
    light2.distance = light1.distance;
    light3.distance = light1.distance;
    light4.distance = light1.distance;
    light5.distance = light1.distance;
    light6.distance = light1.distance;

    var oldPos = {
      x: largeFish.position.x,
      y: largeFish.position.y,
      z: largeFish.position.z
    };
    largeFish.position.x = Math.cos(time) * d*4+1;
    largeFish.position.z = Math.sin(time) * d*4+1;
    largeFish.lookAt(oldPos);
  };

  var setLight = function(intensity){
    intensity = (maxLightDist - minLightDist) * intensity + minLightDist;
    intensities.push(intensity);
  };

  var render = function() {
      requestAnimationFrame(render);

      var t = clock.getElapsedTime();

      renderFish();
      renderLights();

      if(stats){
        stats.update();
      }

      //renderer.render(scene, camera);
      controls.update(clock.getDelta());
      oculusControl.update(clock.getDelta());
      oculusEffect.render(scene, camera);
  };

  var init = function(){
    var WIN_WIDTH = window.innerWidth,
        WIN_HEIGHT = window.innerHeight,
        VIEW_ANGLE = 50,
        ASPECT = WIN_WIDTH / WIN_HEIGHT,
        NEAR = 1,
        FAR = 3000;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x040306, 10, FAR);

    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.set(0, 0, 100);

    renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setClearColor( scene.fog.color, 1 );
    renderer.setSize(WIN_WIDTH, WIN_HEIGHT);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    oculusEffect = new THREE.OculusRiftEffect(renderer, { worldScale: 1 });
    oculusEffect.setSize(window.innerWidth, window.innerHeight);

    controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 4000;
    controls.lookSpeed = 3.0;
    controls.lookVertical = true;

    oculusControl = new THREE.OculusControls(camera);

    document.body.appendChild(renderer.domElement);

    // var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    // hemiLight.color.setHSL( 0.6, 1, 0.6 );
    // hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    // hemiLight.position.set( 0, 500, 0 );
    // scene.add( hemiLight );

    if(showStats){
      stats = new Stats();
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '0px';
      document.body.appendChild(stats.domElement);
    }

    scene.add(camera);

    var texture = THREE.ImageUtils.loadTexture( "img/textures/disturb4.jpg" );
    texture.repeat.set( 20, 10 );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.format = THREE.RGBFormat;

    var textureTop = THREE.ImageUtils.loadTexture( "img/textures/disturb5.jpg" );
    textureTop.repeat.set( 20, 10 );
    textureTop.wrapS = textureTop.wrapT = THREE.RepeatWrapping;
    textureTop.format = THREE.RGBFormat;

    // MATERIALS
    var groundMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, ambient: 0x444444, map: texture } );
    var waterMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, ambient: 0x444444, map: texture } );

    // GROUND
    var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 5000, 5000, 2, 2 ), groundMaterial );
    mesh.position.y = -200;
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);

    var meshTop = new THREE.Mesh( new THREE.PlaneGeometry( 5000, 5000, 2, 2 ), waterMaterial );
    meshTop.position.y = 500;
    meshTop.rotation.x = Math.PI / 2;
    scene.add(meshTop);

    var intensity = 2.5;
    var c1 = 0xf2f2f2;
    //var c1 = 0xff0040, c2 = 0x0040ff, c3 = 0x80ff80, c4 = 0xffaa00, c5 = 0x00ffaa, c6 = 0xff1100;
    //var c1 = 0xffffff, c2 = 0xffffff, c3 = 0xffffff, c4 = 0xffffff, c5 = 0xffffff, c6 = 0xffffff;

    light1 = new THREE.PointLight( c1, intensity, minLightDist );
    scene.add( light1 );
    light1.position.y = -125;
    light2 = new THREE.PointLight( c1, intensity, minLightDist );
    scene.add( light2 );
    light2.position.y = -125;
    light3 = new THREE.PointLight( c1, intensity, minLightDist );
    scene.add( light3 );
    light3.position.y = -125;
    light4 = new THREE.PointLight( c1, intensity, minLightDist );
    scene.add( light4 );
    light4.position.y = 300;
    light5 = new THREE.PointLight( c1, intensity, minLightDist );
    scene.add( light5 );
    light5.position.y = -125;
    light6 = new THREE.PointLight( c1, intensity, minLightDist );
    scene.add( light6 );
    light6.position.y = -125;

    var dlight = new THREE.DirectionalLight( 0xffffff, 0.1 );
    dlight.position.set(0.5, -1, 0).normalize();
    scene.add(dlight);

    var sphere = new THREE.SphereGeometry(1, 43, 21);

    var l1 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
    l1.position = light1.position;
    scene.add(l1);
    var l2 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
    l2.position = light2.position;
    scene.add(l2);
    var l3 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
    l3.position = light3.position;
    scene.add(l3);
    var l6 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
    l6.position = light6.position;
    scene.add(l6);
    var l5 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
    l5.position = light5.position;
    scene.add(l5);
    // var l4 = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
    // l4.position = light4.position;
    // scene.add(l4);

    var loader = new THREE.JSONLoader();
    loader.load('models/clownfish.js', function (geometry, materials) {
      var material = new THREE.MeshPhongMaterial({
        color: 0x0071c5,
        shininess: 1000,
        shading: THREE.FlatShading
      });

      for(var i=0; i<numBoids; i++){
        boids[i].geometry = new THREE.Mesh(geometry, material);

        boids[i].geometry.receiveShadow = true;
        boids[i].geometry.castShadow = true;
        boids[i].geometry.position.x = boids[i].x;
        boids[i].geometry.position.y = boids[i].y;
        boids[i].geometry.position.z = boids[i].z;
        boids[i].geometry.material.transparent = true;
        boids[i].geometry.scale.set(.825, .825, .825);

        scene.add(boids[i].geometry);
      }

      largeFish = new THREE.Mesh(geometry, material);
      largeFish.receiveShadow = true;
      largeFish.castShadow = true;
      largeFish.position.x = 0;
      largeFish.position.y = 100;
      largeFish.position.z = 300;
      largeFish.material.transparent = true;
      largeFish.scale.set(5, 5, 5);

      scene.add(largeFish);

      oculusControl.connect();
      render();
    });

    window.addEventListener('resize', onWindowResize, false);

    $(window).on('mousedown', function(){
      dimLights = false;
    });

    $(window).on('mouseup', function(){
      dimLights = true;
    });

    window.setLight = setLight;
  };

  init();
})(jQuery);
