//
// circle_physics.js (CLIENT)
// C style library of round body physics functions


// Custom Namespace
var PHYSICS = {};


// Vector2 Utilities
PHYSICS.v2 = function(x, y)
{
    this.x = x;
    this.y = y;
}

PHYSICS.v2_sum = function(v2_a, v2_b)
{
    return {x: v2_a.x + v2_b.x, y: v2_a.y + v2_b.y};
}

PHYSICS.v2_difference = function(v2_a, v2_b)
{
    return {x: v2_a.x - v2_b.x, y: v2_a.y - v2_b.y};
}

PHYSICS.v2_magnitude = function(v2_a)
{
    return Math.sqrt(Math.pow(v2_a.x, 2) + Math.pow(v2_a.y, 2));
}

PHYSICS.v2_dot_product = function(v2_a, v2_b)
{
    return v2_a.x * v2_b.x + v2_a.y * v2_b.y;
}

PHYSICS.v2_cross_product = function(v2_a, v2_b)
{
    return (v2_a.x * v2_b.y) - (v2_a.y * v2_b.x);
}

PHYSICS.v2_normalize = function(v2_a)
{
    var magnitude = PHYSICS.v2_magnitude(v2_a);
    if(magnitude == 0)
    {
      return {x: 0, y: 0};
    }
    return {x: v2_a.x / magnitude, y: v2_a.y / magnitude};
}

// Mathematical functions
PHYSICS.PythagoreanSolve = function(a, b)
{
    return Math.sqrt(a * a + b * b);
}

PHYSICS.QuadSolve = function(a, b, c)
{
    //var x1 =-b/2/a+Math.pow(Math.pow(b,2)-4*a*c,0.5)/2/a;
    //var x2 =-b/2/a-Math.pow(Math.pow(b,2)-4*a*c,0.5)/2/a;
    var x1 = (-b + Math.sqrt((b * b) + (-4 * a * c))) / (2 * a);
    var x2 = (-b - Math.sqrt((b * b) + (-4 * a * c))) / (2 * a);
    return {x1: x1, x2: x2};
}

// Physics types
PHYSICS.AABB = function(v2_min, v2_max)
{
    this.min = v2_min;
    this.max = v2_max;
}

PHYSICS.Circle = function(radius, v2_position)
{
    this.radius = radius;
    this.position = v2_position;
}

PHYSICS.Object = function(v2_velocity, restitution, mass)
{
    this.velocity = v2_velocity;
    this.restitution = restitution;
    this.mass = mass;
}

PHYSICS.CircleObject = function(v2_velocity, restitution, mass, staticFriction, dynamicFriction, radius, v2_position)
{
    this.velocity = v2_velocity;
    this.restitution = restitution;
    this.mass = mass;
    this.staticFriction = staticFriction;
    this.dynamicFriction = dynamicFriction;
    this.radius = radius;
    this.position = position;
}

// Only for circles
PHYSICS.Manifold = function(circobj_a, circobj_b, penetration, v2_normal)
{
    this.a = circobj_a;
    this.b = circobj_b;
    this.penetration = penetration;
    this.normal = v2_normal;
}

// PHYSICS FUNCTIONS:
PHYSICS.Distance = function(v2_a, v2_b)
{
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

PHYSICS.AABBvsAABB = function(aabb_a, aabb_b)
{
  if(a.max.x < b.min.x || a.min.x > b.max.x) return false
  if(a.max.y < b.min.y || a.min.y > b.max.y) return false

  return true;
}

PHYSICS.CirclevsCircle_M = function(manifold)
{
    // CircleObjects
    var a = manifold.a;
    var b = manifold.b;

    var n = PHYSICS.v2_difference(b.position, a.position);

    var r = a.radius + b.radius;
    r *= r;

    if(Math.pow(PHYSICS.v2_magnitude(n), 2) > r)
      return false;

    var d = PHYSICS.v2_magnitude(n);

    if(d != 0)
    {
      manifold.penetration = r - d;
      manifold.normal = {x: n.x / d, y: n.y / d};
      return true;
    }
    else
    {
      manifold.penetration = a.radius;
      manifold.normal = {x: 1, y: 0};
      return true;
    }
}

PHYSICS.CirclevsCircle = function(c_a, c_b)
{
  var r = c_a.radius + c_b.radius;
  r *= r;
  return r > ((c_a.position.x - c_b.position.x) * (c_a.position.x - c_b.position.x) + (c_a.position.y - c_b.position.y) * (c_a.position.y - c_b.position.y));
}

PHYSICS.ResolveCollision = function(manifold)
{
    var a = manifold.a;
    var b = manifold.b;

    var relativeVelocity = PHYSICS.v2_difference(b.velocity, a.velocity);

    var velocityAlongNormal = PHYSICS.v2_dot_product(relativeVelocity, manifold.normal);

    if(velocityAlongNormal > 0)
    {
      return;
    }

    var e = Math.min(a.restitution, b.restitution);

    var j = -(1 + e) * velocityAlongNormal;
    j /= 1 / a.mass + 1 / b.mass;

    var impulse = {x: manifold.normal.x * j, y: manifold.normal.y * j};
    a.velocity = PHYSICS.v2_difference(a.velocity, {x: impulse.x * 1 / a.mass, y: impulse.y * 1 / a.mass });
    b.velocity = PHYSICS.v2_sum(b.velocity, {x: impulse.x * 1 / b.mass, y: impulse.y * 1 / b.mass });


    // Friction

    relativeVelocity = PHYSICS.v2_difference(b.velocity, a.velocity);


    var dp = PHYSICS.v2_dot_product(relativeVelocity, manifold.normal);

    var tangent = PHYSICS.v2_difference(relativeVelocity, {x: dp * manifold.normal.x, y: dp * manifold.normal.y});
    tangent = PHYSICS.v2_normalize(tangent);

    var jt = -PHYSICS.v2_dot_product(relativeVelocity, tangent);
    jt = jt / (1 / a.mass + 1 / b.mass);
    //console.log(tangent.x);

    var mu = PHYSICS.PythagoreanSolve(a.staticFriction, b.staticFriction);

    var frictionImpulse;
    if(Math.abs(jt) < j * mu)
    {

      frictionImpulse = {x: jt * tangent.x, y: jt * tangent.y};
    }
    else
    {
      dynamicFriction = PHYSICS.PythagoreanSolve(a.dynamicFriction, b.dynamicFriction);

      frictionImpulse = {x: tangent.x * -j * dynamicFriction, y: tangent.y * -j * dynamicFriction};
    }

    // Apply friction
    a.velocity = PHYSICS.v2_difference(a.velocity, {x: 1 / a.mass * frictionImpulse.x, y: 1 / a.mass * frictionImpulse.y});
    b.velocity = PHYSICS.v2_sum(b.velocity, {x: 1 / b.mass * frictionImpulse.x, y: 1 / b.mass * frictionImpulse.y});

}

// Energy functions
PHYSICS.CalculateKineticEnergy = function(v2_velocity, mass)
{
  var velocitySquared = v2_dot_product(v2_velocity, v2_velocity);
  var kineticEnergy = 0.5 * mass * velocitySquared;
  return kineticEnergy;
}

PHYSICS.CalculateElasticPotentialEnergy = function(springConstant, springDisplacement)
{
    var elasticPotentialEnergy = 0.5 * springConstant * Math.pow(springDisplacement, 2);
    return elasticPotentialEnergy;
}
