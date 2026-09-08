// GARGANTUA — Schwarzschild Black Hole Raytracer
// GLSL sources: fullscreen ray pass (null-geodesic integration) + final composite.

export const RAY_VERT = /* glsl */`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const RAY_FRAG = /* glsl */`
precision highp float;

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCamPos;
uniform vec3  uCamTarget;
uniform float uFov;
uniform int   uSteps;
uniform float uRotSign;
uniform int   uDebug;
uniform float uDin;
uniform float uDout;
uniform float uDopMax;
uniform float uOpNear;
uniform float uOpFar;
uniform float uDiskBright;
uniform float uStarBright;
uniform float uSkyFloor;
uniform float uRotSpeed;

#define RS 1.0

// ---------------------------------------------------------------- noise -----
float hash1(vec3 p){
  p = fract(p*0.3183099 + vec3(0.10,0.17,0.13));
  p *= 17.0;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
}
vec3 hash3(vec3 p){
  p = fract(p*vec3(0.1031,0.1030,0.0973));
  p += dot(p, p.yxz+33.33);
  return fract((p.xxy+p.yxx)*p.zyx);
}
float vnoise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  float n000 = hash1(i);
  float n100 = hash1(i+vec3(1.0,0.0,0.0));
  float n010 = hash1(i+vec3(0.0,1.0,0.0));
  float n110 = hash1(i+vec3(1.0,1.0,0.0));
  float n001 = hash1(i+vec3(0.0,0.0,1.0));
  float n101 = hash1(i+vec3(1.0,0.0,1.0));
  float n011 = hash1(i+vec3(0.0,1.0,1.0));
  float n111 = hash1(i+vec3(1.0,1.0,1.0));
  return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
             mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
}
// five-octave value-noise FBM, frequency x2.03 + 11.3, amplitude halved from .5
float fbm(vec3 p){
  float v = 0.0;
  float a = 0.5;
  for(int i=0;i<5;i++){
    v += a*vnoise(p);
    p = p*2.03 + 11.3;
    a *= 0.5;
  }
  return v;
}

// ------------------------------------------------------ pseudo-blackbody ----
vec3 blackbody(float t){
  // deep ember → amber plasma → soft gold → pale blue-white
  vec3 c = mix(vec3(0.42,0.04,0.02), vec3(1.00,0.38,0.08), smoothstep(0.00,0.45,t));
  c = mix(c, vec3(1.00,0.72,0.32), smoothstep(0.40,0.85,t));
  c = mix(c, vec3(1.00,0.92,0.72), smoothstep(0.80,1.25,t));
  c = mix(c, vec3(0.78,0.88,1.20), smoothstep(1.20,1.95,t));
  return c;
}

// cool cosmic dust tint for outer nebula haze
vec3 cosmicDust(float t){
  return mix(vec3(0.18,0.08,0.32), vec3(0.55,0.28,0.42), smoothstep(0.0,1.0,t));
}

// ------------------------------------------------------------ star field ----
mat3 layerRot(float ay, float ax){
  float cy = cos(ay), sy = sin(ay), cx = cos(ax), sx = sin(ax);
  return mat3(cy,0.0,-sy,  sy*sx,cx,cy*sx,  sy*cx,-sx,cy*cx);
}
vec3 starLayer(vec3 d, float scale, float thresh, mat3 rot, float sharp){
  vec3 p = rot*d*scale;
  vec3 id = floor(p);
  vec3 f = fract(p);
  float h = hash1(id);
  if(h < thresh) return vec3(0.0);
  vec3 sp = 0.15 + 0.70*hash3(id + 4.7);
  float dist = length(f - sp);
  float star = exp(-dist*dist*sharp);
  float bright = (h - thresh)/(1.0 - thresh);
  bright *= bright;
  vec3 tint = mix(vec3(0.72,0.84,1.0), vec3(1.0,0.86,0.70), hash1(id + 13.1));
  return star*bright*tint*4.0;
}
vec3 heroStars(vec3 d){
  vec3 p = d*14.0;
  vec3 id = floor(p);
  vec3 f = fract(p);
  float h = hash1(id + 91.7);
  if(h < 0.9975) return vec3(0.0);
  vec3 sp = 0.20 + 0.60*hash3(id + 3.3);
  float dist = length(f - sp);
  float glow = exp(-dist*dist*22.0)*0.85 + exp(-dist*dist*240.0)*1.5;
  vec3 tint = mix(vec3(0.70,0.82,1.0), vec3(1.0,0.80,0.60), step(0.5, hash1(id + 5.5)));
  return glow*tint;
}
vec3 milkyway(vec3 d){
  vec3 n = normalize(vec3(0.25,1.0,0.15));
  float w = dot(d,n);
  float band = exp(-w*w*6.2);
  vec3 p = d*2.4;
  float cloud = fbm(p*1.25 + 5.2);
  float dust  = fbm(p*2.1 + 9.1);
  float bloom = fbm(p*0.7 + vec3(2.1, uTime*0.015, 4.4));
  vec3 col = mix(vec3(0.03,0.06,0.18), vec3(0.36,0.18,0.48), smoothstep(0.22,0.88,cloud));
  col = mix(col, vec3(0.55,0.22,0.28), smoothstep(0.55,0.95,bloom)*0.45);
  col *= band;
  col *= 1.0 - 0.55*smoothstep(0.40,0.88,dust);
  col *= 1.35;
  return col;
}
vec3 nebulaVeil(vec3 d){
  // large soft nebula patches drifting slowly behind the hole
  float n1 = fbm(d*1.8 + vec3(uTime*0.02, 0.4, 1.7));
  float n2 = fbm(d*3.1 + vec3(2.2, uTime*0.015, -1.1));
  float mask = smoothstep(0.42, 0.78, n1) * (0.55 + 0.45*n2);
  vec3 warm = vec3(0.55,0.22,0.12);
  vec3 cool = vec3(0.16,0.22,0.55);
  return mix(cool, warm, n2) * mask * 0.22;
}
vec3 background(vec3 d){
  vec3 col = uSkyFloor*vec3(0.08,0.10,0.24);
  col += milkyway(d);
  col += nebulaVeil(d);
  col += starLayer(d,  26.0, 0.952, layerRot(0.7,0.4), 120.0);
  col += starLayer(d,  47.0, 0.952, layerRot(2.1,1.1), 200.0);
  col += starLayer(d,  83.0, 0.952, layerRot(4.0,2.3), 320.0);
  col += starLayer(d, 150.0, 0.968, layerRot(5.3,0.9), 480.0);
  col += heroStars(d);
  return col*uStarBright;
}

// Schwarzschild null-geodesic acceleration (c = G = 1, RS = 1)
vec3 accAt(vec3 p, vec3 v){
  vec3 h = cross(p, v);
  float r2 = dot(p, p);
  return -1.5*RS*dot(h, h)/(r2*r2*sqrt(r2))*p;
}

// Accretion-disk plane crossing (multiple crossings permitted).
// Returns true when front-to-back opacity saturates (ray absorbed by disk).
bool diskCross(vec3 a, vec3 b, vec3 rayDir,
               inout vec3 col, inout float trans,
               inout float crossCount, inout float validCross,
               inout float firstAng, inout float crossRad, inout float turbDbg){
  if(a.y*b.y > 0.0) return false;
  float t = abs(a.y)/(abs(a.y) + abs(b.y) + 1e-5);
  vec3 q = mix(a, b, t);
  float qr = length(q.xz);
  crossCount += 1.0;
  if(qr <= uDin || qr >= uDout) return false;
  validCross += 1.0;
  float ang = atan(q.z, q.x);
  if(validCross < 1.5){ firstAng = ang; crossRad = qr; }

  // Novikov–Thorne style flux, ISCO = 3 RS
  float x = max(qr, 3.001);
  float flux = max(pow(x/3.0, -3.0)*(1.0 - sqrt(3.0/x)), 0.0);
  float temp = pow(flux*10.0, 0.25);

  // slow differential rotation — cinematic swirl, not racing lines
  float omega = uRotSign*0.55*uRotSpeed*pow(3.0/qr, 1.15);
  float rot = omega*uTime;
  float ca = cos(rot), sa = sin(rot);
  vec3 qp = vec3(ca*q.x + sa*q.z, 0.0, -sa*q.x + ca*q.z);
  vec2 rp = qp.xz/qr;

  // soft domain-warped nebula clouds (large scale) instead of streak lanes
  float breath = uTime * 0.08;
  vec3 base = vec3(rp.x*1.55, rp.y*1.55, qr*0.22 + breath);
  vec3 warp = vec3(
    fbm(base*0.9 + vec3(1.7, 0.2, breath*0.4)),
    fbm(base*0.9 + vec3(4.1, 2.8, -breath*0.3)),
    fbm(base*0.9 + vec3(7.2, -1.4, breath*0.2)));
  float clouds = fbm(base*1.35 + warp*1.8);
  float billow = fbm(base*2.4 + warp*1.1 + vec3(breath*0.6));
  float wisps  = fbm(base*3.6 + vec3(warp.y, breath, warp.x));

  // broad spiral arms from low-frequency angular structure
  float spiral = 0.5 + 0.5*sin(atan(rp.y, rp.x)*2.0 + qr*0.35 + warp.x*2.4 + breath*0.5);
  spiral = smoothstep(0.25, 0.85, spiral);

  float innerHot = 1.0 - smoothstep(3.2, 11.0, qr);
  float outerSoft = smoothstep(8.0, 22.0, qr);

  // soft plasma field — no high-frequency line streaks
  float plasma = mix(0.62, 1.0, clouds);
  plasma *= mix(0.85, 1.18, billow);
  plasma *= mix(0.92, 1.08, wisps);
  plasma *= mix(0.78, 1.22, spiral);
  plasma = mix(plasma, 0.95 + 0.15*clouds, outerSoft);
  turbDbg = plasma;

  float radialGain = mix(0.55, 1.05, innerHot) * mix(1.0, 0.72, outerSoft);
  float I = flux*7.4*plasma*radialGain;
  I += exp(-pow((qr-3.15)*2.4, 2.0))*1.8;                 // soft ISCO bloom
  I += exp(-pow((qr-6.5)*0.55, 2.0))*0.35*clouds;         // mid-disk glow pockets
  float outerFade = 1.0 - smoothstep(uDout-16.0, uDout, qr);
  I *= outerFade;

  // relativistic beaming + gravitational redshift
  float beta = sqrt(0.5/qr);
  float gamma = 1.0/sqrt(max(1.0 - beta*beta, 1e-4));
  vec3 tdir = normalize(vec3(-sin(ang), 0.0, cos(ang)))*uRotSign;
  float dop = 1.0/(gamma*(1.0 - dot(tdir*beta, rayDir)));
  dop = clamp(dop, 0.55, uDopMax);
  float g = sqrt(max(1.0 - RS/qr, 0.0));

  float tShade = temp*dop*g;
  vec3 hot = blackbody(tShade);
  vec3 dust = cosmicDust(clouds);
  vec3 dcol = mix(hot, mix(hot, dust, 0.55), outerSoft*0.7);
  // milder beaming so the approaching side keeps structure (not blown white)
  float beam = mix(1.0, dop*dop, 0.72);
  dcol *= I * beam * g * uDiskBright;
  // faint cool corona rim on the outer disk
  dcol += dust * outerSoft * clouds * 0.22 * outerFade * uDiskBright;

  float alpha = mix(uOpFar*0.88, uOpNear, 1.0 - smoothstep(4.0, 14.0, qr)) * outerFade;
  alpha *= mix(0.9, 1.05, smoothstep(0.35, 0.8, plasma));
  col += trans * alpha * dcol;
  trans *= 1.0 - alpha;
  if(trans < 0.02){ trans = 0.0; return true; }
  return false;
}

// ------------------------------------------------------------------ main ----
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;
  vec3 ro = uCamPos;
  vec3 ww = normalize(uCamTarget - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0,1.0,0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(p.x*uu + p.y*vv + uFov*ww);

  vec3 pos = ro;
  vec3 vel = rd;
  vec3 col = vec3(0.0);              // disk accumulator (front-to-back)
  vec3 haloCol = vec3(0.0);          // volumetric halo (dropped if captured)
  float trans = 1.0;
  float minR = 1e5;
  float lastR = length(ro);
  int   stepsUsed = 0;
  float crossCount = 0.0;
  float validCross = 0.0;
  float firstAng = 0.0;
  float crossRad = 0.0;
  float turbDbg = 0.0;

  for(int i=0;i<600;i++){
    if(i >= uSteps) break;
    float r = length(pos);
    lastR = r;
    if(r < 1.03*RS){ trans = 0.0; break; }                 // event horizon
    if(r > 45.0 && dot(pos,vel) > 0.0){ break; }           // escaped
    stepsUsed = i + 1;
    minR = min(minR, r);

    float dt = max(0.012, r*mix(0.02, 0.06, smoothstep(6.0, 20.0, r)));

    // thin volumetric corona — keep structure visible on both sides
    float absY = abs(pos.y);
    if(absY < 0.55 && r > uDin && r < uDout){
      float dens = exp(-absY*26.0)*0.022*(1.0 - smoothstep(10.0, uDout-1.0, r));
      float xh = max(r, 3.001);
      float fluxh = max(pow(xh/3.0, -3.0)*(1.0 - sqrt(3.0/xh)), 0.0);
      float angH = atan(pos.z, pos.x);
      float swirl = fbm(vec3(cos(angH)*1.2, sin(angH)*1.2, r*0.18 + uTime*0.05));
      dens *= 0.75 + 0.4*swirl;
      vec3 glowc = blackbody(pow(fluxh*10.0, 0.25)*0.85);
      vec3 cool = cosmicDust(swirl);
      vec3 haze = mix(glowc, cool, smoothstep(7.0, 18.0, r)*0.4);
      haloCol += trans * haze * (fluxh*2.4) * dens * dt * uDiskBright;
    }

    if(r < 4.4){
      // near-critical refinement: two fixed half-substeps with midpoint
      // acceleration (RK2); total advancement still matches baseDt and the
      // outer uSteps budget is unchanged
      float hdt = dt*0.5;
      bool absorbed = false;
      for(int s = 0; s < 2; s++){
        vec3 k1 = accAt(pos, vel);
        vec3 pm = pos + vel*(hdt*0.5);
        vec3 vm = normalize(vel + k1*(hdt*0.5));
        vec3 k2 = accAt(pm, vm);
        vec3 pn = pos + vm*hdt;
        vel = normalize(vel + k2*hdt);
        if(diskCross(pos, pn, vel, col, trans, crossCount, validCross, firstAng, crossRad, turbDbg)){
          absorbed = true;
        }
        pos = pn;
        minR = min(minR, length(pos));
      }
      if(absorbed) break;
    }else{
      vel = normalize(vel + accAt(pos, vel)*dt);
      vec3 npos = pos + vel*dt;
      if(diskCross(pos, npos, vel, col, trans, crossCount, validCross, firstAng, crossRad, turbDbg)){
        pos = npos;
        break;
      }
      pos = npos;
    }
  }

  // lensed background sampled only in the final escape direction.
  // Budget-exhausted rays keep trans and contribute continuously dimmed
  // deep-well light (spec §7.5); halo counts for non-captured rays and is
  // dimmed by the same factor, so the horizon itself stays pure black.
  vec3 bgAdd = vec3(0.0);
  if(trans > 0.0){
    float deep = clamp((lastR-1.03)*0.45, 0.45, 1.0);
    col += haloCol * deep;
    bgAdd = trans * background(vel) * deep;
  }
  // photon ring — soft critical curve, kept modest so bloom doesn't blow out
  vec3 ringAdd = vec3(1.0,0.90,0.72) * exp(-pow((minR-1.55)*3.6, 2.0)) * 0.045;

  vec3 outCol;
  if(uDebug == 1){                       // disk / halo only
    outCol = col;
  }else if(uDebug == 2){                 // lensed background only
    outCol = bgAdd;
  }else if(uDebug == 3){                 // step usage
    outCol = vec3(float(stepsUsed)/float(max(uSteps,1)));
  }else if(uDebug == 4){                 // first-crossing radius map
    float v = clamp(crossRad/max(uDout,1e-3), 0.0, 1.0);
    outCol = (validCross > 0.5) ? vec3(v, v*(1.0-v)*2.4, 1.0-v) : vec3(0.0);
  }else if(uDebug == 5){                 // raw turbulence
    outCol = vec3(clamp(turbDbg, 0.0, 1.0));
  }else if(uDebug == 6){                 // minR (red) / crossing count (green)
    outCol = vec3(clamp(minR/12.0,0.0,1.0), clamp(crossCount/4.0,0.0,1.0), 0.0);
  }else if(uDebug == 7){                 // valid crossing count
    if(validCross < 0.5)      outCol = vec3(0.0);
    else if(validCross < 1.5) outCol = vec3(0.0,0.0,1.0);
    else if(validCross < 2.5) outCol = vec3(0.0,1.0,0.0);
    else                      outCol = vec3(1.0,0.0,0.0);
  }else if(uDebug == 8){                 // three-phase sine of first crossing angle
    outCol = (validCross > 0.5)
      ? 0.5 + 0.5*sin(firstAng + vec3(0.0, 2.0944, 4.1888))
      : vec3(0.0);
  }else if(uDebug == 9){                 // crossing-radius bands
    float band = mod(floor(crossRad), 2.0);
    outCol = (validCross > 0.5)
      ? mix(vec3(0.05,0.15,0.45), vec3(0.95,0.55,0.15), band)
      : vec3(0.0);
  }else{                                 // 0 — normal
    outCol = col + bgAdd + ringAdd;
  }

  outCol = clamp(max(outCol, vec3(0.0)), vec3(0.0), vec3(64.0));
  gl_FragColor = vec4(outCol, 1.0);
}
`;

export const COMPOSITE_VERT = /* glsl */`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const COMPOSITE_FRAG = /* glsl */`
precision highp float;

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2  uRes;
uniform float uTime;
uniform float uVignette;
uniform float uGrain;
uniform float uCA;

vec3 aces(vec3 x){
  return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0);
}
float ghash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453);
}
void main(){
  vec2 uv = vUv;
  vec2 dir = uv - 0.5;

  // chromatic aberration (radial, R/B symmetric)
  float ca = uCA*dot(dir, dir);
  vec3 col;
  col.r = texture2D(tDiffuse, uv + dir*ca).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - dir*ca).b;

  // manual ACES (renderer tone mapping stays OFF)
  col *= 0.82;
  col = aces(col);

  // aspect-aware vignette
  float aspect = uRes.x/max(uRes.y, 1.0);
  float vig = smoothstep(1.30, 0.30, length(dir*vec2(aspect, 1.0))*1.15);
  col *= mix(1.0, vig, uVignette);

  // animated fine grain, centered [-.5,.5]
  float g = ghash(gl_FragCoord.xy + fract(uTime*13.7)*97.0) - 0.5;
  col += g*uGrain*(1.0 - 0.5*col);

  gl_FragColor = vec4(col, 1.0);
}
`;
