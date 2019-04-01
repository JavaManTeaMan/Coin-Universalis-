//
// game.js (CLIENT)

/*
var socket = io();
var SocketId = JSON.parse(sessionStorage.getItem('S_SocketId'));
var GameId = JSON.parse(sessionStorage.getItem('S_GameId'));
var PlayerName = sessionStorage.getItem('S_PlayerName');

// Kindly log all globals just decoded...
console.log("GameId: " + GameId);
console.log("SocketId: " + SocketId);
console.log("Player Name: " + PlayerName);
*/

// Send a start_game_response_response packet (will update the sockets)
// not needed -> socket.emit('start_game_response_response', {connectedStatus: true});
// NOTE: Just make sure that if only 1 player is remaining (connected), then they win

// TODO: Resize event listener

// Hide scrollbars
document.documentElement.style.overflow = 'hidden';

// Disable scroll bars
//$("body").css("overflow", "hidden");
//$("body").css("overflow", "auto");

var TRIVIAL = 0.1;
var FRICTION = 0.1;
var FRICTION_RESISTANCE = 0.9;

// RENDER CONSTS
var RENDER_RAW = "render_raw";
var RENDER_TEXTURE = "render_texture";

// CONSTS
var WIDTH = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

// PIXI:
// TODO: make our own canvas and bind to view?
// TODO: make sure that chrome-detection is on (anti-aliasing only on chrome!)
var	renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT, {antialias: true});
document.body.appendChild(renderer.view);


//
// Main container
var stage = new PIXI.Container();

//TODO: Make a HUD container, and a WORLD OBJECT container!!!
var hud = new PIXI.Container();
var world = new PIXI.Container();

// all this goes into WORLD OBJECT CONTAINER
// Containers to manage z-order
var mainCoinContainer = new PIXI.Container();
var ghostCoinContainer = new PIXI.Container();
var pinContainer = new PIXI.Container();
var fieldContainer = new PIXI.Container();

// Graphics container to manage zOrder
var graphics = new PIXI.Graphics();
var graphicsContainer = new PIXI.Container();
graphicsContainer.addChild(graphics);

// Graphics for the field
var fieldGraphics = new PIXI.Graphics();
fieldContainer.addChild(fieldGraphics);

// NOTE: Make ghostCoinContainer and pinContainer in the same container?
pinContainer.zIndex = 20;
graphicsContainer.zIndex = 15;
ghostCoinContainer.zIndex = 10;
mainCoinContainer.zIndex = 5;
fieldContainer.zIndex = 2;

// Add containers (order really only matters here)
world.addChild(fieldContainer);
world.addChild(mainCoinContainer);
world.addChild(ghostCoinContainer);
world.addChild(graphicsContainer);
world.addChild(pinContainer);


// Add graphics to hud as well (text)
//var hudGraphics = new PIXI.Graphics();
//var hudGraphicsContainer = new PIXI.Container();
//hudGraphicsContainer.addChild(hudGraphics);

//hud.addChild(graphicsContainer);

// Add hud and world to stage
hud.zIndex = 20;
world.zIndex = 5;


stage.addChild(hud);
stage.addChild(world);


// 2D CAMERA
var cam;

// Input
//var mousePosition = renderer.interaction.mouse.global;
// TODO: make sure the mouseposition in the coin class actually uses this
var MousePosition;

var TEXTURES_ON = true;

var playerCoin;
var PlayerCount;

// Global coins
var	COIN_LIST = [];

// Player Coins
var PLAYER_COIN_LIST = [];


// Test Coins
var testCoin;
var testCoin2;
var testCoin3;

// Call init
init();

// on a steel table (frictions):
//var COIN_TYPES =
//{
	//QUARTER: {radius: 75, restitution: 0.9, mass: 1, staticFriction: 0.72, dynamicFriction: 0.40, id: "q", speed: 2, color: 0xb7baae, texturePath: "/client/res/textures/clipart/clipart_quarter_texture.png"},
	var QUARTER = {radius: 75, restitution: 0.9, mass: 1, staticFriction: 0.72, dynamicFriction: 0.40, id: "q", speed: 2, color: 0xb7baae, texturePath: "/client/res/textures/clipart/clipart_quarter_texture.png", alphaTexturePath: "/client/res/textures/clipart/alpha/clipart_quarter_texture_alpha.png" };
	var NICKEL = {radius: 50,  restitution: 1.0, mass: 0.5, staticFriction: 0.70, dynamicFriction: 0.38, id: "n", speed: 4, color: 0x959693, texturePath: "/client/res/textures/clipart/clipart_nickel_texture.png", alphaTexturePath: "/client/res/textures/clipart/alpha/clipart_nickel_texture_alpha.png" };
	var PENNY = {radius: 30,  restitution: 1.1, mass: 0.3, staticFriction: 0.54, dynamicFriction: 0.39, id: "p", speed: 6, color: 0xad6f69, texturePath: "/client/res/textures/clipart/clipart_penny_texture.png", alphaTexturePath: "/client/res/textures/clipart/alpha/clipart_penny_texture_alpha.png" };
//};

// TODO: ADD A PLAYER PARAMETER
function Coin(coinType, v2_position, v2_velocity, field, /* PIXI VARS */ mainCoinContainer, pinContainer, ghostCoinContainer, world, renderer, graphicsContainer)
{
	// CONSTRUCTOR:

	// Main Coin
	this.coinType = coinType;

	this.position = v2_position; // Center position
	this.velocity = v2_velocity;
	this.accel = {x: 0, y: 0};
	this.lastAccel = {x: 0, y: 0};
	this.newAccel = {x: 0, y: 0};
	this.avgAccel = {x: 0, y: 0};
	this.force = {x: 0, y: 0};


	this.renderer = renderer;

	// Create texture and sprite
	this.texture = PIXI.Texture.fromImage(coinType.texturePath);
	this.alphaTexture = PIXI.Texture.fromImage(coinType.alphaTexturePath);

	// // -> DISABLE: TODO: MAKE SURE TO CHANGE THIS BACK TO this.texture
	this.sprite = new PIXI.Sprite(this.texture);
	this.alphaSprite = new PIXI.Sprite(this.alphaTexture);

	this.mainSpriteContainer = new PIXI.Container();
	this.mainSpriteContainer.addChild(this.sprite);
	//this.mainSpriteContainer.addChild(this.alphaSprite);


	// field

	this.field = field;

/////////////////////////////////////////////////////
	mainCoinContainer.addChild(this.mainSpriteContainer);
/////////////////////////////////////////////////////

	// Set sprite scale
	this.sprite.width = coinType.radius * 2;
	this.sprite.height = coinType.radius * 2;

	this.alphaSprite.width = coinType.radius * 2;
	this.alphaSprite.height = coinType.radius * 2;

	//this.sprite.tint = 0x654321;

	// Make sprite interactive (input)
	this.sprite.interactive = true;

	// Make sprite return its parent coin
	var parent = this;
	//this.sprite.parent = parent;

	this.sprite.getParentCoin = function()
	{
		return parent;
	};

	// Input:
	this.onMouseDown = function(eventData)
	{
			//console.log("mousedown");
			// TODO:  MAKE SURE SLINGSHOT CAN BE MADE
			/*
			this.isSlingshot = true;
			this.sprite.tint = 0x654321;
			//this.renderSlingShot = true;
			this.isMouseDown = true;
			console.log("mouseDOWN");
			*/
			var parent = this.getParentCoin();
			//console.log(parent.coinType);

			// NOTE: THIS IS WHERE YOU CHECK TO TOGGLE SLINGSHOT

			//if(parent.velocity.x == 0 && parent.velocity.y == 0 && parent.isSlingshot == false)
			if(true)
			{
				parent.isSlingshot = true;
			}

			// TODO: MAKE A CANCEL FEATURE TO CANCEL SLINGSHOT
		}

	this.onMouseUp = function(eventData)
	{
			//console.log("mouseup");
			//this.isMouseDown = false;
			//this.isSlingshot = false;
			//this.renderSlingShot = false;
			//console.log("mouseUP");

			var parent = this.getParentCoin();

			// NOTE: THIS IS WHERE YOU CHECK TO TOGGLE SLINGSHOT


			//if(parent.velocity.x == 0 && parent.velocity.y == 0 && parent.isSlingshot == true) // TODO: is this check needed?
			if(true)
			{

				// Set coin position to ghost coins position
				parent.position = parent.slingShotPoints.coinCenters.ghostCoin;


				// Cancel slingshot (make ghost coin, bands, and pins disappear)
				parent.isSlingshot = false;

				// Set coin velocity to travelDirection

				// Force(spring) = springConstant * stretch
				var p = parent.slingshotStiffness * parent.slingShotPoints.releaseInfo.releaseMagnitude;
				parent.velocity = {x: parent.slingShotPoints.releaseInfo.releaseDirection.x * p / parent.coinType.mass,
					y: parent.slingShotPoints.releaseInfo.releaseDirection.y * p / parent.coinType.mass};


			}

	}

	// Set up SPRITE INPUT

	//this.sprite.mousedown = this.onMouseDown;

	//this.sprite.mouseup =this.onMouseUp;

	//this.sprite.mouseupoutside = this.onMouseUp;

	this.sprite.on('mousedown', this.onMouseDown)
						 .on('mouseup', this.onMouseUp)
						 .on('mouseupoutside', this.onMouseUp);

	//this.sprite.addEventListener('click', function(e) { });

/////////////////////////////////////////////////////////////////
	// Pin(s):
	// Set scale
	this.pinWidth = 10;
	this.pinHeight = 10;

	this.pin1_position = { x: 0, y: 0 };
	this.pin2_position = { x: 0, y: 0 };

	// Pin Sprite Container
	this.pinSpriteContainer = new PIXI.Container();

	// Sprites if RENDER_TEXTURE ***
	this.pinTexture = PIXI.Texture.fromImage("/client/res/textures/pins/pin_1.png");

	this.pinSprite1 = new PIXI.Sprite(this.pinTexture);
	this.pinSprite2 = new PIXI.Sprite(this.pinTexture);

	// Set Sprite properties
	this.pinSprite1.width = this.pinWidth;
	this.pinSprite1.height = this.pinHeight;

	this.pinSprite2.width = this.pinWidth;
	this.pinSprite2.height = this.pinHeight;

	this.pinSpriteContainer.addChild(this.pinSprite1);
	this.pinSpriteContainer.addChild(this.pinSprite2);

	// Graphics if RENDER_RAW ***
	this.pinGraphics = new PIXI.Graphics();

	this.pinColor = 0xff0000;

	this.pinSpriteContainer.addChild(this.pinGraphics);

	// Render method
	this.pin_render_method = RENDER_RAW;

///////////////////////////////////////////////////
	// Add pins to pinContainer
	// TODO: MAKE THIS OUTSIDE CLASS
	//pinContainer.addChild(this.pinSprite1);
	//pinContainer.addChild(this.pinSprite2);
	pinContainer.addChild(this.pinSpriteContainer);
///////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
	// Ghost coin:
	this.ghostCoinSprite = new PIXI.Sprite(this.texture);
	this.ghostCoinSpriteContainer = new PIXI.Container();

	this.ghostCoinSpriteContainer.addChild(this.ghostCoinSprite);

	ghostCoinContainer.addChild(this.ghostCoinSpriteContainer);

	// Slingshot Graphics
	//this.graphicsContainer = graphicsContainer;
	this.graphics = new PIXI.Graphics();

	this.graphicsContainer = new PIXI.Container();
	this.graphicsContainer.addChild(this.graphics);

	graphicsContainer.addChild(this.graphicsContainer);

// TODO: MAKE THIS OUTSIDE CLASS
///////////////////////////////////////////
//stage.addChild(this.graphics);
////////////////////////////////////////////
	this.ghostCoinSprite.width = coinType.radius * 2;
	this.ghostCoinSprite.height = coinType.radius * 2;

	this.ghostCoinSprite.position.x = this.sprite.position.x;
	this.ghostCoinSprite.position.y = this.sprite.position.y;



/////////////////////////////////////////////////////////////////

	// Slingshot variables
	// Slingshot physics
	//this.slantOffset = 10;
	this.isSlingshot = false;

// NOTE: MODIFY THIS SPRING CONSTANT TO CHANGE ELASTIC THE BAND IS
	this.slingshotSpringConstant = 0.0025;

	//this matters
	this.slingshotStiffness = 2.5;

	this.slingshotPinDistance = this.coinType.radius * 3;
	this.slingshotMaximumDraw = this.slingshotPinDistance * 2;

	this.slingshotSpeed = -100;

	//this.renderSlingShot = false;
	this.slingShotPoints;

	//this.isMouseDown = false;

	// Slingshot debugging
	this.renderSlingShotBarebones = false;

/////////////////////////////////////////////////////////////////
	this.init_pixi_procedure = function(mainCoinContainer, pinContainer, ghostCoinContainer, stage, renderer)
	{

			//mainCoinContainer.addChild(this.sprite);

			//pinContainer.addChild(this.pinSprite1);
			//pinContainer.addChild(this.pinSprite2);

			// ghostCoinContainer

		//	stage.addChild(this.graphics);

			//this.renderer = renderer;
	};


	this.updateSlingshot = function()
	{
		//stage.addChild(this.ghostCoinSprite);
		/*
			var a = 2;
			var b = -4 * this.position.x;
			var z = -1 * ((renderer.plugins.interaction.mouse.global.x - this.position.x) / (renderer.plugins.interaction.mouse.global.y - this.position.y));
			var c = (2 * this.position.x * this.position.x) - ((this.coinType.radius * this.coinType.radius	) / (z * z));
			var coinIntersect = PHYSICS.QuadSolve(a, b, c);
			console.log(coinIntersect.x1, coinIntersect.x2);
			var y1 = z * (coinIntersect.x1 - this.position.x) + this.position.y;
			var y2 = z * (coinIntersect.x2 - this.position.x) + this.position.y;
		*/


			//var mousePosition = {x: stage.toLocal(this.renderer.plugins.interaction.mouse.global.x), y: this.renderer.plugins.interaction.mouse.global.y};
			// TODO: Move this to update
			var mousePosition =  stage.toLocal(this.renderer.plugins.interaction.mouse.global);

			// TODO: Make the field have some beginning so 0 is not necessary here
if(true)
{
if(true)
		{
			//console.log(this.position.x + "  |  ");
			//console.log((this.position.y < this.field.height-this.coinType.radius && this.position.y > 0+this.coinType.radius));
			//console.log("X: " + mousePosition.x + " |  Y:  " + mousePosition.y);
			var travel = PHYSICS.v2_difference({x: mousePosition.x, y: mousePosition.y}, {x: this.position.x, y: this.position.y});
			var travelMagnitude = PHYSICS.v2_magnitude(travel);
			var travelDirection = PHYSICS.v2_normalize(travel);

			var perpindicular = {x: travelDirection.y * (this.coinType.radius ), y: -travelDirection.x * (this.coinType.radius )};
			//var tangentPerpindicular = {x: travelDirection.y * (this.coinType.radius ), y: -travelDirection.x * (this.coinType.radius)};
			var perpindicularDirection = PHYSICS.v2_normalize(perpindicular);


			var p = PHYSICS.v2_sum(this.position, perpindicular);
			var q = PHYSICS.v2_difference(this.position, perpindicular);
			var r = PHYSICS.v2_sum(mousePosition, perpindicular);
			var s = PHYSICS.v2_difference(mousePosition, perpindicular);


			// Apply a slant offset to the pins (to make the slingshot bands non-parallel)
			// Slant offset will be the diameter (radius * 2) of each coin
			var slantOffset = this.slingshotPinDistance;

			var pin1Pos = {x: (p.x) + perpindicularDirection.x * slantOffset, y: (p.y) + perpindicularDirection.y * slantOffset};
			var pin2Pos = {x: (q.x) + -perpindicularDirection.x * slantOffset, y: (q.y) + -perpindicularDirection.y * slantOffset};

			// Standardize distances from center of ghost coin to arc positions (distance from ghost coin center to arc position going in the proper normalized direction)
			var arcOffset = this.coinType.radius * 100;
			var arc = {x: (mousePosition.x) + travelDirection.x * arcOffset, y: (mousePosition.y) + travelDirection.y * arcOffset};

			// Construct pin endpoints on coin
			/*
			var pinEnd1;
			var pinEnd2;

			var pin12cen = PHYSICS.v2_difference({x: mousePosition.x, y: mousePosition.y}, {x: pin1Pos.x, y: pin1Pos.y});
			var pin22cen = PHYSICS.v2_difference({x: mousePosition.x, y: mousePosition.y}, {x: pin2Pos.x, y: pin2Pos.y});

			var pin12cen_dir = PHYSICS.v2_normalize(pin12cen);
			var pin22cen_dir = PHYSICS.v2_normalize(pin22cen);

			var pin12cen_perp = {x: -pin12cen.y, y: pin12cen.x };
			var pin22cen_perp = {x: pin22cen.y, y: -pin22cen.x };

			var pin12cen_perp_dir = PHYSICS.v2_normalize(pin12cen_perp);
			var pin22cen_perp_dir = PHYSICS.v2_normalize(pin22cen_perp);

			var pin2cen_len = PHYSICS.v2_magnitude(pin12cen);
			var f = pin2cen_len / 2;

			var m1 = {x: pin1Pos.x + (pin12cen_dir.x * f), y: pin1Pos.y + (pin12cen_dir.y * f)};
			var m2 = {x: pin2Pos.x + (pin22cen_dir.x * f), y: pin2Pos.y + (pin22cen_dir.y * f)};

			//var alpha = 2 * Math.asin((this.coinType.radius / (pin2cen_len)));

		//	var t = {x: Math.cos(alpha) * f, y: Math.sin(alpha) * f};

			var m12cen = PHYSICS.v2_difference({x: mousePosition.x, y: mousePosition.y }, m1);
			var m12cen_perp = {x: -m12cen.y, y: m12cen.x};
			//pinEnd1 = {x: m1.x + (pin12cen_dir.x * t.x), y: m1.y};//m1.y + (pin12cen_perp_dir.y * t.y)};
			//pinEnd2 = {x: m2.x + (pin22cen_dir.x * t.x), y: m2.y};//m2.y + (pin22cen_perp_dir.y * t.y)};
			//pinEnd1 = {x: m1.x + (m12cen.x * (t.x / PHYSICS.magnitude(m12cen))), y: m1.y + (m12cen.y)}
			//var delta_x = t.x / PHYSICS.v2_magnitude(m12cen);
			//var delta_y = t.y / PHYSICS.v2_magnitude(m12cen_perp);

			//pinEnd1 = PHYSICS.v2_sum(m1, ({x: m12cen.x * delta_x, y: m12cen.y * delta_x}));
		//	pinEnd1 = PHYSICS.v2_sum(pinEnd1 	)
			//pinEnd1 = PHYSICS.v2_sum
			//pinEnd2 = {x: 0, y: 0};
			// Construct set of slingshot points
			//this.slingShotPoints = { first: {x: coinIntersect.x1, y: y1}, second: {x: coinIntersect.x2, y: y2} };
			*/
			var pin12cen = PHYSICS.v2_difference({x: mousePosition.x, y: mousePosition.y}, {x: pin1Pos.x, y: pin1Pos.y});
			var pin22cen = PHYSICS.v2_difference({x: mousePosition.x, y: mousePosition.y}, {x: pin2Pos.x, y: pin2Pos.y});

			var pin2cen_len = PHYSICS.v2_magnitude(pin12cen);

			var l = Math.sqrt((pin2cen_len * pin2cen_len) - (this.coinType.radius * this.coinType.radius));

			var alpha = Math.atan2(this.coinType.radius, l);

			var gamma1 = Math.atan2(pin12cen.y, pin12cen.x);
			var gamma2 = Math.atan2(pin22cen.y, pin22cen.x);

			var beta1 = gamma1 - alpha;
			var beta2 = gamma2 + alpha;

			var pinEnd1 = {x: Math.cos(beta1) * l + pin1Pos.x, y: Math.sin(beta1) * l + pin1Pos.y};
			var pinEnd2 = {x: Math.cos(beta2) * l + pin2Pos.x, y: Math.sin(beta2) * l + pin2Pos.y};

			var pin12pinEnd1 = PHYSICS.v2_difference(pinEnd1, pin1Pos);
			var pin12pinEnd1_dir = PHYSICS.v2_normalize(pin12pinEnd1);

			var pin22pinEnd2 = PHYSICS.v2_difference(pinEnd2, pin2Pos);
			var pin22pinEnd2_dir = PHYSICS.v2_normalize(pin22pinEnd2);


			// Find intersection of pin paths to draw the arc
			// Slopes of pin paths
			var m1 = pin12pinEnd1_dir.y / pin12pinEnd1_dir.x;
			var m2 = pin22pinEnd2_dir.y / pin22pinEnd2_dir.x;

			// Use pinEnds as the points, m1 and m2 as the slopes - point-slope form
			// pinEnd1 - subscript 1, pinEnd2 - subscript 2
			var iX = (pinEnd2.y - m2 * pinEnd2.x + m1 * pinEnd1.x - pinEnd1.y) / (m1 - m2); // IntersectionX

			// Plug in iX in any of the original equations to find iY
			// For simplicity, plug it into the "first" (pinEnd1) equation
			var iY = m1 * (iX - pinEnd1.x) + pinEnd1.y;

			var pinPathIntersection = {x: iX, y: iY};


			//var arc = {x: (mousePosition.x) + travelDirection.x * arcOffset, y: (mousePosition.y) + travelDirection.y * arcOffset};
			var pinArcOffset = this.coinType.radius * 100;
			var pinArc1 = {x: (pinEnd1.x) + pin12pinEnd1_dir.x * pinArcOffset, y: (pinEnd1.y) + pin12pinEnd1_dir.y * pinArcOffset};


			// CALCULATE MOVEMENT INFORMATION
			var release = PHYSICS.v2_difference({x: this.position.x, y: this.position.y}, {x: mousePosition.x, y: mousePosition.y});
			var releaseDirection = PHYSICS.v2_normalize(release);
			var releaseMagnitude = PHYSICS.v2_magnitude(release);

			// Calculate the elastic potential energy of the slingshot
			var releaseElasticPotentialEnergy = PHYSICS.CalculateElasticPotentialEnergy(this.slingshotSpringConstant, releaseMagnitude);


			this.slingShotPoints = {coinCircle: {first: p, second: q}, ghostCircle:
				{first: r, second: s}, coinCenters: {coin: this.position, ghostCoin: mousePosition},
				pins: {first: pin1Pos, second: pin2Pos }, pinEnds: {first: pinEnd1, second: pinEnd2},
				 arc: {first: pinEnd1, second: pinPathIntersection, third: pinEnd2},
				 releaseInfo: {releaseDirection: releaseDirection, releaseElasticPotentialEnergy: releaseElasticPotentialEnergy, releaseMagnitude: releaseMagnitude}};




			//this.pinSprite1.x = arcFirst.x;//this.slingShotPoints.arc.first.x;
			//this.pinSprite1.y = arcFirst.y;//this.slingShotPoints.arc.first.y;

			//this.pinSprite2.x = this.slingShotPoints.ghostCircle.second.x;
			//this.pinSprite2.y = this.slingShotPoints.ghostCircle.second.y;

			// Update ghost coin (texture will rest a few pixels away from border)
			//this.ghostCoinSprite.x = (this.position.x + (travelDirection.x * PHYSICS.v2_magnitude(mousePosition) * 0.8)) - this.coinType.radius;
			//this.ghostCoinSprite.y = (this.position.y + (travelDirection.y * PHYSICS.v2_magnitude(mousePosition) * 0.8)) - this.coinType.radius;


			// UPDATE GHOST COIN:
			// TODO: Manage ghostCoin?
			this.ghostCoinSprite.x = (mousePosition.x - this.coinType.radius);
			this.ghostCoinSprite.y = (mousePosition.y - this.coinType.radius);

			// UPDATE PINS:
			// TODO:  REACTIVATE THESE
			this.pinSprite1.x = pin1Pos.x - this.pinWidth / 2;
			this.pinSprite1.y = pin1Pos.y - this.pinHeight / 2;

			this.pinSprite2.x = pin2Pos.x - this.pinWidth / 2;
			this.pinSprite2.y = pin2Pos.y - this.pinHeight / 2;

			//this.pinSprite1.x = pinEnd1.x;
			//this.pinSprite1.y = pinEnd1.y;

			//this.pinSprite2.x = pinEnd2.x;
			//this.pinSprite2.y = pinEnd2.y;

			// UPDATE POUCH:
			}
		}

	};

	this.renderSlingshot = function()
	{

		this.graphics.lineStyle(8, 0xad8c80, 1); // STRING COLOR
		//this.graphics.lineStyle(8, 0x5b1f09, 0.75);

		// RENDER EXTRA ASSETS:

		// DRAW BAREBONES
		// never render barebones
		if(this.renderSlingShotBarebones)
		{
			// Draw antennas (first)
			this.graphics.moveTo(this.renderer.plugins.interaction.mouse.global.x, this.renderer.plugins.interaction.mouse.global.y);
			this.graphics.lineTo(this.slingShotPoints.coinCircle.first.x, this.slingShotPoints.coinCircle.first.y);

			// Draw second antenna
			this.graphics.moveTo(this.renderer.plugins.interaction.mouse.global.x, this.renderer.plugins.interaction.mouse.global.y);
			this.graphics.lineTo(this.slingShotPoints.coinCircle.second.x, this.slingShotPoints.coinCircle.second.y);
		}

		// Draw (parallel) lines connecting arc to coin

		// First one
		//this.graphics.moveTo(this.slingShotPoints.ghostCircle.first.x, this.slingShotPoints.ghostCircle.first.y);
		this.graphics.moveTo(this.slingShotPoints.pinEnds.first.x, this.slingShotPoints.pinEnds.first.y);
		this.graphics.lineTo(this.slingShotPoints.pins.first.x, this.slingShotPoints.pins.first.y);

		// Second one
		this.graphics.moveTo(this.slingShotPoints.pinEnds.second.x, this.slingShotPoints.pinEnds.second.y);
		this.graphics.lineTo(this.slingShotPoints.pins.second.x, this.slingShotPoints.pins.second.y);


		//Draw GEOMETRICAL pouch (semicircle)
		//this.graphics.lineStyle(4, 0x654321, 1); // POUCH COLOR
		//this.graphics.moveTo(this.slingShotPoints.ghostCircle.first.x, this.slingShotPoints.ghostCircle.first.y);

		// IMPORTANTE
		this.graphics.moveTo(this.slingShotPoints.arc.first.x, this.slingShotPoints.arc.first.y);
		this.graphics.arcTo(this.slingShotPoints.arc.second.x, this.slingShotPoints.arc.second.y, this.slingShotPoints.arc.third.x, this.slingShotPoints.arc.third.y, this.coinType.radius);

		this.graphics.moveTo(this.slingShotPoints.arc.third.x, this.slingShotPoints.arc.third.y);
		this.graphics.arcTo(this.slingShotPoints.arc.second.x, this.slingShotPoints.arc.second.y, this.slingShotPoints.arc.first.x, this.slingShotPoints.arc.first.y, this.coinType.radius);

		//this.graphics.arcTo(this.slingShotPoints.arc.x, this.slingShotPoints.arc.y, this.slingShotPoints.pinEnds.second.x, this.slingShotPoints.pinEnds.second.y, this.coinType.radius);


		this.graphics.endFill();
		//this.graphics.clear();
	}

	this.renderPins = function()
	{
		// RENDER PINS
		this.graphics.lineStyle(0, 0, 0);
		this.graphics.beginFill(0xfff000, 1);

		this.graphics.drawCircle((this.pinSprite1.position.x + this.pinSprite1.width / 2), (this.pinSprite1.position.y + this.pinSprite1.height / 2), this.pinSprite1.width / 2);
		this.graphics.drawCircle((this.pinSprite2.position.x + this.pinSprite2.width / 2), (this.pinSprite2.position.y + this.pinSprite1.height / 2), this.pinSprite2.width / 2);
	}


	// Set input listeners
	// namespace changes inside event handler
	// LEAVEOFF:
	// NOTE:
	//this.sprite.on('mousedown', function(e){  });
	//this.sprite.on('mouseup', this.onMouseUp);


	this.fieldCollision = function()
	{



        this.velocity.x *= -1;

        this.velocity.y *= -1;

				// TODO: Implement proper wall collisions:
				/*for (Wall w : (List<Wall>)getObjects(Wall.class))
{

    if (w.intersectsCircle((int)newX, (int)newY, b.getRadius()))
    {
        double angle = Math.toDegrees(Math.atan2(vy, vx));
        int normalAngle = w.getNormalAngle((int)newX, (int)newY, b.getRadius());
        angle = 2 * normalAngle - 180 - angle;
        double mag = 0.9 * Math.hypot(vx, vy);

        vx = Math.cos(Math.toRadians(angle)) * mag;
        vy = Math.sin(Math.toRadians(angle)) * mag;
    }
}
				*/

	}

	this.update = function()
	{

		// SLINGSHOT RELATED

			// Update slingshot (if needed)

			//console.log("X: " + this.position.x + " | Y: " + this.position.y);
			//this.updateSlingshot();
			// Sprite or Alpha Sprite?
			// TODO: make this a local variable in this
			var mousePosition =  stage.toLocal(this.renderer.plugins.interaction.mouse.global);


			// TODO: Make this its own function
			if(this.isSlingshot)
			{
				if(this.ghostCoinSprite.x < this.field.width-this.coinType.radius && this.ghostCoinSprite.x > 0+this.coinType.radius && this.ghostCoinSprite.y < this.field.height-this.coinType.radius && this.ghostCoinSprite.y > 0+this.coinType.radius)
				{
						//if(this.ghostCoinSprite.x < this.field.width-this.coinType.radius && this.ghostCoinSprite.x > 0+this.coinType.radius && this.ghostCoinSprite.y < this.field.height-this.coinType.radius && this.ghostCoinSprite.y > 0+this.coinType.radius)
					//mousePosition.x =
					this.updateSlingshot();
				}

				//this.updateSlingshot();
					//this.mainSpriteContainer.visible = false;
					//console.log("UPDATING SLINGSHOT");
					// Half Alpha texture if slingshot is present
					this.sprite.texture = this.alphaTexture;
					//this.sprite.tint = 0x808080; NOTE: VIABLE OPTION
					this.ghostCoinSpriteContainer.visible = true;
					//this.pinSpriteContainer.visible = true;
					//this.graphicsContainer.visible = true;
			}
				console.log("X::: " + mousePosition.x + " + vs " + mousePosition.y);
			if(!this.isSlingshot)
			{
				//	this.mainSpriteContainer.visible = true;

					// Full Alpha texture if slingshot is not present
					this.sprite.texture = this.texture;
					//this.sprite.tint = 0xffffff;
					this.ghostCoinSpriteContainer.visible = false;
					this.pinSpriteContainer.visible = false;
					//this.graphicsContainer.visible = false;
			}


		// PHYSICS

			// Check for collisions against other coins
			CheckCollisions(this);

			// Check for collisions with field
			if(this.position.x + this.velocity.x > this.field.width - this.coinType.radius || this.position.x + this.velocity.x < this.coinType.radius)
			{
	        this.velocity.x *= -1;
	    }

			if(this.position.y + this.velocity.y > this.field.height - this.coinType.radius || this.position.y + this.velocity.y < this.coinType.radius)
			{
	        this.velocity.y *= -1;
	    }
			// Calculate Friction Force (Opposite vector of velocity)
			this.friction = {x: -this.velocity.x * FRICTION, y: -this.velocity.y * FRICTION};

			// Apply the Friction Force

			// f = m * a
			// a = f / m

			// Calculate the acceleration
		//	this.accel.x = this.force.x; /// this.coinType.mass;
			//this.accel.y = this.force.y; /// this.coinType.mass;

			// Accelerate to the velocity
			//this.velocity.x += this.accel.x;
			//this.velocity.y += this.accel.y;
			//this.a = {x: 0, y: 0};
			//this.a.x = this.velocity.x / this.coinType.mass;
			//this.a.y = this.velocity.y / this.coinType.mass;

			//this.velocity.x /= this.coinType.mass;
			//this.velocity.y /= this.coinType.mass;

			//this.velocity.x += this.a.x;
			//this.velocity.y += this.a.y;

			// Apply the friction force
			this.velocity.x *= 0.9;
			this.velocity.y *= 0.9;


			if(this.coinType.id == "q")
			{
				//console.log('d');
				//world.pivot.x = this.position.x;
				//world.pivot.y = this.position.y;
			}
			//this.force.x += 0.4;
			//this.force.y += 0.4;


			// Velocity Verlet integration
			/*
			this.lastAccel.x = this.accel.x;
			this.lastAccel.y = this.accel.y;

			this.position.x += this.velocity.x + (0.5 * this.lastAccel.x);
			this.position.y += this.velocity.y + (0.5 * this.lastAccel.y);

			this.newAccel.x = this.force.x / this.coinType.mass;
			this.newAccel.y = this.force.y / this.coinType.mass;

			this.avgAccel.x = (this.lastAccel.x + this.newAccel.x) / 2;
			this.avgAccel.y = (this.lastAccel.y + this.newAccel.y) / 2;

			this.velocity.x += this.avgAccel.x;
			this.velocity.y += this.avgAccel.y;
*/

			// Handle floating point errors
			if(Math.abs(this.velocity.x) < TRIVIAL)
			 	this.velocity.x = 0;

			if(Math.abs(this.velocity.y) < TRIVIAL)
				this.velocity.y = 0;

			// Update position
			this.position.x += this.velocity.x;
			this.position.y += this.velocity.y;

			// PIXI sprites render from top left corner, our position is center
			// Update sprite and alphaSprite
			this.sprite.x = this.position.x - this.coinType.radius;
			this.sprite.y = this.position.y - this.coinType.radius;

			//this.alphaSprite.x = this.position.x - this.coinType.radius;
			//this.alphaSprite.y = this.position.y - this.coinType.radius;

	};

	this.render = function()
	{
		// WITHOUT TEXTURES ON:
		// TODO: Outline?
		//graphics.lineStyle(0);
	//	graphics.beginFill(this.coinType.color);
	//	graphics.drawCircle(this.position.x, this.position.y, this.coinType.radius);
		//graphics.endFill();

		// Clear screen
		this.graphics.clear();

		// Render slingshot (if needed)

		if(this.isSlingshot)
		{
			this.renderSlingshot();
		}

		// Render Ghost Coin
		// stage.removeChild(this.graphics);
 	  // stage.removeChild(this.ghostCoinSprite);

		// TODO: PICK THESE COLORS
		//this.graphics.beginFill(0x2b1d0e, 0.9); // POUCH COLOR


		// For now, make mainCoinSprite alpha-transparent
		//this.graphics.beginFill(0xffffff, 0.75);

		//this.graphics.drawCircle(this.position.x, this.position.y, this.coinType.radius);

		//this.graphics.endFill();

		//stage.addChildAt(this.ghostCoinSprite, stage.children.length - 1);
	//	stage.addChildAt(this.graphics, stage.children.length - 1);


	};

	this.setVelocity = function(v2_velocity)
	{
		this.velocity = v2_velocity;
	}

	this.setPosition = function(v2_position)
	{
		this.position = v2_position;
	}

}

function onMouseDown(eventData)
{
	//console.log("CLICK");
}


function init()
{

	// Init new Camera
	cam = new Camera(stage);

	// Make a new Field
	field = new Field(fieldGraphics, 3800 + 30, 950+950+250, 0x000000, 0xFF0000, 10);

	field.render(); // call once

	testCoin = new Coin({radius: 75, restitution: 0.9, mass: 11, staticFriction: 0.72
		, dynamicFriction: 0.40, id: "q", speed: 2, color: 0xb7baae, texturePath:
		 "/client/res/textures/clipart/clipart_quarter_texture.png", alphaTexturePath:
		  "/client/res/textures/clipart/alpha/clipart_quarter_texture_alpha.png" },
			{x: 600, y: 600}, {x: -7, y: -7}, field, mainCoinContainer, pinContainer,
			ghostCoinContainer, world, renderer, graphicsContainer);

		 //testCoin.init_pixi_procedure(mainCoinContainer, pinContainer, 0, stage, renderer);


	COIN_LIST.push(testCoin);
	PLAYER_COIN_LIST.push(testCoin);
	//stage.addChild(testCoin.sprite);

	testCoin2 = new Coin({radius: 60,  restitution: 1.0, mass: 9, staticFriction:
		 0.70, dynamicFriction: 0.38, id: "n", speed: 4, color: 0x959693, texturePath:
		  "/client/res/textures/clipart/clipart_nickel_texture.png", alphaTexturePath:
			 "/client/res/textures/clipart/alpha/clipart_nickel_texture_alpha.png" },
			 {x: 200, y: 200}, {x: -0, y: -0}, field, mainCoinContainer, pinContainer,
			 ghostCoinContainer, world, renderer, graphicsContainer);


	COIN_LIST.push(testCoin2);


	testCoin3 = new Coin({radius:	 50,  restitution: 1.1, mass: 7, staticFriction:
		0.54, dynamicFriction: 0.39, id: "p", speed: 6, color: 0xad6f69, texturePath:
		"/client/res/textures/clipart/clipart_penny_texture.png", alphaTexturePath:
		 "/client/res/textures/clipart/alpha/clipart_penny_texture_alpha.png" },
		 {x: 900, y: 900}, {x: -0, y: -0}, field, mainCoinContainer, pinContainer,
		 ghostCoinContainer, world, renderer, graphicsContainer);


	COIN_LIST.push(testCoin3);
	PLAYER_COIN_LIST.push(testCoin3);

	//stage.addChild(testCoin.sprite);

	gameLoop();
}

// TODO: Make sure all scripts have a "main"

function gameLoop()
{
		requestAnimationFrame(gameLoop);

		update();
		render();
}

function Camera(world)
{

		// Min + Max zoom of the camera
		this.zoomFov = 0.5 // minZoom, maxZoom = UNIT_SCALE +- this.zoomFov

		this.minZoom = 1 - this.zoomFov;
		this.maxZoom = 1 + this.zoomFov;


		this.pivot = {x: world.pivot.x, y: world.pivot.y};

		this.zoom = {x: world.scale.x,
			y: world.scale.y };

			//TODO: adjust this maybe?
			this.zoom.x = this.minZoom;
			this.zoom.y = this.minZoom;

//console.log(this.zoom.x);
		this.move = function(dX, dY)
		{
			this.pivot.x += dX;
			this.pivot.y += dY;
		};

		this.setZoom = function(newZoom)
		{
			this.zoom.x = newZoom;
			this.zoom.y = newZoom;
		};

		this.update = function()
		{
			// Position
			world.pivot.x = this.pivot.x;
			stage.pivot.y = this.pivot.y;

			// Zoom
			if(this.zoom.x >= this.maxZoom) this.zoom.x = this.maxZoom;
			if(this.zoom.y >= this.maxZoom) this.zoom.y = this.maxZoom;
			if(this.zoom.x <= this.minZoom) this.zoom.x = this.minZoom;
			if(this.zoom.y <= this.minZoom) this.zoom.y = this.minZoom;


			world.scale.x = this.zoom.x;
			world.scale.y = this.zoom.y;


		};
}

function Field(graphics, width, height, fillColor, lineColor, thickness)
{
	// All fields will be drawn from (0,0)
	this.width = width;
	this.height = height;

	this.graphics = graphics;

	this.fillColor = fillColor;
	this.lineColor = lineColor;

	this.thickness = thickness;

	this.init = function()
	{

	}

	this.init();

	this.update = function()
	{

	}

	this.render = function()
	{
			this.graphics.beginFill(this.fillColor);

			this.graphics.lineStyle(this.thickness, this.lineColor);

			this.graphics.drawRect(0, 0, width, height);
	}

}


function update()
{
		//cam.move(2,2);
		//cam.zoom.x -= 0.001;
		//cam.zoom.y -= 0.001;

		MousePosition =  stage.toLocal(this.renderer.plugins.interaction.mouse.global);

		// Update all GameObjects
		testCoin.update();
		testCoin2.update();
		testCoin3.update();

		console.log(MousePosition.x);

		// Update Camera
		cam.update();


		//var mousePosition = {x: this.renderer.plugins.interaction.mouse.global.x, y: this.renderer.plugins.interaction.mouse.global.y};
		//stage.pivot.x+= 0.1; //= mousePosition.x;
		//stage.pivot.y++; //= mousePosition.y;

}

function render()
{
		// Clear canvas
		//graphics.clear();

		// Render game objects
		testCoin.render();
		testCoin2.render();
		testCoin3.render();

		// Render field
		//field.render();

		// Render scene
		renderer.render(stage);


}

// TODO: Implement mousewheel zoom
// Scrollwheel events
document.getElementById('canvas').onmousewheel = function(ev)
{
		console.log(ev);
		return false;
};

function CheckCollisions(coin)
{
	for(var i = 0; i < COIN_LIST.length; i++)
	{
			if(COIN_LIST[i] == coin)
			{
				continue;
			}

			//console.log(COIN_LIST[i].position);
			if(PHYSICS.CirclevsCircle({radius: coin.coinType.radius, position: coin.position}, {radius: COIN_LIST[i].coinType.radius, position: COIN_LIST[i].position}))
			{
				//console.log("COLLISION");
				var circobj_a = {velocity: coin.velocity, restitution: coin.coinType.restitution, mass: coin.coinType.mass, staticFriction: coin.coinType.staticFriction, dynamicFriction: coin.coinType.dynamicFriction, radius: coin.coinType.radius, position: coin.position};
				var circobj_b = {velocity: COIN_LIST[i].velocity, restitution: COIN_LIST[i].coinType.restitution, mass: COIN_LIST[i].coinType.mass, staticFriction: COIN_LIST[i].coinType.staticFriction, dynamicFriction: COIN_LIST[i].coinType.dynamicFriction, radius: COIN_LIST[i].coinType.radius, position: COIN_LIST[i].position};

				var manifold = {a: circobj_a, b: circobj_b, penetration: 0, normal: 0};
				PHYSICS.CirclevsCircle_M(manifold);
				//console.log(manifold.penetration);

				PHYSICS.ResolveCollision(manifold);

				// Change values
				// console.log(manifold.a.velocity);
				coin.velocity = manifold.a.velocity;
				COIN_LIST[i].velocity = manifold.b.velocity;

			}
			else
			{
				//console.log("NOT COLLIDING");
			}
	}
}
