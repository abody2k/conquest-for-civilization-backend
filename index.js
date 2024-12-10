import express from "express";
import { createClient } from "redis";
import { config } from "dotenv";
import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";
import { makeUnit, units } from "./units.js";

config();
let players = new Map();


let numberOfRooms = 0;


let client = createClient({
	username: "default",
	password: process.env.PASSWORD,
	socket: {
		host: process.env.HOST
		, port: process.env.PORT
	}
})
client.connect().then(async () => {



	client.get("noOfRooms").then(async (d) => {

		if (d) {
			numberOfRooms = Number((await client.dbSize())) - 2;
			client.set("noOfRooms", numberOfRooms);

			console.log(`number of rooms is ${numberOfRooms}`);
			console.log(await client.get("m4i5alv6"));

			// const rr = await client.get("m4gnzdj0");
			// console.log(JSON.parse(rr));

			// client.configSet("notify-keyspace-events","Ex")

		} else {
			await client.set("noOfRooms", 0);
			console.log(`number of rooms is ${numberOfRooms}`);

		}

	})
})

let app = express();

app.use(express.json());

let ws = new WebSocketServer({ port: 4001 });


ws.on("connection", function conn(w) {
	console.log("new connection");



	w.on("open", function () {


		console.log("opened connecion");

	})
	// console.log(ws.clients);
	const playerID = randomUUID();

	w.on("message", async function (d, b) {

		// joining a room
		if (d.toString().split(" ")[0] == "jr") {

			//check if the room has less than 2 players
			let data = await client.get(d.toString().split(" ")[1]);
			if (data) {
				players.set(playerID, w); // add the socket to the list of players	
				data = JSON.parse(data);

				data.p = data.p.filter((x) => players.has(x));

				if (data.p.length < 2) {
					// join the room
					//update the room info
					data.p = [...data.p, playerID];

					console.log(data.p);



					w.send("jr " + playerID); // give the player his ID
					//the player should be waiting for the other player
					//if there are 2 players now the game should get started
					if (data.p.length == 2) {//somebody is already there
						//start the game !
						await client.set(d.toString().split(" ")[1]
							, JSON.stringify({
								p: data.p,// generate an ID for each player
								t: 0,// current turn
								u: [], // units
								c: [1000, 1000]
							}),
							{ EX: (60 * 10) });
						console.log("game started");

						players.get(data.p[0]).send("gs 1 " + data.p[0]); //1 stands for your turn
						w.send("gs 0 " + playerID);


					} else {
						await client.set(d.toString().split(" ")[1]
							, JSON.stringify({
								p: data.p,// generate an ID for each player
								t: 0,// current turn
								u: [] // units

							}),
							{ EX: (60 * 10) });
					}



				} else {
					w.close();
				}
			}
		} else if (d.toString().split(" ")[0] == "mu") {// "mu roomID unitID playerNumber" make a unit given the room and userID

			let data2 = await client.get(d.toString().split(" ")[1]);


			if (data2) {
				data2 = JSON.parse(data2);
				console.log("making a unit");

				console.log(data2);


				console.log("passed the check");


				data2.u = [...data2.u, makeUnit((Number(d.toString().split(" ")[3]) == 0 ? [0, 0] : [20, 20]), Number(d.toString().split(" ")[2]), Number(d.toString().split(" ")[3]))];
				data2.c[Number(d.toString().split(" ")[3])] -= units[Number(d.toString().split(" ")[2])].p;
				await client.set(d.toString().split(" ")[1], JSON.stringify(data2));
				console.log(data2);
				console.log("updated the data");
				console.log(data2.p[0]);
				console.log(data2.p);
				console.log(players.keys());



				
				players.get(data2.p[0]).send(`mu ${d.toString().split(" ")[2]} ${d.toString().split(" ")[3]}`); // unit ID location
				players.get(data2.p[1]).send(`mu ${d.toString().split(" ")[2]} ${d.toString().split(" ")[3]}`);


			}



		} else if (d.toString().split(" ")[0] == "mv") {// movu roomID unitNumber playerNumber pos0,pos1 move a unit from one place to another 

			let data3 = await client.get(d.toString().split(" ")[1]);

			if (data3) {
				data3 = JSON.parse(data3);
				// if (players.get(data3.p[d.toString().split(" ")[3]]) != w) {
				// 	return;
				// }

				data3.u[Number(d.toString().split(" ")[2])].pos = d.toString().split(" ")[4].split(",");
				console.log(data3);
				console.log(data3.u[Number(d.toString().split(" ")[2])].pos);

				await client.set(d.toString().split(" ")[1], JSON.stringify(data3));
				players.get(data3.p[0]).send(`mu ${d.toString().split(" ")[2]} ${d.toString().split(" ")[3]}`); // unit ID location
				players.get(data3.p[1]).send(`mu ${d.toString().split(" ")[2]} ${d.toString().split(" ")[3]}`);



			}






			console.log("new msg");

			console.log([d.toString(), b]);

		}
	});

	w.on("close", function (n, r) {

		console.log("closed connection " + playerID);
		players.delete(playerID);

		console.log(n, r);

	})


});

//make a new match
//and return the matchID, new player ID to the player, add matchID to the lobby
//
app.get("/nm", async (req, res) => {



	if (numberOfRooms > process.env["MAX-CONNECTIONS"]) {
		res.sendStatus(403);
		return;
	}

	try {


		await client.set("noOfRooms", numberOfRooms + 1);
		++numberOfRooms;
		//creating a new room
		//once both players leave the room the room is deleted
		//also if the room has not been active for 5 mins the room is deleted
		const roomTitle = (new Date()).getTime().toString(36);
		console.log(roomTitle);



		await client.set(roomTitle
			, JSON.stringify({
				p: [],// generate an ID for each player
				t: 0,// current turn
				u: [] // units
			}),
			{ EX: (60 * 5) });

		res.send({

			r: roomTitle
		})




	} catch (error) {


		res.sendStatus(403);
		return;

	}



});


//join a room
app.post("/jr", (req, res) => {

	//check if the room is empty





})



app.listen(4000, () => {


	console.log("server is on");


})