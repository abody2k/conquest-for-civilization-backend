import express from "express";
import {createClient} from "redis";
import { config } from "dotenv";
import {WebSocketServer} from "ws";

config();



let numberOfRooms=0;


let client = createClient({
	username:"default",
	password:process.env.PASSWORD,
	socket:{
		host:process.env.HOST
		,port:process.env.PORT
	}
})
client.connect().then(()=>{

	client.get("noOfRooms").then(async (d)=>{

	if(d){
		numberOfRooms = Number(d);
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
w.on("message",function(d,b){
	console.log("new msg");
	
	console.log([d.toString(),b]);
	
});

w.on("close",function(n,r){

	console.log("closed connection");
	
	console.log(n,r);
	
})

setInterval(()=>{w.send("مرحبا")},1000)

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
	const playerID=((new Date()).getTime()+10).toString(36);//first player
	const roomTitle=(new Date()).getTime().toString(36);
	console.log(playerID);
	console.log(roomTitle);

	
	
	await client.set(roomTitle
	,JSON.stringify({
		p:[playerID],// generate an ID for each player
		ir:0,// ppl in room
		t:playerID,// current turn
		u:[] // units
	}),
	{EX:(60*5)});

	res.send({

		i:playerID,
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