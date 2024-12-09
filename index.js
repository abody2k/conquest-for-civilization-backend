import express from "express";
import {createClient} from "redis";
import { config } from "dotenv";
import {WebSocketServer} from "ws";
import {randomUUID} from "crypto";

config();
let players = new Map();


let numberOfRooms=0;


let client = createClient({
	username:"default",
	password:process.env.PASSWORD,
	socket:{
		host:process.env.HOST
		,port:process.env.PORT
	}
})
client.connect().then(async()=>{

	
	
	client.get("noOfRooms").then(async (d)=>{

	if(d){
		numberOfRooms = Number((await client.dbSize()))-2;
		client.set("noOfRooms",numberOfRooms);

		console.log(`number of rooms is ${numberOfRooms}`);
		// const rr = await client.get("m4gnzdj0");
		// console.log(JSON.parse(rr));
		
		// client.configSet("notify-keyspace-events","Ex")

	}else{
		await client.set("noOfRooms",0);
		console.log(`number of rooms is ${numberOfRooms}`);

	}

})
})

let app = express();

app.use(express.json());

let ws= new WebSocketServer({port:4001});


ws.on("connection",function conn(w){
	console.log("new connection");



w.on("open",function (){


	console.log("opened connecion");
	
})
// console.log(ws.clients);
	const playerID = randomUUID();

w.on("message",async function(d,b){
	
	// joining a room
	switch (d.toString().split(" ")[0]) {
		case "jr":
			//check if the room has less than 2 players
			let data = await client.get(d.toString().split(" ")[1]);
			if (data){
				data = JSON.parse(data);
				data.p = data.p.filter((x)=>players.has(x));
				
				if (data.p<2){
					// join the room
					//update the room info
					
					players.set(playerID,w); // add the socket to the list of players
					await client.set(d.toString().split(" ")[1]
						,JSON.stringify({
							p:[...data.p,playerID],// generate an ID for each player
							t:0,// current turn
							u:[] // units
						}),
						{EX:(60*10)});
						w.send("jr "+playerID); // give the player his ID
						//the player should be waiting for the other player
						//if there are 2 players now the game should get started
						if (data.p==1){//somebody is already there
							//start the game !
							players.get(data.p[0]).send("gs 1"); //1 stands for your turn
							w.send("gs 0");
							console.log("room is full now");
							
							
						}



				}
			}
			break;
	
		default:
			break;
	}
	console.log("new msg");
	
	console.log([d.toString(),b]);
	
});

w.on("close",function(n,r){

	console.log("closed connection");
	players.delete(playerID);

	console.log(n,r);
	
})


});

//make a new match
//and return the matchID, new player ID to the player, add matchID to the lobby
//
app.get("/nm",async (req,res)=>{



	if (numberOfRooms>process.env["MAX-CONNECTIONS"]){
		res.sendStatus(403);
		return;
	}
	
try {


	await client.set("noOfRooms",numberOfRooms+1);
	++numberOfRooms;
	//creating a new room
	//once both players leave the room the room is deleted
	//also if the room has not been active for 5 mins the room is deleted
	const roomTitle=(new Date()).getTime().toString(36);
	console.log(roomTitle);

	
	
	await client.set(roomTitle
	,JSON.stringify({
		p:[],// generate an ID for each player
		t:0,// current turn
		u:[] // units
	}),
	{EX:(60*5)});

	res.send({

		r:roomTitle
	})




} catch (error) {


	res.sendStatus(403);
	return;

}



});


//join a room
app.post("/jr",(req,res)=>{

	//check if the room is empty
	




})



app.listen(4000,()=>{


	console.log("server is on");
	
	
})