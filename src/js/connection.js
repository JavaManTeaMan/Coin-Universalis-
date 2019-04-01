//
// Connection.js (Client)
Global = {};

var socket = io();

var SocketId = -1;
var GameId = -1;
var PlayerName = "";

var LobbyCanvas;
var LobbyCanvasCtx;

// Clear Session Storage every refresh
function ClearCache()
{
	sessionStorage.clear();
}

function JoinGame(gameId)
{
	socket.emit('join_game_request', {
		gameId: gameId,
		playerName: PlayerName
	});

	socket.on('join_game_request_response', function(data){

		// Game Found!
		// Connect to it...
		if(data.isGameJoinable)
		{
			console.log("Lobby with gameId: " + gameId + " found! (" + data.response + ")");
			console.log("Joining Game: " + data.gameId + " ...");

			GameId = data.gameId;
			SocketId = data.socketId;

			// Load into Lobby page
			EnterLobby();
		}

		// Game not found...
		else
		{
			console.log("Lobby with GameId: " + data.gameId + " is not joinable! (Reason: " + data.response + ")");
			console.log("Try hosting your own game, or join another");
			return;
		}
	});
}

function HostGame(maxPlayerCount)
{
	socket.emit('host_game_request', {
		maxPlayerCount: maxPlayerCount,
		playerName: PlayerName
	});

	socket.on('host_game_request_response', function(data){
		GameId = data.gameId;
		SocketId = data.socketId;
		console.log('GameId of hosted game is: ' + data.gameId);

		// Load into Lobby page
		EnterLobby();

	});
}

function EnterLobby()
{
	// Before loading into another page, store key globals so that lobby.html scripts can access them
	// => socket

	// To serialize socket, we need to build an object
	//var obj = {gold: socket};

	// Serialize the obj now
	//sessionStorage.setItem('S_socket_obj', JSON.stringify(socket));

	// => SocketId, GameId, PlayerName
	sessionStorage.setItem('S_GameId', JSON.stringify(GameId));
	sessionStorage.setItem('S_SocketId', JSON.stringify(SocketId));
	sessionStorage.setItem('S_PlayerName', PlayerName);

	// Load into lobby
	window.location.href = "/client/src/html/lobby.html";

}

// Events from buttons //////////////////////////////////////
function JoinGameEvent()
{
	//todo: handle false inputs
	PlayerName = (document.getElementsByName("NameField")[0].value);
	JoinGame(Number(document.getElementsByName("JoinField")[0].value));
}

function HostGameEvent()
{
	//todo: handle false inputs
	PlayerName = (document.getElementsByName("NameField")[0].value);
	HostGame(Number(document.getElementsByName("HostField")[0].value));
}

window.ReadyButtonEvent = function()
{
	SendReadyRequest();
};
