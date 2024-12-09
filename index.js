import express from "express";
import {createClient} from "redis";
import { config } from "dotenv";
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
		

	}else{
		await client.set("noOfRooms",0);
		console.log(`number of rooms is ${numberOfRooms}`);

	}

})
})

let app = express();

app.use(express.json());


//make a new match
//and return the matchID, new player ID to the player, add matchID to the lobby
//
app.get("/nm",(req,res)=>{



	if (numberOfRooms>process.env["MAX-CONNECTIONS"]){
		res.sendStatus(403);
		return;
	}
	

	res.sendStatus(200)





});


//join a room
app.post("/jr",(req,res)=>{

	//check if the room is empty
	




})



app.listen(4000,()=>{


	console.log("server is on");
	
})