
import { DurableObject } from "cloudflare:workers";
import { Hono } from 'hono';


export interface Env {
    MY_AirSeating: DurableObjectNamespace;      
}

const app = new Hono<{ Bindings: Env }>()


// Manages seat assignment for a flight.
// This is an RPC interface. The methods can be called remotely by other Workers
// running anywhere in the world. All Workers that specify same object ID
// (probably based on the flight number and date) will reach the same instance of
// AirSeating.
export class AirSeating extends DurableObject {
	
	private sql: any;

	constructor(ctx: DurableObjectState, env: { [key: string]: any }) {
		super(ctx, env);
		this.sql = this.ctx.storage.sql;
	}

	// Application calls this when the flight is first created to set up the seat map.
	initializeFlight(seatList: string[]): void {
		this.sql.exec(`
			CREATE TABLE IF NOT EXISTS seats (
				seatId TEXT PRIMARY KEY,  -- e.g. "3B"
				occupant TEXT             -- null if available
			)
		`);

		// Query returns a cursor.
		const cursor = this.sql.exec(`SELECT seatId FROM seats`);

		for (const seat of seatList) {
			this.sql.exec(`INSERT OR IGNORE INTO seats VALUES (?, null)`, seat)
		}
	}

	// Update all the rows of occupant column to null
	resetAll(): void {
		this.sql.exec(`UPDATE seats SET occupant = null;`);
	}

	// Get a list of available seats.
	getAvailable(): string[] {
		const results: string[] = [];
	
		// Query returns a cursor.
		const cursor = this.sql.exec(`SELECT seatId FROM seats WHERE occupant IS NULL`);
	
		// Cursors are iterable.
		for (const row of cursor) {
		  results.push(row.seatId);
		}
	
		return results;
	}

	// Assign passenger to a seat.
	assignSeat(seatId: string, occupant: string): string {
		// Check that seat isn't occupied.
		const cursor = this.sql.exec(`SELECT occupant FROM seats WHERE seatId = ?`, seatId);
		const result = [...cursor][0];  // Get the first result from the cursor.
		let response: string
		if (!result) {
		  response = "No such seat: " + seatId;
		  return response
		}
		if (result.occupant !== null) {
		  response = "Seat is occupied: " + seatId;
		  return response
		}
	
		// If the occupant is already in a different seat, remove them.
		this.sql.exec(`UPDATE seats SET occupant = null WHERE occupant = ?`, occupant);
	
		// Assign the seat.
		this.sql.exec(`UPDATE seats SET occupant = ? WHERE seatId = ?`, occupant, seatId);

		response = "ok"
		return response
	}

	// Get passenger of a seat.
	getOccupant(seatId: string): string {
		// Check that seat isn't occupied.
		const cursor = this.sql.exec(`SELECT occupant FROM seats WHERE seatId = ?`, seatId);
		const result = [...cursor][0];  // Get the first result from the cursor.

		if (!result) {
		  return "No such seat: " + seatId;
		}
		  
		return result.occupant
	}

}

// Hono routes for ticket-related operations
app.get('/', async (c) => {
	// Create an instance of the Durable Object
	const id = c.env.MY_AirSeating.idFromName("example");
	const obj = c.env.MY_AirSeating.get(id);

	const seats: string[] = ["1A", "1B", "1C", "2A", "2B", "2C", "3A", "3B", "3C"]
	await obj.initializeFlight(seats)

	return c.json({
		"/": "Initialize with the following seats: 1A, 1B, 1C, 2A, 2B, 2C, 3A, 3B and 3C",
		"/get-available-seats": "Get all the available seats now",
		"/assign-seat": "Assign a seat to a given passenger: /assign-seat?seatId=3B&occupant=John",
		"/reset-all": "Reset all the seats to null",
		"/get-occupant": "Get which passenger is in a given seat: /get-occupant?seatId=3B"
	});
  },
);

app.get('/get-available-seats', async (c) => {
	// Create an instance of the Durable Object
	const id = c.env.MY_AirSeating.idFromName("example");
	const obj = c.env.MY_AirSeating.get(id);

	const availableSeats = await obj.getAvailable();
	return c.text("The list of available seat: " + availableSeats);
  },
);

app.get('/assign-seat', async (c) => {
	// Create an instance of the Durable Object
	const id = c.env.MY_AirSeating.idFromName("example");
	const obj = c.env.MY_AirSeating.get(id);

	const seatId = c.req.query('seatId');
	const occupant = c.req.query('occupant');
	if (!seatId || !occupant) {
		return c.text('Missing query string: /assign-seat?seatId=3B&occupant=John', 400);
	}

	const response = await obj.assignSeat(seatId, occupant)

	if (response == "ok") {
		return c.json({
			Status: 'Success',
			message: 'Seat assignment successful',
			seatId: seatId,
			occupant: occupant
		});
	}else{
		return c.json({
			Status: 'Failed',
			message: response,
		});
	}
  },
);

app.get('/reset-all', async (c) => {
	// Create an instance of the Durable Object
	const id = c.env.MY_AirSeating.idFromName("example");
	const obj = c.env.MY_AirSeating.get(id);

	await obj.resetAll();
	return c.text("All seats are now available");
  },
);

app.get('/get-occupant', async (c) => {
	// Create an instance of the Durable Object
	const id = c.env.MY_AirSeating.idFromName("example");
	const obj = c.env.MY_AirSeating.get(id);

	const seatId = c.req.query('seatId');
	if (!seatId ) {
		return c.text('Missing query string: /get-occupant?seatId=3B', 400);
	}

	const occupant = await obj.getOccupant(seatId);
	return c.json({
		seatId: seatId,
		occupant: occupant
	});
  },
);

export default app;