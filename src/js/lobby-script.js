//
// lobby-script.js (CLIENT)

// GLOBAL VARIABLES

// Create new instance of socket
//	var socket = io();

// "Decode" sessionStorage globals
//var socketObj = JSON.parse(sessionStorage.getItem('S_socket_obj'));
//console.log("SOCKETOBJ IS: " +	 socketObj);
//var socket = socketObj.socket;
// CONSTS
var UPDATE_LOOP_TICK = 1000 / 30;

var socket = io();
var SocketId = JSON.parse(sessionStorage.getItem('S_SocketId'));
var GameId = JSON.parse(sessionStorage.getItem('S_GameId'));
var PlayerName = sessionStorage.getItem('S_PlayerName');

// Kindly log all globals just decoded...
console.log("GameId: " + GameId);
console.log("SocketId: " + SocketId);
console.log("Player Name: " + PlayerName);



// ONLOAD
window.onload = function()
{
		// Clear sessionStorage
		sessionStorage.clear();
}

setInterval(function(){
	GetPlayerList();
}, UPDATE_LOOP_TICK);

// todo: update playerlist (setinterval)

// Listen for disconnections
// todo: (have server send a disconnect request, print it)
socket.on('disconnect_response', function(data){
    console.log(data.playerName + " with SocketId: " + data.socketId + " has disconnected.");
});


// Listen for Start Game packets
socket.on('start_game_response', function(data){
    console.log("GAME STARTED!");
    // Save variables again? ( <- Do we need to do this?)

		// todo: maybe add a warning to the user (wait 5.4.3.2.1 seconds)?

    // Load into canvas.html
		window.location.href = "/client/src/html/canvas.html"

});

function Disconnect()
{
  socket.emit('disconnect_request', {
      socketId: SocketId,
      gameId: GameId,
      playerName: PlayerName
  });

  // No response
}

function DisplayPlayerList()
{
}

function DisplayGameInformation()
{
	// HTML DESIGNER
	//console.log("Game " + data.gameId + " (" + data.currentPlayerCount + " / " + data.maxPlayerCount + " players) is in state of: " + data.gameState);
}

// Getters of info
function GetPlayerList()
{
	console.log("Requesting list of players from server...");

	// Send out request
	socket.emit('player_list_request', {
			socketId: SocketId,
			gameId: GameId,
			playerName: PlayerName
	});

	// Receive response
	socket.on('player_list_request_response', function(data) {
    // Print out response
			var x = 0;
      for(var i in data)
    	{
    		// Map of player properties (for HTMl designer) \\
    		// Player Name: data[i].playerName
    		// SocketId: data[i].socketId
    		// IsReady: data[i].isReady

    		// for now... just console.log these
				// HTML DESIGNER DO THESE
    		console.log(data[i].playerName + " with SocketId: " + data[i].socketId + " with Ready Status:  " + data[i].isReady);
				x++;
			}
	});
}

// Get information about any game (useful)
function GetGameInformation(gameId)
{
	console.log("Requesting information about the connected game...");

	// Send out request
	socket.emit('game_info_request', {gameId: gameId});

	// Get response
	socket.on('game_info_request_response', function(data){
			return data;
	});

}

function SendReadyRequest(isReady)
{
	console.log("Sending Ready value of " + isReady + " to server...");
	socket.emit('ready_update_request', {
		socketId: SocketId,
		gameId: GameId,
		playerName: PlayerName,
		ready: isReady
	});
}


// EVENTS
function ReadyButtonEvent()
{
	SendReadyRequest(true);
}

function UnReadyButtonEvent()
{
	SendReadyRequest(false);
}

function PlayerListButtonEvent()
{
	// Get and Display player information
	//DisplayPlayerList();
  GetPlayerList();
}

function GameInformationButtonEvent()
{
	// Get and Display game information
	var gameInfo = GetGameInformation();
	DisplayGameInformation(gameInfo);
}

function DisconnectButtonEvent()
{
  Disconnect();
}

function DebugButtonEvent()
{
	window.location.href = "/client/src/html/canvas.html";
}

// Utils
function sizeof( object ) {

    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}
